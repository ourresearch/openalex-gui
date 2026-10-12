import { describe, it, expect } from 'vitest';
import { translateSearch, detectSource, methodsText } from '@/dbSearchTranslate';

// oxjob #1659: pasted PubMed / Scopus / Web of Science / Ovid / Embase / Cochrane / EBSCO searches -> OQL.
const oql = text => translateSearch(text)?.oql;
const refs = text => (translateSearch(text)?.changes || []).map(c => c.ref);

describe('leaves plain searches alone', () => {
  it.each([
    'asthma',
    'asthma AND children',
    '(asthma OR wheez*) AND child*',
    '"kelp forest" AND decline',
    '"smart phone"~3 AND addiction',
    'machine learning in healthcare',
    'covid-19 vaccine hesitancy',
    'HIV/AIDS treatment',
    'Smith J (2020) Title of a paper. Nature 12:3-4',
    'https://doi.org/10.1038/nature12373',
  ])('%s', text => {
    expect(translateSearch(text)).toBeNull();
  });
});

describe('detects the source database', () => {
  it.each([
    ['asthma[tiab] AND child*[tiab]', 'pubmed'],
    ['"Asthma"[Mesh]', 'pubmed'],
    ['kelp (All Fields) AND decline (All Fields)', 'pubmed'],
    ['TITLE-ABS-KEY(kelp)', 'scopus'],
    ['title-abs-key(kelp) AND PUBYEAR > 2015', 'scopus'],
    ['TS=(kelp AND decline)', 'wos'],
    ['(kelp or seaweed).ti,ab.', 'ovid'],
    ['1. exp Asthma/\n2. asthma.tw.\n3. 1 or 2', 'ovid'],
    ["'asthma'/exp OR asthma:ti,ab,kw", 'embase'],
    ['#1 MeSH descriptor: [Asthma] explode all trees\n#2 asthma:ti,ab,kw\n#3 #1 OR #2', 'cochrane'],
    ['(MH "Asthma+") OR TI asthma OR AB asthma', 'ebsco'],
  ])('%s -> %s', (text, source) => {
    expect(detectSource(text)).toBe(source);
  });
});

describe('fields', () => {
  it.each([
    // a source field that covers keywords -> title-abstract-keywords; one that doesn't -> title-abstract
    ['kelp[tiab] AND decline[tiab]', 'get works where title-abstract-keywords has (kelp AND decline)'],
    ['kelp[ti] AND decline[ti]', 'get works where title has (kelp AND decline)'],
    ['kelp[ab] AND decline[ab]', 'get works where abstract has (kelp AND decline)'],
    ['TITLE-ABS-KEY(kelp AND decline)', 'get works where title-abstract-keywords has (kelp AND decline)'],
    ['TITLE-ABS(kelp AND decline)', 'get works where title-abstract has (kelp AND decline)'],
    ['TITLE(kelp)', 'get works where title has (kelp)'],
    ['ABS(kelp)', 'get works where abstract has (kelp)'],
    ['TS=(kelp AND decline)', 'get works where title-abstract-keywords has (kelp AND decline)'],
    ['TI=kelp AND AB=decline', 'get works where title has (kelp) and abstract has (decline)'],
    ['(kelp or seaweed).ti,ab.', 'get works where title-abstract has (kelp OR seaweed)'],
    ['(kelp or seaweed).tw.', 'get works where title-abstract has (kelp OR seaweed)'],
    ['(kelp or seaweed).ti,ab,kf.', 'get works where title-abstract-keywords has (kelp OR seaweed)'],
    ['(kelp OR seaweed):ti,ab,kw', 'get works where title-abstract-keywords has (kelp OR seaweed)'],
    ["'kelp forest':ti,ab", 'get works where title-abstract has ("kelp forest")'],
    ['TI kelp AND AB decline AND TX forest', 'get works where title has (kelp) and abstract has (decline) and title-abstract-keywords has (forest)'],
    ['AFFIL(harvard) AND TITLE-ABS-KEY(kelp)', 'get works where raw affiliation has (harvard) and title-abstract-keywords has (kelp)'],
  ])('%s', (text, expected) => {
    expect(oql(text)).toBe(expected);
  });

  it('keeps each field on its own clause instead of flattening', () => {
    expect(oql('TITLE(kelp) OR ABS(seaweed)')).toBe('get works where title has (kelp) or abstract has (seaweed)');
  });

  it('a tag on a bracketed group covers every term in it, not only the last (Bascur 2022)', () => {
    expect(oql('(kelp or seaweed or algae).ti.')).toBe('get works where title has (kelp OR seaweed OR algae)');
    expect(oql('(kelp OR seaweed):ti')).toBe('get works where title has (kelp OR seaweed)');
  });

  it('a PubMed tag after several unquoted words covers the whole phrase', () => {
    expect(oql('Hand Injuries[tiab] AND therapy[tiab]')).toBe('get works where title-abstract-keywords has ("Hand Injuries" AND therapy)');
  });

  it('notes fields OpenAlex lacks', () => {
    expect(refs('KP=(kelp)')).toContain('fields');
    expect(refs('AUTHKEY(kelp)')).toContain('fields');
  });

  it('leaves out fields it cannot search, and says so', () => {
    const r = translateSearch('SRCTITLE(nature) AND TITLE-ABS-KEY(kelp)');
    expect(r.oql).toBe('get works where title-abstract-keywords has (kelp)');
    expect(r.changes.find(c => c.ref === 'fields').result).toBe('left out');
  });
});

describe('headings (MeSH, Emtree, subject headings)', () => {
  it.each([
    ['"Asthma"[Mesh]', 'get works where title-abstract-keywords has (asthma)'],
    ['Asthma/therapy[mh]', 'get works where title-abstract-keywords has (asthma)'],
    ['"Lung Neoplasms"[Mesh] AND smok*[tiab]', 'get works where title-abstract-keywords has (lung neoplasms AND smok*)'],
    ['exp Asthma/ or asthma.ti,ab.', 'get works where title-abstract-keywords has (asthma) or title-abstract has (asthma)'],
    ["'asthma'/exp", 'get works where title-abstract-keywords has (asthma)'],
    ['(MH "Asthma+")', 'get works where title-abstract-keywords has (asthma)'],
  ])('%s', (text, expected) => {
    expect(oql(text)).toBe(expected);
    expect(refs(text)).toContain('headings');
  });

  it('says when explosion is lost', () => {
    const h = translateSearch('exp Asthma/ or asthma.ti,ab.').changes.find(c => c.ref === 'headings');
    expect(h.why).toMatch(/explosion/);
  });

  it('drops the Humans/Animals filter idiom instead of searching the word "humans"', () => {
    const r = translateSearch('asthma[tiab] NOT (animals[mh] NOT humans[mh])');
    expect(r.oql).toBe('get works where title-abstract-keywords has (asthma)');
    expect(r.changes.map(c => c.ref)).toContain('limits');
  });

  it('keeps age groups: they are the population, not a filter', () => {
    expect(oql('asthma[tiab] AND "Child"[Mesh]')).toBe('get works where title-abstract-keywords has (asthma AND child)');
  });
});

describe('limits', () => {
  it.each([
    ['kelp[tiab] AND 2015:2020[dp]', 'get works where title-abstract-keywords has (kelp) and year >= (2015) and year <= (2020)'],
    ['kelp[tiab] AND ("2015/01/01"[PDAT] : "3000/12/31"[PDAT])', 'get works where title-abstract-keywords has (kelp) and year >= (2015)'],
    ['kelp[tiab] AND english[la]', 'get works where title-abstract-keywords has (kelp) and language is (en)'],
    ['kelp[tiab] AND review[pt]', 'get works where title-abstract-keywords has (kelp) and type is (review)'],
    ['diabet*[tiab] AND "randomized controlled trial"[pt]', 'get works where title-abstract-keywords has (diabet*) and study design is (randomized-controlled-trial)'],
    ['TITLE-ABS-KEY(kelp) AND PUBYEAR > 2014', 'get works where title-abstract-keywords has (kelp) and year >= (2015)'],
    ['TITLE-ABS-KEY(kelp) AND PUBYEAR < 2020', 'get works where title-abstract-keywords has (kelp) and year <= (2019)'],
    ['TITLE-ABS-KEY(kelp) AND (LIMIT-TO(DOCTYPE,"ar") OR LIMIT-TO(DOCTYPE,"re"))', 'get works where title-abstract-keywords has (kelp) and type is (article or review)'],
    ['TITLE-ABS-KEY(kelp) AND LIMIT-TO(LANGUAGE,"English")', 'get works where title-abstract-keywords has (kelp) and language is (en)'],
    ['TITLE-ABS-KEY(kelp) AND DOCTYPE(ar)', 'get works where title-abstract-keywords has (kelp) and type is (article)'],
    ['TS=(kelp) AND PY=(2000-2016)', 'get works where title-abstract-keywords has (kelp) and year >= (2000) and year <= (2016)'],
    ['TS=(kelp) AND DT=(Article OR Review)', 'get works where title-abstract-keywords has (kelp) and type is (article or review)'],
    ['TS=(kelp) AND LA=(English)', 'get works where title-abstract-keywords has (kelp) and language is (en)'],
  ])('%s', (text, expected) => {
    expect(oql(text)).toBe(expected);
  });

  it('notes limits with no OpenAlex equivalent', () => {
    const r = translateSearch('TITLE-ABS-KEY(kelp) AND LIMIT-TO(SUBJAREA,"ENVI")');
    expect(r.oql).toBe('get works where title-abstract-keywords has (kelp)');
    expect(r.changes.find(c => c.ref === 'limits').result).toBe('left out');
  });

  it('maps conference papers to articles, and says so', () => {
    const r = translateSearch('TITLE-ABS-KEY(kelp) AND LIMIT-TO(DOCTYPE,"cp")');
    expect(r.oql).toBe('get works where title-abstract-keywords has (kelp) and type is (article)');
    expect(r.changes.some(c => /conference/.test(c.why))).toBe(true);
  });
});

describe('proximity', () => {
  it.each([
    ['TITLE-ABS-KEY(smart W/3 phone)', 'get works where title-abstract-keywords has (smart and phone within 3 words of each other)'],
    ['TS=(kelp NEAR/5 decline)', 'get works where title-abstract-keywords has (kelp and decline within 5 words of each other)'],
    ['"kelp forest"[tiab:~3]', 'get works where title-abstract-keywords has (kelp and forest within 3 words of each other)'],
    // Ovid adj3 allows two words between
    ['(myocardial adj3 infarct$).ti,ab.', 'get works where title-abstract has ("myocardial" and "infarct*" within 2 words of each other)'],
    // adjacent in order: a phrase
    ['(heart adj attack).ti,ab.', 'get works where title-abstract has ("heart attack")'],
    ['TITLE-ABS-KEY("smart phone" W/3 addiction)', 'get works where title-abstract-keywords has ("smart phone" and "addiction" within 3 words of each other)'],
  ])('%s', (text, expected) => {
    expect(oql(text)).toBe(expected);
  });

  it('expands an OR group on either side pairwise', () => {
    expect(oql('TS=((kelp OR seaweed) NEAR/5 decline)')).toBe(
      'get works where title-abstract-keywords has ((kelp and decline within 5 words of each other) OR (seaweed and decline within 5 words of each other))');
  });

  it('PRE/n loses its order, and says so', () => {
    const r = translateSearch('TITLE-ABS-KEY(smart PRE/3 phone)');
    expect(r.changes.some(c => /order/.test(c.result))).toBe(true);
  });

  it('plain Web of Science NEAR means 15 words', () => {
    expect(oql('TS=(kelp NEAR decline)')).toBe('get works where title-abstract-keywords has (kelp and decline within 15 words of each other)');
  });

  it('SAME runs as AND, said so', () => {
    const r = translateSearch('TS=(kelp SAME decline)');
    expect(r.oql).toBe('get works where title-abstract-keywords has (kelp AND decline)');
    expect(r.changes.map(c => c.ref)).toContain('proximity');
  });
});

describe('precedence', () => {
  it('Scopus binds OR before AND', () => {
    expect(oql('TITLE-ABS-KEY(kelp AND forest OR reef)')).toBe('get works where title-abstract-keywords has (kelp AND (forest OR reef))');
  });
  it('PubMed reads left to right', () => {
    expect(oql('kelp[tiab] OR forest[tiab] AND reef[tiab]')).toBe('get works where title-abstract-keywords has ((kelp OR forest) AND reef)');
  });
  it('Web of Science binds AND before OR', () => {
    expect(oql('TS=(kelp OR forest AND reef)')).toBe('get works where title-abstract-keywords has (kelp OR (forest AND reef))');
  });
  it('Scopus AND NOT is the loosest', () => {
    expect(oql('TITLE(kelp OR reef AND NOT review)')).toBe('get works where title has ((kelp OR reef) NOT review)');
  });
  it('says so when AND and OR mix without parentheses', () => {
    expect(refs('kelp[tiab] OR forest[tiab] AND reef[tiab]')).toContain('precedence');
  });
});

describe('words and wildcards', () => {
  it.each([
    ['(wheez$).ti,ab.', 'get works where title-abstract has (wheez*)'],
    ['(wom#n).ti,ab.', 'get works where title-abstract has (wom?n)'],
    ['TITLE-ABS-KEY({kelp forest})', 'get works where title-abstract-keywords has ("kelp forest")'],
    ['TITLE-ABS-KEY("kelp forest")', 'get works where title-abstract-keywords has (stemmed "kelp forest")'],
    ['heart attack.ti,ab.', 'get works where title-abstract has ("heart attack")'],
  ])('%s', (text, expected) => {
    expect(oql(text)).toBe(expected);
  });

  it('drops a wildcard OpenAlex cannot run, and says so (Bascur 2022: $ stems too short)', () => {
    const r = translateSearch('(ca$ or kelp).ti,ab.');
    expect(r.oql).toBe('get works where title-abstract has (ca OR kelp)');
    expect(r.changes.map(c => c.ref)).toContain('wildcards');
  });
});

describe('numbered lines', () => {
  it('runs the last line with the lines it combines', () => {
    const r = translateSearch('1. exp Asthma/\n2. (asthma or wheez$).ti,ab.\n3. 1 or 2\n4. (child$ or pediatric$).ti,ab.\n5. 3 and 4');
    expect(r.oql).toBe('get works where (title-abstract-keywords has (asthma) or title-abstract has (asthma OR wheez*)) and title-abstract has (child* OR pediatric*)');
    expect(r.changes.map(c => c.ref)).toContain('lines');
  });

  it('reads PubMed and Cochrane #n lines', () => {
    expect(oql('#1 asthma[tiab]\n#2 child*[tiab]\n#3 #1 AND #2')).toBe('get works where title-abstract-keywords has (asthma AND child*)');
    expect(oql('#1 MeSH descriptor: [Asthma] explode all trees\n#2 (asthma OR wheez*):ti,ab,kw\n#3 #1 OR #2')).toBe('get works where title-abstract-keywords has (asthma OR wheez*)');
  });

  it('reads Ovid or/1-3 and limit lines', () => {
    expect(oql('1 kelp.ti,ab.\n2 seaweed.ti,ab.\n3 algae.ti,ab.\n4 or/1-3\n5 limit 4 to (english language and yr="2010 - 2020")')).toBe(
      'get works where title-abstract has (kelp OR seaweed OR algae) and year >= (2010) and year <= (2020) and language is (en)');
  });

  it('skips the hit counts Ovid prints at the end of each line', () => {
    expect(oql('1     kelp.ti,ab.     1234\n2     seaweed.ti,ab.     567\n3     1 or 2     1700')).toBe('get works where title-abstract has (kelp OR seaweed)');
  });

  it('reads #n lines pasted onto one line', () => {
    expect(oql('#1 TS=(kelp) #2 TS=(decline) #3 #1 AND #2')).toBe('get works where title-abstract-keywords has (kelp AND decline)');
  });

  it('PubMed history format: kelp (Topic), asthma (MeSH Terms)', () => {
    expect(oql('kelp (All Fields) AND decline (All Fields)')).toBe('get works where title-abstract-keywords has (kelp AND decline)');
  });
});

describe('says what is wrong instead of guessing', () => {
  it.each([
    ['asthma[tiab] AND (child OR adolescent', /never closed/],
    ['asthma[tiab]) AND child[tiab]', /never opened/],
    ['"asthma[tiab] AND child[tiab]', /quote/],
    ['#1 AND #2 AND kelp[tiab]', /isn't in what you pasted/],
    ['1. kelp.ti,ab.\n2. 2 or 1', /refers to itself/],
  ])('%s', (text, message) => {
    const r = translateSearch(text);
    expect(r.oql).toBeNull();
    expect(r.error.message).toMatch(message);
  });
});

describe('methodsText', () => {
  it('has the original, the query as run, and the changes', () => {
    const original = 'TITLE-ABS-KEY(smart PRE/3 phone)';
    const r = translateSearch(original);
    const t = methodsText(r, original, new Date('2026-10-14T12:00:00Z'));
    expect(t).toContain('Search translated from Scopus to OpenAlex on 2026-10-14.');
    expect(t).toContain(original);
    expect(t).toContain(r.oql);
    expect(t).toContain('Differences:');
  });
});
