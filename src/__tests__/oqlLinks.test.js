// Entity links and phrases in OQL text for the IDE editor (oxjob #1597).
import { describe, it, expect } from 'vitest';
import {
  findLinks, linkAtName, linkCovering, linkKind, entityPath, idTail, linkText,
  openBracketBefore, bracketTailEnd, phraseAt, compactNumber, cardFacts,
} from '@/components/OqlPlayground/oqlLinks';

const Q = 'get works about (coral reefs) from [Massachusetts Institute of Technology](I63966007) since 2020, most cited first';

describe('findLinks', () => {
  it('finds each link with its name and ID offsets', () => {
    const [l] = findLinks(Q);
    expect(Q.slice(l.from, l.to)).toBe('[Massachusetts Institute of Technology](I63966007)');
    expect(Q.slice(l.nameFrom, l.nameTo)).toBe('Massachusetts Institute of Technology');
    expect(Q.slice(l.idFrom, l.idTo)).toBe('I63966007');
    expect(l.kind).toBe('institutions');
  });
  it('reads kinds from the words before numbers and slugs', () => {
    const q = 'get works from [Africa](Q15) in SDG [Climate action](13) in the subfield [Artificial Intelligence](1702) under the [CC-BY](cc-by) license from [Kenya](KE)';
    expect(findLinks(q).map((l) => l.kind)).toEqual(['continents', 'sdgs', 'subfields', 'licenses', 'countries']);
  });
  it('does not take a search group for a link', () => {
    expect(findLinks('get works about (coral reefs)')).toEqual([]);
    expect(findLinks('get works about "kelp [forest]" since 2020')).toEqual([]);
  });
  it('keeps an empty name', () => {
    const [l] = findLinks('get works by [](A5023888391)');
    expect(l.name).toBe('');
    expect(l.kind).toBe('authors');
  });
});

describe('cursor helpers', () => {
  const links = findLinks(Q);
  const l = links[0];
  it('linkAtName includes both ends of the name', () => {
    expect(linkAtName(links, l.nameFrom)).toBe(l);
    expect(linkAtName(links, l.nameTo)).toBe(l);
    expect(linkAtName(links, l.from)).toBeNull();
    expect(linkAtName(links, l.to)).toBeNull();
  });
  it('linkCovering excludes the outer ends', () => {
    expect(linkCovering(links, l.idFrom)).toBe(l);
    expect(linkCovering(links, l.from)).toBeNull();
  });
  it('openBracketBefore finds a name being typed', () => {
    const q = 'get works from [stanf]';
    expect(openBracketBefore(q, q.length - 1)).toEqual({ from: 15, query: 'stanf' });
    expect(openBracketBefore(Q, l.nameFrom + 3)).toBeNull();
    expect(openBracketBefore('get works about kelp', 20)).toBeNull();
  });
  it('bracketTailEnd swallows the closing bracket and a stale ID', () => {
    expect(bracketTailEnd('[stan]', 5)).toBe(6);
    expect(bracketTailEnd('[stan](I1) since', 5)).toBe(10);
    expect(bracketTailEnd('[stan', 5)).toBe(5);
  });
});

describe('linkKind / entityPath / linkText', () => {
  it('maps ID shapes', () => {
    expect(linkKind('A5023888391')).toBe('authors');
    expect(linkKind('S36625193')).toBe('sources');
    expect(linkKind('F4320306076')).toBe('funders');
    expect(linkKind('P4310320990')).toBe('publishers');
    expect(linkKind('T10017')).toBe('topics');
    expect(linkKind('W2741809807')).toBe('works');
    expect(linkKind('col_abc')).toBe('collections');
    expect(linkKind('13')).toBeNull();
  });
  it('builds entity paths only for kinds with pages', () => {
    expect(entityPath('institutions', 'I63966007')).toBe('/institutions/I63966007');
    expect(entityPath('countries', 'KE')).toBe('/countries/KE');
    expect(entityPath('collections', 'col_abc')).toBeNull();
    expect(entityPath(null, 'X')).toBeNull();
  });
  it('writes a link from a picked row', () => {
    expect(linkText('Stanford University', idTail('https://openalex.org/I97018004'))).toBe('[Stanford University](I97018004)');
    expect(linkText('A [weird] name', 'I1')).toBe('[A weird name](I1)');
    expect(idTail('https://openalex.org/subfields/1702')).toBe('1702');
  });
});

describe('phraseAt', () => {
  const phrases = new Map([
    ['most cited first', { value: 'most cited first', kind: 'order' }],
    ['since', { value: 'since', kind: 'year' }],
    ['about', { value: 'about', kind: 'keyword' }],
    ['funded by', { value: 'funded by', kind: 'keyword' }],
    ['by', { value: 'by', kind: 'keyword' }],
  ]);
  it('picks the longest phrase under the cursor', () => {
    const i = Q.indexOf('cited');
    const hit = phraseAt(Q, i + 2, phrases);
    expect(hit.entry.value).toBe('most cited first');
    expect(Q.slice(hit.from, hit.to)).toBe('most cited first');
  });
  it('prefers `funded by` over `by`', () => {
    const q = 'get works funded by [NSF](F4320306076)';
    expect(phraseAt(q, q.indexOf('by') + 1, phrases).entry.value).toBe('funded by');
  });
  it('ignores links and unknown words', () => {
    const l = findLinks(Q)[0];
    expect(phraseAt(Q, l.nameFrom + 2, phrases)).toBeNull();
    expect(phraseAt(Q, Q.indexOf('coral') + 1, phrases)).toBeNull();
    expect(phraseAt(Q, 0, new Map())).toBeNull();
  });
});

describe('cards', () => {
  it('compacts numbers', () => {
    expect(compactNumber(9876)).toBe('9,876');
    expect(compactNumber(558203)).toBe('558.2K');
    expect(compactNumber(97384341)).toBe('97.4M');
    expect(compactNumber(null)).toBeNull();
  });
  it('says what an institution card shows', () => {
    const f = cardFacts('institutions', {
      display_name: 'Stanford University', type: 'education', works_count: 558203,
      cited_by_count: 97384341, geo: { city: 'Stanford', country: 'United States' },
    });
    expect(f).toEqual({
      title: 'Stanford University', kicker: 'Institution · education',
      line: 'Stanford, United States', stats: ['558.2K works', '97.4M citations'],
    });
  });
  it('says what a work card shows', () => {
    const f = cardFacts('works', {
      display_name: 'A paper', publication_year: 2012, cited_by_count: 12000,
      authorships: [{ author: { display_name: 'Jennifer Doudna' } }, { author: { display_name: 'X' } }],
      primary_location: { source: { display_name: 'Science' } },
    });
    expect(f.line).toBe('Jennifer Doudna et al. · 2012 · Science');
    expect(f.stats).toEqual(['12K citations']);
  });
  it('is null without a record', () => {
    expect(cardFacts('authors', null)).toBeNull();
  });
});
