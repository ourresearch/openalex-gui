/**
 * Translate a search strategy pasted from another database (PubMed, Scopus, Web of Science, Ovid, Embase, EBSCO,
 * Cochrane Library) into OQL, and list every place the two can't match (oxjob #1659, Jason 2026-10-12).
 *
 * No model: a fixed table per database, the way the translators reviewers already use work (Polyglot, Embase's
 * PubMed translator). The works search box calls translateSearch() on submit and opens the result in the OQL tab with
 * the changes above it. Plain Boolean strings (what a Dimensions search looks like) are not database syntax: the box
 * already runs them, so translateSearch() returns null for them.
 *
 * Result: { source, sourceLabel, oql, changes: [{ original, result, why, ref }], error }. `ref` is the help page
 * anchor each change links to. `error` (with oql null) is a database search we can't read (unbalanced brackets, a
 * search line that isn't there).
 */

export const DB_SEARCH_HELP_URL = 'https://help.openalex.org/how-to/search-strategies-from-other-databases/';

const LABELS = {
  pubmed: 'PubMed', scopus: 'Scopus', wos: 'Web of Science', ovid: 'Ovid', embase: 'Embase',
  cochrane: 'Cochrane Library', ebsco: 'EBSCO', mixed: 'another database',
};

const TAK = 'title-abstract-keywords';
const TA = 'title-abstract';
const FIELD_WORDS = {
  [TAK]: 'titles, abstracts and keywords', [TA]: 'titles and abstracts', title: 'titles', abstract: 'abstracts',
  byline: 'author names', 'raw affiliation': 'affiliations',
};

// ---------------------------------------------------------------------------------------------------------------
// Field tables. Each maps a source field to an OpenAlex field, or to a kind: 'heading' (MeSH, Emtree, subject
// headings: searched as words), 'limit:<kind>' (year, language, type), 'drop' (no equivalent: left out, said so).
// A source field that covers keywords maps to title-abstract-keywords; one that doesn't, to title-abstract.
// ---------------------------------------------------------------------------------------------------------------

const PUBMED_TAGS = [
  [/^(ti|title)$/, 'title'],
  [/^(ab|abstract)$/, 'abstract'],
  [/^(tiab|title\/abstract|title\/abstract\/keyword|title\/abstract\/keywords|tiabkw)$/, TAK, 'pubmed-tiab'],
  [/^(topic|ts)$/, TAK, 'wos-ts'],
  [/^(tw|text word|textword)$/, TAK, 'pubmed-tw'],
  [/^(ot|other term|kw|kf|keyword|keywords|author keywords)$/, TAK, 'author-keywords'],
  [/^(all|all fields|ti,ab|tiab,ot|text|tx)$/, TAK, 'all-fields'],
  [/^(mh|mesh|mesh terms|mh:noexp|mesh:noexp|mesh terms:noexp|majr|mesh major topic|majr:noexp|sh|subheading|mesh subheading|tn|nm|substance name|supplementary concept|pa|pharmacological action|rn)$/, 'heading'],
  [/^(au|author|1au|lastau|fau|full author name)$/, 'byline'],
  [/^(ad|affiliation|affil)$/, 'raw affiliation'],
  [/^(dp|pdat|publication date|date - publication|edat|crdt|dcom|mhda|date - create|date - entry|date - completion)$/, 'limit:year'],
  [/^(la|lang|language)$/, 'limit:lang'],
  [/^(pt|publication type|ptyp|document types)$/, 'limit:type'],
  [/^(publication years)$/, 'limit:year'],
  [/^(languages)$/, 'limit:lang'],
  [/^(filter|sb)$/, 'limit:filter'],
];

const SCOPUS_FUNCS = {
  'TITLE-ABS-KEY': TAK, 'TITLE-ABS-KEY-AUTH': TAK, 'TITLE-ABS': TA, 'TITLE': 'title', 'ABS': 'abstract',
  'KEY': TAK, 'AUTHKEY': TAK, 'ALL': TAK, 'INDEXTERMS': 'heading', 'CHEM': 'heading', 'TRADENAME': 'heading',
  'AUTH': 'byline', 'AUTHOR': 'byline', 'AUTHOR-NAME': 'byline', 'AUTHLASTNAME': 'byline', 'AUTHFIRST': 'byline',
  'AFFIL': 'raw affiliation', 'AFFILORG': 'raw affiliation', 'AFFILCITY': 'raw affiliation',
  'AFFILCOUNTRY': 'raw affiliation',
  'DOCTYPE': 'limit:type', 'LANGUAGE': 'limit:lang', 'SRCTYPE': 'limit:srctype', 'PUBYEAR': 'limit:year',
  'OPENACCESS': 'limit:oa',
  'SRCTITLE': 'drop', 'EXACTSRCTITLE': 'drop', 'ISSN': 'drop', 'ISBN': 'drop', 'DOI': 'drop', 'REF': 'drop',
  'FUND-SPONSOR': 'drop', 'FUND-ACR': 'drop', 'FUND-NO': 'drop', 'FUND-ALL': 'drop', 'CONF': 'drop',
  'CONFNAME': 'drop', 'PMID': 'drop', 'EDITOR': 'drop', 'PUBLISHER': 'drop', 'SUBJAREA': 'drop', 'SEQBANK': 'drop',
  'SEQNUMBER': 'drop', 'ARTNUM': 'drop', 'VOLUME': 'drop', 'ISSUE': 'drop', 'PAGES': 'drop', 'EID': 'drop',
  'PUBSTAGE': 'drop', 'CODEN': 'drop', 'AU-ID': 'drop', 'AF-ID': 'drop', 'ORCID': 'drop',
};

const WOS_CODES = {
  TS: [TAK, 'wos-ts'], TI: ['title'], AB: ['abstract'], AK: [TAK, 'author-keywords'], KP: [TAK, 'keywords-plus'],
  ALL: [TAK, 'all-fields'], AU: ['byline'], AI: ['byline'], GP: ['byline'], AD: ['raw affiliation'],
  OG: ['raw affiliation'], OO: ['raw affiliation'], CI: ['raw affiliation'], CU: ['raw affiliation'],
  PY: ['limit:year'], DT: ['limit:type'], LA: ['limit:lang'], DOP: ['limit:year'],
  SO: ['drop'], IS: ['drop'], DO: ['drop'], UT: ['drop'], PMID: ['drop'], WC: ['drop'], SU: ['drop'], FO: ['drop'],
  FG: ['drop'], FT: ['drop'], ED: ['drop'], PUBL: ['drop'], CF: ['drop'], SA: ['drop'], ZP: ['drop'], PS: ['drop'],
};

// Ovid / Embase.com / Cochrane field codes (.ti,ab. and :ti,ab,kw): a set of two- or three-letter codes.
function fieldFromCodes(codes) {
  const set = new Set(codes.map(c => c.toLowerCase()));
  const has = c => set.has(c);
  if ([...set].every(c => ['sh', 'hw', 'exp', 'de', 'mj', 'fs', 'nm', 'rn', 'ps', 'dm', 'mh'].includes(c))) return ['heading'];
  if ([...set].every(c => ['pt', 'it'].includes(c))) return ['limit:type'];
  if ([...set].every(c => ['yr', 'py', 'dp'].includes(c))) return ['limit:year'];
  if ([...set].every(c => ['lg', 'la'].includes(c))) return ['limit:lang'];
  if ([...set].every(c => ['au', 'fs_au', 'ia'].includes(c))) return ['byline'];
  if ([...set].every(c => ['in', 'ad', 'ff'].includes(c))) return ['raw affiliation'];
  if ([...set].every(c => ['jn', 'jw', 'so', 'jx', 'is', 'ui', 'vo', 'pg'].includes(c))) return ['drop'];
  if (has('mp') || has('af') || has('tx')) return [TAK, 'all-fields'];
  if (has('kw') || has('kf') || has('ot') || has('dv') || has('tn')) return [TAK];
  const text = [...set].filter(c => ['ti', 'ab', 'tw', 'tt', 'ot'].includes(c));
  if (text.length === set.size) {
    if (set.size === 1 && has('ti')) return ['title'];
    if (set.size === 1 && has('ab')) return ['abstract'];
    return [TA];
  }
  return [TAK, 'unknown-field'];
}

const EBSCO_CODES = {
  TI: ['title'], AB: ['abstract'], TX: [TAK, 'all-fields'], KW: [TAK], AK: [TAK, 'author-keywords'], SU: ['heading'], MH: ['heading'],
  MM: ['heading'], DE: ['heading'], AU: ['byline'], AF: ['raw affiliation'], SO: ['drop'], PT: ['limit:type'],
  LA: ['limit:lang'], DT: ['limit:year'],
};

// The MeSH check tags Humans and Animals: as a standalone AND/NOT clause they are a filter, and searching the word
// "humans" would cut most results. Age groups and sex (Child, Aged, Female) are a review's population: searched as
// words like any heading.
const CHECK_TAGS = new Set(['humans', 'human', 'animals', 'animal']);

const LANGUAGES = {
  english: 'en', eng: 'en', en: 'en', french: 'fr', fre: 'fr', fra: 'fr', fr: 'fr', german: 'de', ger: 'de',
  deu: 'de', de: 'de', spanish: 'es', spa: 'es', es: 'es', portuguese: 'pt', por: 'pt', pt: 'pt', italian: 'it',
  ita: 'it', it: 'it', dutch: 'nl', dut: 'nl', nld: 'nl', nl: 'nl', chinese: 'zh', chi: 'zh', zho: 'zh', zh: 'zh',
  japanese: 'ja', jpn: 'ja', ja: 'ja', korean: 'ko', kor: 'ko', ko: 'ko', russian: 'ru', rus: 'ru', ru: 'ru',
  polish: 'pl', pol: 'pl', pl: 'pl', swedish: 'sv', swe: 'sv', sv: 'sv', norwegian: 'no', nor: 'no', no: 'no',
  danish: 'da', dan: 'da', da: 'da', finnish: 'fi', fin: 'fi', fi: 'fi', turkish: 'tr', tur: 'tr', tr: 'tr',
  arabic: 'ar', ara: 'ar', ar: 'ar', persian: 'fa', per: 'fa', fas: 'fa', farsi: 'fa', fa: 'fa', czech: 'cs',
  cze: 'cs', ces: 'cs', cs: 'cs', greek: 'el', gre: 'el', ell: 'el', el: 'el', hebrew: 'he', heb: 'he', he: 'he',
  hungarian: 'hu', hun: 'hu', hu: 'hu', indonesian: 'id', ind: 'id', id: 'id', malay: 'ms', may: 'ms', ms: 'ms',
  thai: 'th', tha: 'th', th: 'th', ukrainian: 'uk', ukr: 'uk', uk: 'uk', vietnamese: 'vi', vie: 'vi', vi: 'vi',
  croatian: 'hr', hrv: 'hr', hr: 'hr', serbian: 'sr', srp: 'sr', sr: 'sr', romanian: 'ro', rum: 'ro', ron: 'ro',
  ro: 'ro', catalan: 'ca', cat: 'ca', ca: 'ca', hindi: 'hi', hin: 'hi', hi: 'hi', afrikaans: 'af', afr: 'af',
  slovak: 'sk', slo: 'sk', slk: 'sk', sk: 'sk', slovenian: 'sl', slv: 'sl', sl: 'sl', lithuanian: 'lt', lit: 'lt',
  lt: 'lt', estonian: 'et', est: 'et', et: 'et', latvian: 'lv', lav: 'lv', lv: 'lv', bulgarian: 'bg', bul: 'bg',
  bg: 'bg', icelandic: 'is', ice: 'is', isl: 'is', icl: 'is',
};

// Document types and publication types -> OpenAlex type or study design. null = no equivalent (left out, said so).
const TYPES = {
  // Scopus DOCTYPE codes
  ar: ['type', 'article'], re: ['type', 'review'], cp: ['type', 'article', 'OpenAlex has no conference-paper type; conference papers are articles'],
  ch: ['type', 'book-chapter'], bk: ['type', 'book'], ed: ['type', 'editorial'], le: ['type', 'letter'],
  er: ['type', 'erratum'], dp: ['type', 'article', 'OpenAlex has no data-paper type; data papers are articles'],
  sh: ['type', 'review', 'Scopus short surveys are reviews in OpenAlex'], no: null, ab: null, bz: null, tb: null, rp: ['type', 'report'],
  // names (Web of Science DT, PubMed [pt], Ovid .pt., EBSCO PT)
  article: ['type', 'article'], 'journal article': ['type', 'article'], 'research article': ['type', 'article'],
  'original article': ['type', 'article'], review: ['type', 'review'], 'review article': ['type', 'review'],
  'proceedings paper': ['type', 'article', 'OpenAlex has no conference-paper type; conference papers are articles'],
  'conference paper': ['type', 'article', 'OpenAlex has no conference-paper type; conference papers are articles'],
  'book chapter': ['type', 'book-chapter'], book: ['type', 'book'], editorial: ['type', 'editorial'],
  'editorial material': ['type', 'editorial'], letter: ['type', 'letter'], erratum: ['type', 'erratum'],
  correction: ['type', 'erratum'], 'retracted publication': ['retracted', true], retraction: ['type', 'retraction'],
  preprint: ['type', 'preprint'], dissertation: ['type', 'dissertation'], thesis: ['type', 'dissertation'],
  'data paper': ['type', 'article', 'OpenAlex has no data-paper type; data papers are articles'],
  dataset: ['type', 'dataset'], report: ['type', 'report'],
  'systematic review': ['design', 'systematic-review'], 'meta-analysis': ['design', 'meta-analysis'],
  'meta analysis': ['design', 'meta-analysis'],
  'randomized controlled trial': ['design', 'randomized-controlled-trial'],
  'randomised controlled trial': ['design', 'randomized-controlled-trial'],
  'meeting abstract': null, 'early access': null, note: null, 'news item': null, 'clinical trial': null,
  'case reports': null, comment: null, 'practice guideline': null, guideline: null,
};

// ---------------------------------------------------------------------------------------------------------------
// Changes: what the translation did that the source database wouldn't, in plain words.
// ---------------------------------------------------------------------------------------------------------------

class Changes {
  constructor() { this.list = []; this.seen = new Set(); }
  add(ref, original, result, why) {
    const key = `${ref}|${original}|${result}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    this.list.push({ ref, original, result, why });
  }
}

// Group repeats ("[mh]" on twelve headings) into one line each, in the order they first appeared.
const ORDER = ['headings', 'fields', 'limits', 'proximity', 'precedence', 'wildcards', 'phrases', 'numbered-lines'];

function summarize(list) {
  const byRef = new Map();
  for (const c of list) {
    const k = `${c.ref}|${c.result}|${c.why}`;
    if (!byRef.has(k)) byRef.set(k, { ...c, originals: [] });
    byRef.get(k).originals.push(c.original);
  }
  return [...byRef.values()].map(c => {
    const shown = c.originals.slice(0, 3).join(', ') + (c.originals.length > 3 ? `, and ${c.originals.length - 3} more` : '');
    return { ref: c.ref, original: shown, result: c.result, why: c.why, count: c.originals.length };
  }).sort((a, b) => ORDER.indexOf(a.ref) - ORDER.indexOf(b.ref));
}

// ---------------------------------------------------------------------------------------------------------------
// Dialect detection: which database's syntax is in the text. Null = no database syntax (leave the box alone).
// ---------------------------------------------------------------------------------------------------------------

const RE = {
  pubmedTag: /\[(?:tiab|ti|ab|tw|mh|mesh|mesh terms|majr|mesh major topic|sh|pt|la|dp|pdat|edat|au|ad|ot|tiab:~\d+|ti:~\d+|all fields|title|abstract|title\/abstract|text word|publication type|language|nm|tn|sb|mh:noexp|mesh:noexp|majr:noexp|affiliation|author|1au|ta|journal|kw|crdt|publication date|date - publication|filter|subheading|pa|rn|ptyp|lastau|fau|dcom|mhda)\]/i,
  scopusFunc: /(?:^|[\s(])(?:TITLE-ABS-KEY|TITLE-ABS|TITLE-ABS-KEY-AUTH|AUTHKEY|INDEXTERMS|SRCTITLE|EXACTSRCTITLE|AFFILORG|AFFILCOUNTRY|AFFILCITY|SUBJAREA|DOCTYPE|SRCTYPE|LIMIT-TO|EXCLUDE|AUTHLASTNAME|AUTHFIRST|FUND-SPONSOR)\s*\(/i,
  scopusUpper: /(?:^|[\s(])(?:TITLE|ABS|KEY|AUTH|AFFIL|LANGUAGE|CHEM)\s*\(/,
  scopusYear: /\bPUBYEAR\s*(?:>|<|=|>=|<=|AFT|BEF|IS)\s*\d{4}/i,
  scopusNear: /\s(?:W|PRE)\/\d+\s/i,
  wos: /(?:^|[\s(])(?:TS|TI|AB|AK|KP|AU|AI|AD|OG|SO|PY|DT|LA|WC|SU|FO|UT|DO|IS|ALL)\s*=\s*[("\w]/i,
  ovidSuffix: /[\w)$*?#"'\]]\.(?:[a-z]{2,3}(?:,[a-z]{2,3})*)\.(?=\s|$|\)|,)/,
  ovidSuffixNoDot: /[\w*$?)"]\.(?:mp|tw|kf|kw|sh|ti,ab|ab,ti|ti,ab,kf|ti,ab,kw)(?=\s|$|\))/i,
  ovidHeading: /(?:^|[\s(])(?:exp\s+\*?|\*)?[A-Za-z][\w ,'&-]*\/(?:[a-z]{2}(?:,[a-z]{2})*)?(?=\s|$|\))/,
  ovidExp: /(?:^|[\s(])exp\s+\*?[A-Za-z]/i,
  ovidAdj: /\s(?:adj\d*|ADJ\d*)\s/,
  ovidCombine: /(?:^|\s)(?:or|and)\/\d+(?:\s*-\s*\d+)?(?:\s*,\s*\d+(?:\s*-\s*\d+)?)*/i,
  ovidLimit: /(?:^|\s)limit\s+\d+\s+to\s/i,
  colonSuffix: /[\w'")*?]:(?:ti|ab|kw|de|ti,ab|ti,ab,kw|ab,ti|ti,ab,kw,kf|kw,ti,ab|ti,kw|ab,kw|lnk|it|tn|dn|mn|ff|au|ad)(?=[\s)]|$)/i,
  embaseEmtree: /'[^']+'\/(?:exp|de|mj|syn|dd_\w+)/i,
  cochraneMesh: /MeSH descriptor:\s*\[|\[mh\s+\^?["\w]/i,
  ebscoCode: /(?:^|[\s(])(?:TI|AB|TX|SU|MH|MM|KW|AF)\s+(?=[("\w])/g,
  ebscoMh: /\(\s*MH\s+"[^"]+\+?"\s*\)|\bMH\s+"[^"]+"/,
  dbNear: /\s(?:NEAR\/\d+|W\/\d+|PRE\/\d+|ADJ\d+|adj\d+|NEXT|SAME)\s/,
};

function knownBracketTag(t) {
  for (const m of t.matchAll(/[\w"*)]\s?\[([^\]]{1,40})\]/g)) {
    const name = m[1].trim().toLowerCase().replace(/:~\d+$/, '');
    if (PUBMED_TAGS.some(([re]) => re.test(name))) return true;
  }
  return false;
}

export function detectSource(text) {
  if (!text || typeof text !== 'string') return null;
  const t = normalize(text);
  const votes = {};
  const vote = (k, n = 1) => { votes[k] = (votes[k] || 0) + n; };
  if (RE.cochraneMesh.test(t)) vote('cochrane', 3);
  if (RE.embaseEmtree.test(t)) vote('embase', 3);
  if (RE.colonSuffix.test(t)) vote(/'[^']+'/.test(t) ? 'embase' : 'cochrane', 2);
  if (RE.pubmedTag.test(t) || knownBracketTag(t)) vote('pubmed', 3);
  if (RE.scopusFunc.test(t) || RE.scopusUpper.test(t) || RE.scopusYear.test(t)) vote('scopus', 3);
  if (RE.scopusNear.test(` ${t} `)) vote('scopus', 1);
  if (RE.wos.test(t)) vote('wos', 3);
  if (/\[(?:publication years|document types|languages)\]/i.test(t) || /\(\s*topic\s*\)/i.test(text)) vote('wos', 4);
  if (RE.ovidSuffix.test(t) || RE.ovidSuffixNoDot.test(t) || RE.ovidExp.test(t) || RE.ovidCombine.test(t) || RE.ovidLimit.test(t)) vote('ovid', 3);
  if (RE.ovidAdj.test(` ${t} `)) vote('ovid', 1);
  const ebsco = (t.match(RE.ebscoCode) || []).length;
  if (RE.ebscoMh.test(t)) vote('ebsco', 3);
  if (ebsco >= 2 || (ebsco >= 1 && /\b(?:AND|OR|NOT)\b/.test(t) && /(?:^|\n)\s*S\d+\s/.test(t))) vote('ebsco', 2);
  // Ovid headings ("Asthma/") only count once something else says Ovid: a slash alone is common in plain text
  if (votes.ovid && RE.ovidHeading.test(t)) vote('ovid', 1);
  const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return null;
  return ranked[0][0];
}

// Every dialect with a signal in the text: a PubMed search with Ovid headings pasted in reads both.
function dialectsIn(text, source) {
  const t = normalize(text);
  const d = new Set([source]);
  if (RE.ovidSuffix.test(t) || RE.ovidSuffixNoDot.test(t) || RE.ovidExp.test(t) || RE.ovidCombine.test(t) || RE.ovidLimit.test(t)) d.add('ovid');
  if (RE.wos.test(t)) d.add('wos');
  if (RE.colonSuffix.test(t) || RE.embaseEmtree.test(t)) d.add('colon');
  if (source === 'embase' || source === 'cochrane') d.add('colon');
  if (RE.scopusFunc.test(t) || RE.scopusUpper.test(t) || RE.scopusYear.test(t)) d.add('scopus');
  return d;
}

// ---------------------------------------------------------------------------------------------------------------
// Numbered lines: "1. exp Asthma/", "#2 asthma[tiab]", "S3 S1 OR S2". The last line is the search; references
// pull in the lines they name.
// ---------------------------------------------------------------------------------------------------------------

const LINE = /^\s*(#|S)?(\d{1,3})(?:[.):]|\s|(?<=#\d{1,3})(?=\())\s*(.*?)\s*$/;

function splitNumberedLines(text) {
  const raw = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  if (raw.length < 2) return null;
  const lines = [];
  for (const l of raw) {
    const m = l.match(LINE);
    if (!m) {
      // a wrapped continuation of the previous line; before line 1, a header ("Search Items", "Database: ...")
      if (lines.length) { lines[lines.length - 1].text += ` ${l}`; continue; }
      continue;
    }
    // Ovid and PubMed exports carry the hit count at the end of the line: "1  exp Asthma/  145678" or "(145678)"
    let body = m[3].replace(/\s{2,}\(?[\d,]+\)?\s*$/, '').replace(/\s+\([\d,]+\)\s*$/, '');
    if (/\t/.test(l)) body = body.split(/\t+/)[0];
    lines.push({ n: Number(m[2]), prefix: m[1] || '', text: body.trim() });
  }
  if (lines.length < 2) return null;
  // numbering must be the line numbers: 1, 2, 3 ... (allow gaps), increasing; EBSCO lists newest first (S9 ... S1)
  const up = lines.every((l, i) => i === 0 || l.n > lines[i - 1].n);
  const down = lines.every((l, i) => i === 0 || l.n < lines[i - 1].n);
  if (!up && !down) return null;
  if (down) lines.reverse();
  // a hit count after a single space: "24 22 and 23 9,996" (a count with a thousands comma, or a number past the last line)
  const max = lines[lines.length - 1].n;
  for (const l of lines) {
    const m = l.text.match(/^(.*\S)\s+\(?(\d{1,3}(?:,\d{3})+|\d+)\)?$/);
    if (!m) continue;
    // ... or a count after a statement that has ended: an Ovid suffix, a heading's slash, a closing bracket
    if (/,/.test(m[2]) || (isCombinationLine(m[1]) && +m[2] > max) || /[./)\]]$/.test(m[1])) l.text = m[1];
  }
  return lines;
}

// "#1 asthma[tiab] #2 child*[tiab] #3 #1 AND #2" on one line: break before #2, #3 ... when they come in order.
// Only "#n" and "Search #n:" markers: bare numbers are too common inside searches.
function unflattenLines(text) {
  const t = text.replace(/\s+/g, ' ').trim().replace(/^Search\s*(?=#1\b)/i, '');
  if (!/^#1\b/.test(t)) return text;
  let out = t;
  let pos = 0;
  for (let n = 2; n < 200; n++) {
    const re = new RegExp(`[,;]?\\s(?:Search\\s*)?#${n}(?=[:.\\s])`, 'g');
    re.lastIndex = pos;
    const m = re.exec(out);
    if (!m) break;
    // "#1 AND #2" is a combination, not two lines: a line starts after a search, never after an operator
    if (/\b(?:AND|OR|NOT)\s*$/i.test(out.slice(0, m.index)) || /^\s*(?:AND|OR|NOT)\b/i.test(out.slice(m.index + m[0].length))) break;
    out = `${out.slice(0, m.index)}\n#${n}${out.slice(m.index + m[0].length)}`;
    pos = m.index + 2;
  }
  return out.includes('\n') ? out : text;
}

// A line that only combines other lines: "1 or 2", "#1 AND #2", "S1 OR S2", "or/1-5", "limit 7 to english".
function isCombinationLine(text) {
  const t = text.trim();
  if (/^(?:or|and)\/\d+/i.test(t)) return true;
  if (/^limit\s+\d+\s+to\s/i.test(t)) return true;
  if (/^remove duplicates from\s+\d+/i.test(t)) return true;
  if (/^(?:deduplicate|remove duplicates)\b/i.test(t)) return true;
  const rest = t.replace(/(?:#|S)?\d+/g, ' ').replace(/\b(?:and|or|not)\b/gi, ' ').replace(/[()\s]/g, '');
  return rest === '' && /\d/.test(t);
}

// ---------------------------------------------------------------------------------------------------------------
// Tokenizer.
// ---------------------------------------------------------------------------------------------------------------

// PubMed's and Web of Science's search history show the field in parentheses: kelp (All Fields), covid (Topic)
const HISTORY_TAG = /\s*\(\s*(all fields|title\s*\/\s*abstract|title|abstract|mesh terms|mesh major topic|text word|topic|author keywords|keywords|mesh|pt|tw|tiab|filter|publication type|language|publication years|document types|languages)\s*\)/gi;

function normalize(text) {
  return text
    .replace(/[\u201c\u201d\u201e\u201f\u00ab\u00bb\u2033]/g, '"')
    .replace(/[\u2018\u2019\u201a\u201b\u2032]/g, "'")
    // no-break and zero-width spaces (pasted from Word or PDFs)
    .replace(/[\u00a0\u2009\u202f\u200b\u200c\u200d\u2060\ufeff]/g, ' ')
    .replace(/[\u2010\u2011\u2013\u2014]/g, '-')
    .replace(/[\u2217\uff0a]/g, '*')
    .replace(/\r\n?/g, '\n')
    .replace(HISTORY_TAG, (m, tag) => `[${tag.replace(/\s*\/\s*/g, '/')}]`)
    // Ovid's field notes: .mp. [mp = title, abstract, ...]
    .replace(/\s*\[mp\s*=[^\]]*\]/gi, '');
}

// Find the index of the ")" closing the "(" at i (quotes respected), or -1.
function matchParen(s, i) {
  let depth = 0;
  let q = null;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"') { q = c; continue; }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return j; }
  }
  return -1;
}

class ParseError extends Error {}

/**
 * Tokens of one search line. Token kinds:
 *  ( ) | op AND/OR/NOT | near {n, ordered, raw} | term {v, quoted, wild, field?, fieldRef?, raw}
 *  heading {v, explode, raw} | limit {kind, values, neg?, raw} | ref {n} | fieldopen {field, fieldRef, raw}
 *  suffix {field, fieldRef, raw} (applies to the term or group before it)
 */
function tokenize(s, ctx) {
  const { source, numbered, combo, prefix, dialects: ds = new Set([source]) } = ctx;
  const out = [];
  let i = 0;
  let brackets = 0;
  const push = t => out.push(t);
  const at = re => s.slice(i).match(re);

  while (i < s.length) {
    const c = s[i];
    if (/\s|,/.test(c) && !(c === ',' && false)) { i++; continue; }

    // PubMed date ranges: 2015:2020[dp], "2015/01/01"[PDAT] : "3000/12/31"[PDAT], 2015[dp]
    let m = at(/^"?(\d{4})(?:\/\d{1,2}(?:\/\d{1,2})?)?"?\s*(?:\[(?:dp|pdat|edat|crdt|dcom|mhda|publication date|date - publication|date - create|date - entry)\]\s*)?:\s*"?(\d{4})(?:\/\d{1,2}(?:\/\d{1,2})?)?"?\s*\[(dp|pdat|edat|crdt|dcom|mhda|publication date|date - publication|date - create|date - entry)\]/i);
    if (m) { push({ t: 'limit', kind: 'year', from: +m[1], to: +m[2] >= 2100 ? null : +m[2], raw: m[0] }); i += m[0].length; continue; }
    m = at(/^"?(\d{4})(?:\/\d{1,2}(?:\/\d{1,2})?)?"?\s*\[(dp|pdat|edat|crdt|dcom|publication date|date - publication)\]/i);
    if (m) { push({ t: 'limit', kind: 'year', from: +m[1], to: +m[1], raw: m[0] }); i += m[0].length; continue; }
    m = at(/^"?last\s+(\d+)\s+years?"?\s*\[(dp|pdat|edat|crdt)\]/i);
    if (m) { push({ t: 'limit', kind: 'lastyears', n: +m[1], raw: m[0] }); i += m[0].length; continue; }

    // Scopus PUBYEAR > 2014
    m = at(/^PUBYEAR\s*(>=|<=|>|<|=|AFT|BEF|IS)\s*(\d{4})/i);
    if (m) {
      const op = m[1].toUpperCase();
      const y = +m[2];
      const lim = { t: 'limit', kind: 'year', from: null, to: null, raw: m[0] };
      if (op === '>' || op === 'AFT') lim.from = y + 1;
      else if (op === '>=') lim.from = y;
      else if (op === '<' || op === 'BEF') lim.to = y - 1;
      else if (op === '<=') lim.to = y;
      else { lim.from = y; lim.to = y; }
      push(lim); i += m[0].length; continue;
    }

    // Scopus LIMIT-TO(DOCTYPE,"ar") / EXCLUDE(...)
    m = at(/^(LIMIT-TO|EXCLUDE)\s*\(/i);
    if (m) {
      const open = i + m[0].length - 1;
      const close = matchParen(s, open);
      if (close < 0) throw new ParseError(`The parenthesis after ${m[1]} is never closed.`);
      const inner = s.slice(open + 1, close);
      const [key, ...vals] = inner.split(',').map(x => x.trim().replace(/^"|"$/g, ''));
      push(limitFromKey(key.toUpperCase(), vals, m[1].toUpperCase() === 'EXCLUDE', s.slice(i, close + 1), 'scopus'));
      i = close + 1; continue;
    }

    // Scopus field functions: TITLE-ABS-KEY( ... ), DOCTYPE(ar), LANGUAGE(english)
    m = at(/^([A-Za-z][A-Za-z-]{1,20})\s*\(/);
    if (m && SCOPUS_FUNCS[m[1].toUpperCase()] && (ds.has('scopus') || m[1] === m[1].toUpperCase())
        && !/^(AND|OR|NOT)$/i.test(m[1])) {
      const name = m[1].toUpperCase();
      const f = SCOPUS_FUNCS[name];
      const open = i + m[0].length - 1;
      const close = matchParen(s, open);
      if (close < 0) throw new ParseError(`The parenthesis after ${m[1]} is never closed.`);
      const raw = s.slice(i, close + 1);
      if (f.startsWith('limit:')) {
        const inner = s.slice(open + 1, close);
        const vals = inner.split(/\s+OR\s+|,/i).map(x => x.trim().replace(/^"|"$/g, '')).filter(Boolean);
        push(limitFromKey(name, vals, false, raw, 'scopus'));
        i = close + 1; continue;
      }
      if (f === 'drop') {
        push({ t: 'drop', raw, why: `OpenAlex can't search ${name} as text` });
        i = close + 1; continue;
      }
      push({ t: 'fieldopen', field: f, fieldRef: name, raw: `${name}()` });
      i = open + 1; continue;
    }

    // Web of Science field codes: TS=(...), TI=word, PY=(2000-2016), DT=(Article OR Review)
    m = at(/^([A-Za-z]{2,4})\s*=\s*/);
    if (m && WOS_CODES[m[1].toUpperCase()] && ds.has('wos')) {
      const code = m[1].toUpperCase();
      const [f, ref] = WOS_CODES[code];
      let j = i + m[0].length;
      let inner;
      let end;
      if (s[j] === '(') {
        end = matchParen(s, j);
        if (end < 0) throw new ParseError(`The parenthesis after ${code}= is never closed.`);
        inner = s.slice(j + 1, end);
      } else {
        const w = s.slice(j).match(/^"[^"]*"|^[^\s()]+/);
        if (!w) throw new ParseError(`${code}= has nothing after it.`);
        end = j + w[0].length - 1;
        inner = w[0];
      }
      const raw = s.slice(i, end + 1);
      if (f.startsWith('limit:')) {
        const vals = inner.split(/\s+OR\s+|,/i).map(x => x.trim().replace(/^"|"$/g, '')).filter(Boolean);
        push(limitFromKey(code === 'PY' || code === 'DOP' ? 'PUBYEAR' : code === 'DT' ? 'DOCTYPE' : 'LANGUAGE', vals, false, raw, 'wos'));
        i = end + 1; continue;
      }
      if (f === 'drop') { push({ t: 'drop', raw, why: `OpenAlex can't search ${code}= as text` }); i = end + 1; continue; }
      if (s[j] === '(') { push({ t: 'fieldopen', field: f, fieldRef: ref || code, raw: `${code}=` }); i = j + 1; continue; }
      // single term: tokenize it in its own scope
      push({ t: 'fieldopen', field: f, fieldRef: ref || code, raw: `${code}=`, single: true });
      i = j; continue;
    }

    // EBSCO field codes: TI asthma, AB ( ... ), MH "Asthma+"
    if (source === 'ebsco') {
      m = at(/^(TI|AB|TX|SU|MH|MM|KW|AK|AU|AF|SO|DE)\s+(?=[("\w])/);
      if (m && (i === 0 || /[\s(]/.test(s[i - 1]))) {
        const [f, ref] = EBSCO_CODES[m[1]] || ['drop'];
        let j = i + m[0].length;
        if (f === 'heading') {
          const h = s.slice(j).match(/^\(\s*"([^"]+)"\s*\)|^"([^"]+)"|^([^\s()]+)/);
          if (h) {
            const v = (h[1] || h[2] || h[3]).replace(/\+$/, '');
            push({ t: 'heading', v, explode: /\+"?\s*\)?$/.test(h[0]), raw: `${m[1]} ${h[0].trim()}` });
            i = j + h[0].length; continue;
          }
        }
        if (f === 'drop') {
          const w = s[j] === '(' ? s.slice(j, matchParen(s, j) + 1) : (s.slice(j).match(/^"[^"]*"|^[^\s()]+/) || [''])[0];
          push({ t: 'drop', raw: `${m[1]} ${w}`, why: `OpenAlex can't search ${m[1]} as text` });
          i = j + w.length; continue;
        }
        push({ t: 'fieldopen', field: f, fieldRef: ref || `ebsco-${m[1]}`, raw: m[1], single: s[j] !== '(' });
        i = s[j] === '(' ? j + 1 : j; continue;
      }
    }

    // Embase limits: [english]/lim, [adult]/lim, [article]/it, [2010-2020]/py
    m = at(/^\[([^\]]+)\]\/(lim|py|it)\b/i);
    if (m) {
      const v = m[1].trim();
      const kind = m[2].toLowerCase();
      if (kind === 'py') push(limitFromKey('PUBYEAR', [v.replace(/\s+/g, '')], false, m[0], 'embase'));
      else if (kind === 'it') push(limitFromKey('DOCTYPE', [v], false, m[0], 'embase'));
      else if (LANGUAGES[v.toLowerCase()]) push(limitFromKey('LANGUAGE', [v], false, m[0], 'embase'));
      else push({ t: 'limit', kind: 'unsupported', key: 'Embase limit', values: [v], raw: m[0] });
      i += m[0].length; continue;
    }

    // Cochrane: MeSH descriptor: [Asthma] explode all trees / this term only; [mh Asthma], [mh ^Asthma]
    m = at(/^MeSH descriptor:\s*\[([^\]]+)\](?:\s*explode all trees|\s*this term only)?(?:\s*and with qualifier\(s\):\s*\[[^\]]*\])?/i);
    if (m) { push({ t: 'heading', v: m[1], explode: /explode/i.test(m[0]), raw: m[0] }); i += m[0].length; continue; }
    m = at(/^\[mh\s+(\^?)"?([^"\]]+?)"?\s*\]/i);
    if (m) { push({ t: 'heading', v: m[2], explode: !m[1], raw: m[0] }); i += m[0].length; continue; }

    // Ovid headings: exp Asthma/, *Asthma/, Asthma/, exp Asthma/dt [Drug Therapy]
    if (ds.has('ovid')) {
      // the heading's words never include an operator or "exp": "exp A/ or exp B/" is two headings
      m = at(/^(exp\s+)?(\*)?"?((?!(?:or|and|not|exp)\b)[A-Za-z][\w,'&-]*(?:\s+(?!(?:or|and|not|exp)\b)[\w,'&-]+)*?)"?\/(?:(?!or\b|and\b)([a-z]{2}(?:,\s?[a-z]{2})*)\b)?\.?(?:\s*\[[^\]]*\])?(?=\s|$|\)|,|or\b|and\b)/i);
      if (m && !/^(?:or|and)$/i.test(m[3]) && (i === 0 || /[\s(]/.test(s[i - 1]))) {
        push({ t: 'heading', v: m[3], explode: !!m[1], raw: m[0].trim() });
        i += m[0].length; continue;
      }
    }

    if (c === '[' && (i === 0 || /[\s([]/.test(s[i - 1]))) {
      const close = s.indexOf(']', i);
      const inner = close > 0 ? s.slice(i + 1, close) : '';
      if (close < 0 || /[\s(]/.test(inner) || inner.includes('[')) { push({ t: '(' }); brackets++; i++; continue; }
    }
    if (c === ']' && brackets > 0) { push({ t: ')' }); brackets--; i++; continue; }
    if (c === '(') { push({ t: '(' }); i++; continue; }
    if (c === ')') {
      push({ t: ')' }); i++;
      const suf = suffixAt(s, i, ds);
      if (suf) { push(suf.tok); i += suf.len; }
      continue;
    }

    // Line references in a numbered strategy: #1, S1, and bare numbers on a combination line
    m = at(/^(#|S)\s?(\d{1,3})\b/);
    if (m && (m[1] === '#' || (numbered && prefix === 'S'))) { push({ t: 'ref', n: +m[2], raw: m[0] }); i += m[0].length; continue; }
    m = at(/^(or|and)\/(\d+(?:\s*-\s*\d+)?(?:\s*,\s*\d+(?:\s*-\s*\d+)?)*)/i);
    if (m && numbered) {
      const ns = [];
      for (const part of m[2].split(',')) {
        const [a, b] = part.split('-').map(x => +x.trim());
        for (let k = a; k <= (b || a); k++) ns.push(k);
      }
      push({ t: 'refs', op: m[1].toUpperCase(), ns, raw: m[0] }); i += m[0].length; continue;
    }
    if (combo || numbered) {
      // "1# and 2#": a reference written backwards
      m = at(/^(\d{1,3})#(?=[\s)]|$)/);
      if (m) { push({ t: 'ref', n: +m[1], raw: m[0] }); i += m[0].length; continue; }
    }
    if (combo) {
      m = at(/^(\d{1,3})\b/);
      if (m) { push({ t: 'ref', n: +m[1], raw: m[0] }); i += m[0].length; continue; }
    }

    // Quoted phrases: "..." anywhere; '...' (Embase, Ovid) at a word boundary; {exact} (Scopus)
    if (c === '"' || c === '{' || (c === "'" && (i === 0 || /[\s(]/.test(s[i - 1])))) {
      const close = c === '{' ? '}' : c;
      let j = s.indexOf(close, i + 1);
      if (c === "'") while (j > 0 && j + 1 < s.length && /[\w]/.test(s[j + 1])) j = s.indexOf(close, j + 1);
      if (j < 0) throw new ParseError(`A ${c === '{' ? 'brace' : 'quote'} is never closed.`);
      const v = s.slice(i + 1, j).trim();
      i = j + 1;
      // Embase Emtree: 'asthma'/exp, 'asthma'/de
      const emtree = s.slice(i).match(/^\/(exp|de|mj|syn)\b/i);
      if (emtree) { push({ t: 'heading', v, explode: /exp/i.test(emtree[1]), raw: `'${v}'/${emtree[1]}` }); i += emtree[0].length; continue; }
      const tok = { t: 'term', v, quoted: true, exact: c === '{', scopusLoose: c === '"' && source === 'scopus', raw: c === '{' ? `{${v}}` : `${c}${v}${c}` };
      if (v) push(tok); else push({ t: 'empty' });
      const slop = s.slice(i).match(/^~(\d+)/);
      if (slop && v && /\s/.test(v)) { tok.prox = +slop[1]; tok.raw += slop[0]; i += slop[0].length; }
      i = afterTerm(s, i, ds, tok, out);
      continue;
    }

    // a word, with any Ovid .ti,ab. or Embase/Cochrane :ti,ab,kw suffix split off for afterTerm
    m = (ds.has('ovid') && (at(/^([^\s()"{}[\],]+?)(?=\.[a-z]{2,3}(?:,[a-z]{2,3})*\.(?:\s|$|\)|,))/i)
        || at(OVID_SUFFIX_NO_DOT_WORD)))
      || (ds.has('colon') && at(/^([^\s()"{}[\],:]+?)(?=:\s?[a-z]{2,3}(?:\s?,\s?[a-z]{2,3})*\.?(?:\s|$|\)))/i))
      || at(/^[^\s()"{}[\],]+/);
    if (!m) {
      if (c === '[') {
        const tag = s.slice(i).match(/^\[[^\]]*\]/);
        if (tag) { push({ t: 'drop', raw: tag[0], why: 'a field tag with no search term before it' }); i += tag[0].length; continue; }
      }
      throw new ParseError(`Couldn't read "${s.slice(i, i + 12)}".`);
    }
    let w = m[1] || m[0];
    const glued = w.match(/^(.*[^A-Z])(AND|OR|NOT)$/);
    if (glued && /[*?$)\]]$/.test(glued[1])) w = glued[1];
    i += w.length;

    const upper = w.toUpperCase();
    if (upper === 'AND' || upper === 'OR' || upper === 'NOT') {
      // Scopus AND NOT is one operator, the loosest
      if (upper === 'AND' && source === 'scopus' && /^\s+NOT\b/i.test(s.slice(i))) {
        i += s.slice(i).match(/^\s+NOT/i)[0].length;
        push({ t: 'op', v: 'ANDNOT' }); continue;
      }
      push({ t: 'op', v: upper }); continue;
    }
    // proximity: Scopus W/3 PRE/3, WoS NEAR/3 NEAR SAME, Ovid adj3 ADJ, Cochrane and Embase NEXT NEAR/3 NEXT/3,
    // EBSCO N3 W3
    let near = w.match(/^(W|PRE|NEAR|N|NEXT)\/(\d+)$/i);
    if (near) { push({ t: 'near', n: +near[2], ordered: /^(PRE|NEXT)$/i.test(near[1]), raw: w, kind: near[1].toUpperCase() }); continue; }
    if (w === 'NEAR') { push({ t: 'near', n: source === 'wos' ? 15 : 5, ordered: false, raw: w, kind: 'NEAR', defaulted: true }); continue; }
    near = w.match(/^adj(\d*)$/i);
    if (near) { push({ t: 'near', n: near[1] ? +near[1] : 1, ordered: !near[1] || near[1] === '1', raw: w, kind: 'ADJ' }); continue; }
    if (w === 'NEXT') { push({ t: 'near', n: 1, ordered: true, raw: w, kind: 'NEXT' }); continue; }
    if (w === 'SAME') { push({ t: 'op', v: 'AND', same: true, raw: w }); continue; }
    if (source === 'ebsco') {
      near = w.match(/^([NW])(\d+)$/);
      if (near) { push({ t: 'near', n: +near[2], ordered: near[1] === 'W', raw: w, kind: `EBSCO-${near[1]}` }); continue; }
    }
    // Ovid reads words side by side as one phrase: "heart attack.ti,ab." is the phrase heart attack
    const prev = out[out.length - 1];
    if (ds.has('ovid') && prev && prev.t === 'term' && !prev.quoted && !prev.tag && !prev.closed) {
      prev.v += ` ${w}`;
      prev.raw += ` ${w}`;
      prev.phrase = true;
      i = afterTerm(s, i, ds, prev, out);
      continue;
    }
    const tok = { t: 'term', v: w, quoted: false, raw: w };
    push(tok);
    i = afterTerm(s, i, ds, tok, out);
  }
  return out;
}

// After a term: a PubMed [tag] or an Ovid / Embase / Cochrane suffix. Returns the new index.
function afterTerm(s, i, ds, tok, out) {
  const j = tagAfter(s, i, tok);
  if (j !== i) {
    tok.closed = true;
    if (!tok.quoted) {
      // merge the bare words before it (no operator between) into one phrase carrying the tag
      let k = out.length - 2;
      while (k >= 0 && out[k].t === 'term' && !out[k].quoted && !out[k].closed && !out[k].tag) k--;
      if (k < out.length - 2) {
        const words = out.slice(k + 1, out.length - 1);
        tok.v = [...words.map(w => w.v), tok.v].join(' ');
        tok.raw = [...words.map(w => w.raw), tok.raw].join(' ');
        tok.phrase = true;
        out.splice(k + 1, words.length);
      }
    }
    return j;
  }
  const suf = suffixAt(s, i, ds);
  if (suf) { out.push(suf.tok); tok.closed = true; return i + suf.len; }
  return i;
}

// After a term: a PubMed [tag] (and [tiab:~N] proximity). Returns the new index.
function tagAfter(s, i, tok) {
  const tag = s.slice(i).match(/^\s?\[([^\]]+)\]/);
  if (!tag) return i;
  const name = tag[1].trim().toLowerCase();
  const prox = name.match(/^(tiab|ti|ab|title\/abstract|title|abstract|ad|affiliation):~(\d+)$/);
  if (prox) {
    tok.field = PUBMED_TAGS.find(([re]) => re.test(prox[1]))?.[1] || TAK;
    tok.prox = +prox[2];
    tok.raw += tag[0].trim();
    return i + tag[0].length;
  }
  for (const [re, f, ref] of PUBMED_TAGS) {
    if (re.test(name)) {
      tok.tag = f;
      tok.tagRef = ref || name;
      tok.raw += tag[0].trim();
      tok.noexp = /noexp/.test(name);
      tok.major = /majr|major/.test(name);
      return i + tag[0].length;
    }
  }
  tok.tag = 'unknown';
  tok.tagRef = name;
  tok.raw += tag[0].trim();
  return i + tag[0].length;
}

// Ovid suffixes are sometimes written without the closing period (asthma.mp, (a or b).ti,ab): only known codes count.
const OVID_CODE = '(?:ti|ab|tw|mp|kw|kf|sh|hw|pt|fs|ot|nm|rn|jw|jn|so|au|in|tx|af|ds|dv|tn|ab,ti)';
const OVID_SUFFIX_NO_DOT = new RegExp(`^\\.(${OVID_CODE}(?:,${OVID_CODE})*)(?=\\s|$|\\))`, 'i');
const OVID_SUFFIX_NO_DOT_WORD = new RegExp(`^([^\\s()"{}[\\],]+?)(?=\\.${OVID_CODE}(?:,${OVID_CODE})*(?:\\s|$|\\)))`, 'i');

// After a term or ")": an Ovid .ti,ab. or Embase/Cochrane :ti,ab,kw suffix.
function suffixAt(s, i, ds) {
  const text = s.slice(i);
  let m = text.match(/^\.([a-z]{2,3}(?:,[a-z]{2,3})*)\.(?=\s|$|\)|,)/i) || (ds.has('ovid') && text.match(OVID_SUFFIX_NO_DOT));
  if (m && ds.has('ovid')) {
    const codes = m[1].split(',');
    const [field, ref] = fieldFromCodes(codes);
    return { tok: { t: 'suffix', field, fieldRef: ref || `.${m[1]}.`, raw: m[0] }, len: m[0].length };
  }
  m = text.match(/^:\s?([a-z]{2,3}(?:\s?,\s?[a-z]{2,3})*)\.?(?=\s|$|\))/i);
  if (m && ds.has('colon')) {
    const codes = m[1].split(',').map(c => c.trim());
    const [field, ref] = fieldFromCodes(codes);
    return { tok: { t: 'suffix', field, fieldRef: ref || `:${m[1]}`, raw: m[0] }, len: m[0].length };
  }
  return null;
}

// A limit token from a Scopus LIMIT-TO key, a filter function or a WoS limit code.
function limitFromKey(key, vals, neg, raw, source) {
  if (key === 'PUBYEAR') {
    const years = [];
    for (const v of vals) {
      const r = v.match(/^(\d{4})\s*-\s*(\d{4})$/);
      if (r) { for (let y = +r[1]; y <= +r[2]; y++) years.push(y); continue; }
      if (/^\d{4}$/.test(v)) years.push(+v);
    }
    return { t: 'limit', kind: 'years', years, neg, raw };
  }
  if (key === 'DOCTYPE') return { t: 'limit', kind: 'type', values: vals.map(v => v.toLowerCase()), neg, raw };
  if (key === 'LANGUAGE') return { t: 'limit', kind: 'lang', values: vals.map(v => v.toLowerCase()), neg, raw };
  if (key === 'SRCTYPE') return { t: 'limit', kind: 'srctype', values: vals.map(v => v.toLowerCase()), neg, raw };
  if (key === 'OA' || key === 'OPENACCESS') return { t: 'limit', kind: 'oa', values: vals, neg, raw };
  return { t: 'limit', kind: 'unsupported', key, values: vals, neg, raw };
}

// ---------------------------------------------------------------------------------------------------------------
// Parser: tokens -> tree, with each database's operator precedence.
// ---------------------------------------------------------------------------------------------------------------

// Binding power by database. PubMed reads left to right (all equal); Scopus binds OR tightest and AND NOT loosest;
// Web of Science, Ovid, EBSCO and Cochrane: NOT, then AND, then OR. Proximity always binds tightest.
const POWER = {
  pubmed: { OR: 2, AND: 2, NOT: 2, ANDNOT: 2 },
  scopus: { OR: 4, AND: 3, NOT: 3, ANDNOT: 2 },
  default: { OR: 2, AND: 3, NOT: 4, ANDNOT: 4 },
};
const NEAR_POWER = 9;

function parse(tokens, source, changes) {
  let p = 0;
  const power = POWER[source] || POWER.default;
  const peek = () => tokens[p];
  const mixed = new Set();

  function primary() {
    const t = tokens[p];
    if (!t) throw new ParseError('The search ends where a term was expected.');
    if (t.t === '(' || t.t === 'fieldopen') {
      p++;
      if (t.t === 'fieldopen' && t.single) {
        const node = primary();
        return withSuffix({ k: 'field', field: t.field, fieldRef: t.fieldRef, raw: t.raw, kid: node });
      }
      if (peek() && peek().t === ')') { p++; return withSuffix({ k: 'empty' }); }
      const node = expr(0);
      if (!peek() || peek().t !== ')') throw new ParseError('A parenthesis is opened but never closed.');
      p++;
      const inner = t.t === 'fieldopen' ? { k: 'field', field: t.field, fieldRef: t.fieldRef, raw: t.raw, kid: node } : node;
      return withSuffix(inner);
    }
    if (t.t === ')') throw new ParseError('A parenthesis is closed but was never opened.');
    if (t.t === 'op') {
      if (t.v === 'NOT') { p++; return { k: 'not', a: null, b: primary() }; }
      throw new ParseError(`${t.v} has nothing before it.`);
    }
    if (t.t === 'near') throw new ParseError(`${t.raw} has nothing before it.`);
    p++;
    if (t.t === 'term') return withSuffix({ k: 'term', ...t });
    if (t.t === 'heading') return withSuffix({ k: 'heading', ...t });
    if (t.t === 'limit') return { k: 'limit', ...t };
    if (t.t === 'ref') return { k: 'ref', n: t.n, raw: t.raw };
    if (t.t === 'refs') return { k: 'refs', op: t.op, ns: t.ns, raw: t.raw };
    if (t.t === 'drop') return { k: 'drop', raw: t.raw, why: t.why };
    if (t.t === 'empty') return { k: 'empty' };
    if (t.t === 'suffix') throw new ParseError(`The field code ${t.raw} has no search term before it.`);
    throw new ParseError('Unexpected token.');
  }

  function withSuffix(node) {
    const t = tokens[p];
    if (t && t.t === 'suffix') {
      p++;
      return { k: 'field', field: t.field, fieldRef: t.fieldRef, raw: t.raw, kid: node, suffix: true };
    }
    return node;
  }

  function expr(minPower) {
    let left = primary();
    for (;;) {
      const t = peek();
      if (!t || t.t === ')') break;
      let op;
      let bp;
      if (t.t === 'op') { op = t.v; bp = power[op]; }
      else if (t.t === 'near') { op = 'NEAR'; bp = NEAR_POWER; }
      else { op = 'AND'; bp = power.AND; t.implicit = true; }   // two terms side by side: AND
      if (bp < minPower || (bp === minPower && minPower > 0)) break;
      if (t.t === 'op' || t.t === 'near') p++;
      if (op !== 'NEAR') mixed.add(op === 'ANDNOT' ? 'NOT' : op);
      const right = expr(bp + (op === 'NEAR' ? 1 : 0.5));
      if (op === 'NEAR') left = { k: 'near', a: left, b: right, n: t.n, ordered: t.ordered, raw: t.raw, kind: t.kind, defaulted: t.defaulted };
      else if (op === 'NOT' || op === 'ANDNOT') left = { k: 'not', a: left, b: right };
      else left = { k: op.toLowerCase(), kids: [left, right], same: t.same };
      if (t.same) changes.add('proximity', 'SAME', 'AND', 'SAME means "in the same address" in Web of Science; OpenAlex ran it as AND');
    }
    return left;
  }

  const tree = expr(0);
  if (p < tokens.length) {
    const t = tokens[p];
    throw new ParseError(t.t === ')' ? 'A parenthesis is closed but was never opened.' : 'The search has something extra at the end.');
  }
  return { tree, mixed };
}

// ---------------------------------------------------------------------------------------------------------------
// Tree passes: references, fields, headings, limits, simplification.
// ---------------------------------------------------------------------------------------------------------------

function resolveRefs(node, lines, changes, seen = new Set()) {
  if (!node) return node;
  if (node.k === 'ref' || node.k === 'refs') {
    const ns = node.k === 'ref' ? [node.n] : node.ns;
    const kids = ns.map(n => {
      const line = lines.get(n);
      if (!line) throw new ParseError(`${node.raw} refers to search line ${n}, which isn't in what you pasted.`);
      if (seen.has(n)) throw new ParseError(`Search line ${n} refers to itself.`);
      line.used = true;
      return resolveRefs(structuredClone(line.tree), lines, changes, new Set([...seen, n]));
    });
    if (kids.length === 1) return kids[0];
    return { k: node.op === 'AND' ? 'and' : 'or', kids };
  }
  for (const key of ['a', 'b', 'kid']) if (node[key]) node[key] = resolveRefs(node[key], lines, changes, seen);
  if (node.kids) node.kids = node.kids.map(k => resolveRefs(k, lines, changes, seen));
  return node;
}

// Give every term its OpenAlex field: its own tag, else the enclosing field function or suffix, else the default.
function assignFields(node, inherited, source, changes, ctx) {
  if (!node) return node;
  if (node.k === 'field') {
    const f = node.field;
    const ref = node.fieldRef;
    if (f === 'drop') {
      changes.add('fields', node.raw, 'left out', `OpenAlex can't search this field (${ref}) as text`);
      return { k: 'empty' };
    }
    if (f.startsWith('limit:')) {
      return limitFromField(node, f.slice(6), source, changes);
    }
    noteField(ref, node.raw, f, changes);
    return assignFields(node.kid, f === 'heading' ? { heading: true, ref } : { field: f, ref }, source, changes, ctx);
  }
  if (node.k === 'term') {
    let field = inherited?.field;
    let heading = inherited?.heading;
    if (node.tag) {
      if (node.tag === 'unknown') {
        changes.add('fields', `[${node.tagRef}]`, `searched in ${FIELD_WORDS[TAK]}`, 'OpenAlex doesn\'t know this field tag');
        field = TAK; heading = false;
      } else if (node.tag === 'heading') { heading = true; field = null; }
      else if (node.tag.startsWith('limit:')) {
        return limitFromField({ ...node, kid: { k: 'term', v: node.v, quoted: node.quoted } }, node.tag.slice(6), source, changes);
      } else { field = node.tag; heading = false; noteField(node.tagRef, `[${node.tagRef}]`, field, changes); }
    }
    if (node.prox) {
      // PubMed "a b"[tiab:~N]: the phrase's words within N words of each other
      const words = node.v.split(/\s+/).filter(Boolean);
      changes.add('proximity', node.raw, `within ${node.prox} words`, 'OpenAlex counts distance in word moves, so terms in reverse order must be up to 2 words closer');
      if (words.length >= 2) {
        return { k: 'near', a: { k: 'term', v: words[0], quoted: false, field: field || TAK }, b: { k: 'term', v: words.slice(1).join(' '), quoted: words.length > 2, field: field || TAK }, n: node.prox, raw: node.raw, field: field || TAK };
      }
    }
    if (heading) return { k: 'heading', v: node.v, explode: !node.noexp, raw: node.raw, major: node.major };
    if (!field) {
      field = TAK;
      if (source === 'pubmed' && ctx.anyTagged) {
        changes.add('fields', node.raw, `searched in ${FIELD_WORDS[TAK]}`, 'PubMed also maps untagged words to MeSH headings (automatic term mapping); OpenAlex searched the words');
      } else if ((source === 'scopus' || source === 'wos') && ctx.anyTagged) {
        changes.add('fields', node.raw, `searched in ${FIELD_WORDS[TAK]}`, 'a word outside any field searches all fields in the source database; OpenAlex searched titles, abstracts and keywords');
      }
    }
    return { ...node, field };
  }
  if (node.k === 'heading') return node;
  if (node.k === 'drop') {
    changes.add('fields', node.raw, 'left out', node.why);
    return { k: 'empty' };
  }
  if (node.k === 'near') {
    node.a = assignFields(node.a, inherited, source, changes, ctx);
    node.b = assignFields(node.b, inherited, source, changes, ctx);
    return node;
  }
  if (node.k === 'not') {
    node.a = node.a && assignFields(node.a, inherited, source, changes, ctx);
    node.b = assignFields(node.b, inherited, source, changes, ctx);
    return node;
  }
  if (node.kids) node.kids = node.kids.map(k => assignFields(k, inherited, source, changes, ctx));
  return node;
}

function noteField(ref, raw, field, changes) {
  const why = {
    'pubmed-tiab': null,
    'pubmed-tw': 'PubMed\'s [tw] also covers MeSH headings and publication types',
    'author-keywords': 'OpenAlex has no author-keyword field; it matched its own keywords along with titles and abstracts',
    'keywords-plus': 'OpenAlex has no Keywords Plus (words from cited titles); it searched titles, abstracts and keywords',
    'all-fields': 'the source searches every field; OpenAlex searched titles, abstracts and keywords',
    'unknown-field': 'OpenAlex doesn\'t know this field code; it searched titles, abstracts and keywords',
    KEY: 'Scopus KEY searches only keywords and index terms; OpenAlex searched titles, abstracts and keywords',
    AUTHKEY: 'OpenAlex has no author-keyword field; it searched titles, abstracts and keywords',
    ALL: 'Scopus ALL searches every field; OpenAlex searched titles, abstracts and keywords',
  }[ref];
  if (why) changes.add('fields', raw, `searched in ${FIELD_WORDS[field] || field}`, why);
  if (field === 'byline') changes.add('fields', raw, 'searched author names as words', 'OpenAlex matches author names as text; check the results for namesakes');
}

// A field that is really a limit (Ovid .pt., PubMed [pt]/[la]/[dp], EBSCO PT): the term's words are its values.
function limitFromField(node, kind, source, changes) {
  const vals = [];
  (function walk(n) {
    if (!n) return;
    if (n.k === 'term') vals.push(n.v);
    for (const key of ['a', 'b', 'kid']) walk(n[key]);
    (n.kids || []).forEach(walk);
  })(node.kid || node);
  const raw = node.raw || vals.join(' ');
  if (kind === 'year') {
    const years = [];
    for (const v of vals) {
      const r = v.match(/^(\d{4})\s*[-:]\s*(\d{4})$/);
      if (r) { for (let y = +r[1]; y <= +r[2]; y++) years.push(y); continue; }
      if (/^\d{4}$/.test(v)) years.push(+v);
    }
    return { k: 'limit', kind: 'years', years, raw };
  }
  if (kind === 'type') return { k: 'limit', kind: 'type', values: vals.map(v => v.toLowerCase()), raw };
  if (kind === 'filter') {
    // PubMed filters: humans, english, y_10, randomizedcontrolledtrial, ffrft ...
    const v = vals.join(' ').toLowerCase().replace(/\s+/g, '');
    const years = v.match(/^y_(\d+)$/);
    if (years) return { k: 'limit', kind: 'lastyears', n: +years[1], raw };
    if (LANGUAGES[v]) return { k: 'limit', kind: 'lang', values: [v], raw };
    const design = { randomizedcontrolledtrial: 'randomized controlled trial', systematicreview: 'systematic review',
      metaanalysis: 'meta-analysis', review: 'review' }[v];
    if (design) return { k: 'limit', kind: 'type', values: [design], raw };
    if (v === 'humans' || v === 'animals') return { k: 'heading', v, explode: false, raw };
    return { k: 'limit', kind: 'unsupported', key: 'PubMed filter', values: vals, raw };
  }
  if (kind === 'lang') return { k: 'limit', kind: 'lang', values: vals.map(v => v.toLowerCase()), raw };
  return { k: 'limit', kind: 'unsupported', key: kind, values: vals, raw };
}

// MeSH, Emtree and subject headings: searched as the heading's words, in titles, abstracts and keywords.
function headingsToWords(node, changes, source, topLevel) {
  if (!node) return node;
  if (node.k === 'heading') {
    const name = node.v.replace(/\/.*$/, '').trim();
    const words = name.replace(/[,]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    const label = { pubmed: 'MeSH heading', ovid: 'subject heading', embase: 'Emtree heading', cochrane: 'MeSH heading', ebsco: 'subject heading' }[source] || 'subject heading';
    changes.add('headings', node.raw, `searched as words in ${FIELD_WORDS[TAK]}`,
      `OpenAlex can't search ${label}s yet${node.explode ? ', so the narrower headings it would include (explosion) are lost' : ''}; works without these words in their text are missed`);
    return { k: 'term', v: words, quoted: false, field: TAK, raw: node.raw, fromHeading: true };
  }
  for (const key of ['a', 'b', 'kid']) if (node[key]) node[key] = headingsToWords(node[key], changes, source, false);
  if (node.kids) node.kids = node.kids.map(k => headingsToWords(k, changes, source, false));
  return node;
}

// Pull limits and MeSH check tags (humans, animals) out of the top-level AND chain. Returns { tree, limits }.
function extractLimits(tree, changes) {
  const limits = [];
  const isCheckTag = n => n && n.k === 'heading' && CHECK_TAGS.has(n.v.toLowerCase().replace(/\/.*$/, '').trim());
  const isCheckTagGroup = n => isCheckTag(n) || (n && (n.k === 'or' || n.k === 'and') && n.kids.every(isCheckTagGroup))
    || (n && n.k === 'not' && isCheckTagGroup(n.b) && (!n.a || isCheckTagGroup(n.a)));

  function top(node, neg) {
    if (!node) return null;
    if (node.k === 'limit') { limits.push({ ...node, neg: !!(node.neg ^ neg) }); return null; }
    if (node.k === 'or' && node.kids.every(k => k.k === 'limit')) {
      // LIMIT-TO(DOCTYPE,"ar") OR LIMIT-TO(DOCTYPE,"re"): one limit with both values
      const merged = mergeLimits(node.kids);
      if (merged) { limits.push({ ...merged, neg }); return null; }
    }
    if (isCheckTagGroup(node)) {
      changes.add('limits', describe(node), 'left out', 'OpenAlex can\'t filter by MeSH check tags such as Humans or Animals');
      return null;
    }
    if (node.k === 'and') {
      const kids = node.kids.map(k => top(k, neg)).filter(Boolean);
      return kids.length === 0 ? null : kids.length === 1 ? kids[0] : { ...node, kids };
    }
    if (node.k === 'not' && node.a) {
      const a = top(node.a, neg);
      const b = top(node.b, !neg);
      if (!b) return a;
      if (!a) return { k: 'not', a: null, b };
      return { k: 'not', a, b };
    }
    if (node.k === 'field' && node.kid) return { ...node, kid: top(node.kid, neg) };
    return node;
  }
  const rest = top(tree, false);
  // limits anywhere else (inside an OR with search terms) can't be applied
  (function walk(n) {
    if (!n) return;
    if (n.k === 'limit') { changes.add('limits', n.raw, 'left out', 'a limit inside an OR group can\'t be applied as a filter'); n.k = 'empty'; return; }
    for (const key of ['a', 'b', 'kid']) walk(n[key]);
    (n.kids || []).forEach(walk);
  })(rest);
  return { tree: rest, limits };
}

function mergeLimits(kids) {
  const kinds = new Set(kids.map(k => k.kind));
  if (kinds.size !== 1) return null;
  const kind = [...kinds][0];
  if (kind === 'years') return { k: 'limit', kind, years: kids.flatMap(k => k.years), raw: kids.map(k => k.raw).join(' OR ') };
  if (['type', 'lang', 'srctype', 'oa', 'unsupported'].includes(kind)) {
    return { k: 'limit', kind, key: kids[0].key, values: kids.flatMap(k => k.values), raw: kids.map(k => k.raw).join(' OR ') };
  }
  return null;
}

function describe(node) {
  if (!node) return '';
  if (node.raw) return node.raw;
  if (node.k === 'heading' || node.k === 'term') return node.v;
  if (node.kids) return node.kids.map(describe).join(` ${node.k.toUpperCase()} `);
  if (node.k === 'not') return `${describe(node.a)} NOT ${describe(node.b)}`.trim();
  return '';
}

// Drop empties, flatten nested and/or, unwrap field nodes (fields now live on the terms).
function simplify(node) {
  if (!node) return null;
  if (node.k === 'empty' || node.k === 'drop') return null;
  if (node.k === 'field') return simplify(node.kid);
  if (node.k === 'and' || node.k === 'or') {
    const kids = [];
    for (const k of node.kids.map(simplify).filter(Boolean)) {
      if (k.k === node.k) kids.push(...k.kids); else kids.push(k);
    }
    if (!kids.length) return null;
    const seen = new Set();
    const unique = kids.filter(k => {
      const key = k.k === 'term' ? `${k.field}|${k.quoted}|${k.v.toLowerCase()}` : null;
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (unique.length === 1) return unique[0];
    return { ...node, kids: unique };
  }
  if (node.k === 'not') {
    const a = simplify(node.a);
    const b = simplify(node.b);
    if (!b) return a;
    return { k: 'not', a, b };
  }
  if (node.k === 'near') {
    const a = simplify(node.a);
    const b = simplify(node.b);
    if (!a || !b) return a || b;
    return { ...node, a, b };
  }
  return node;
}

// ---------------------------------------------------------------------------------------------------------------
// Emit OQL.
// ---------------------------------------------------------------------------------------------------------------

function fieldsOf(node, acc = new Set()) {
  if (!node) return acc;
  if (node.k === 'term') acc.add(node.field || TAK);
  if (node.k === 'near') {
    if (node.field) acc.add(node.field);
    fieldsOf(node.a, acc);
    fieldsOf(node.b, acc);
    return acc;
  }
  for (const key of ['a', 'b']) if (node[key]) fieldsOf(node[key], acc);
  (node.kids || []).forEach(k => fieldsOf(k, acc));
  return acc;
}

const MAX_NEAR_PAIRS = 25;

// Characters a search word can't carry: periods go (U.S. -> US), other punctuation becomes a space.
function sanitize(v) {
  return v.replace(/(\p{L})\.(?=\p{L})/gu, '$1').replace(/[^\p{L}\p{N}\s'*?$#-]/gu, ' ').replace(/(^|\s)[-']+|[-']+(?=\s|$)/g, '$1')
    .replace(/\s+/g, ' ').trim();
}

// OpenAlex's wildcard limits: 3+ letters before a wildcard and none leading; in a phrase or proximity search at most
// two, each with 4+ letters before it. A wildcard that breaks a limit is dropped (the word runs whole), said so.
function fitWildcards(values, inPhrase, changes, raw) {
  const total = values.reduce((n, v) => n + (v.match(/[*?]/g) || []).length, 0);
  const min = inPhrase && total >= 2 ? 4 : 3;
  let kept = 0;
  let dropped = false;
  const out = values.map(v => v.split(' ').map(word => word.replace(/([\p{L}\p{N}]*)([*?])/gu, (m, pre, w) => {
    if (pre.length < min || (inPhrase && kept >= 2)) { dropped = true; return pre; }
    kept++;
    return pre + w;
  })).filter(Boolean).join(' '));
  if (dropped) {
    changes.add('wildcards', raw, 'ran without some wildcards',
      'OpenAlex needs 3 letters before a wildcard, and in a phrase or proximity search allows two, each after 4 letters');
  }
  return out;
}

function cleanWord(v, changes, raw) {
  let w = v;
  // Ovid $ and $N, WoS $ (zero or one letter), Ovid # (one letter)
  if (/\$\d*/.test(w)) {
    if (/\$\d+/.test(w)) changes.add('wildcards', raw || v, w.replace(/\$\d+/g, '*'), 'OpenAlex has no limited truncation ($N); it truncated without a limit');
    w = w.replace(/\$\d*/g, '*');
  }
  if (/\w#\w*/.test(w)) w = w.replace(/#/g, '?');
  return sanitize(w);
}

// Ovid's ? means zero or one letter (colo?r: color, colour); OpenAlex's ? means exactly one. Run both forms.
function ovidQuestion(text, node, changes) {
  // only the ? the person typed (Ovid's # also becomes ? and means exactly one letter)
  if (!/\?/.test(node.v) || /\?.*\?/.test(text) || /#/.test(node.v)) return text;
  changes.add('wildcards', node.raw, 'both spellings, with and without the letter', 'Ovid\'s ? matches zero or one letter; OpenAlex\'s ? matches exactly one');
  return `(${text.replace('?', '')} OR ${text})`;
}

const CURRENT = { source: null };

function searchText(node, changes, parentOp, inNot) {
  if (node.k === 'term') {
    let v = cleanWord(node.v, changes, node.raw);
    // heading words run as loose words, unless a wildcard needs them quoted
    const phrase = node.quoted || (/\s/.test(v) && (!node.fromHeading || /[*?]/.test(v)));
    [v] = fitWildcards([v], phrase, changes, node.raw);
    if (!v) return null;
    if (!phrase && /^(within|stemmed|and|or|not)$/i.test(v)) return `"${v}"`;
    if (phrase) {
      if (node.scopusLoose) {
        const wild = /[*?]/.test(v);
        const multi = /\s/.test(v);
        if (!wild && multi) {
          changes.add('phrases', node.raw, 'searched as a stemmed phrase', 'Scopus\'s quoted phrases also match plurals and spelling variants; OpenAlex\'s stemmed phrase does the same');
          return `stemmed "${v.replace(/"/g, '')}"`;
        }
        if (!wild && !multi) {
          changes.add('phrases', node.raw, 'searched as a stemmed word', 'Scopus\'s quotes also match plurals and spelling variants; OpenAlex\'s stemmed search does the same');
          return /^(within|stemmed|and|or|not)$/i.test(v) ? `"${v}"` : v;
        }
        if (multi) changes.add('phrases', node.raw, 'searched as an exact phrase', 'a phrase with a wildcard runs exactly in OpenAlex, so the plurals and variants Scopus\'s quotes add are missed');
        else return v;
      }
      if (CURRENT.source === 'ovid' && !node.quoted) return ovidQuestion(`"${v.replace(/"/g, '')}"`, node, changes);
      return `"${v.replace(/"/g, '')}"`;
    }
    if (CURRENT.source === 'ovid') return ovidQuestion(v, node, changes);
    return v;
  }
  if (node.k === 'near') return nearText(node, changes);
  if (node.k === 'not') {
    const a = node.a ? searchText(node.a, changes, 'NOT') : null;
    const b = searchText(node.b, changes, 'NOT', true);
    if (!b) return a;
    const bb = needsParens(node.b) ? `(${b})` : b;
    if (!a) return `NOT ${bb}`;
    const aa = needsParens(node.a) ? `(${a})` : a;
    return `${aa} NOT ${bb}`;
  }
  const op = node.k.toUpperCase();
  const parts = node.kids.map(k => {
    const t = searchText(k, changes, op);
    if (!t) return null;
    return needsParens(k) && (k.k !== node.k) ? `(${t})` : t;
  }).filter(Boolean);
  if (!parts.length) return null;
  return parts.join(` ${op} `);
}

// "(a and b within 3 words of each other)" inside has (...) needs no second pair of parentheses
function stripOuter(text) {
  if (!text.startsWith('(') || !text.endsWith(')')) return text;
  let depth = 0;
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') q = !q;
    if (q) continue;
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0 && i < text.length - 1) return text; }
  }
  return text.slice(1, -1);
}

function needsParens(node) {
  return node && (node.k === 'and' || node.k === 'or' || node.k === 'not');
}

// "a NEAR/3 b" -> ("a" and "b" within 3 words of each other); OR groups on either side expand pairwise.
function nearText(node, changes) {
  const flat = n => {
    if (n.k === 'term') return [n];
    if (n.k === 'or') { const all = n.kids.map(flat); return all.every(Boolean) ? all.flat() : null; }
    return null;
  };
  const as = flat(node.a);
  const bs = flat(node.b);
  const raw = node.raw;
  let n = node.n;
  if (node.kind === 'ADJ') n = Math.max(1, n - 1);
  const phrase = node.ordered && n <= 1;
  if (!phrase) {
    const why = node.kind === 'ADJ'
      ? `Ovid ${raw} allows ${n} word${n > 1 ? 's' : ''} between the terms; OpenAlex counts word moves, so terms in reverse order must be closer`
      : 'OpenAlex counts distance in word moves, so terms in reverse order must be up to 2 words closer';
    changes.add('proximity', raw, `within ${n} words`, why);
  }
  if (node.ordered && !phrase) {
    changes.add('proximity', raw, `within ${n} words, any order`, 'OpenAlex proximity ignores word order');
  } else if (node.defaulted) {
    changes.add('proximity', raw, 'within 15 words', 'Web of Science\'s plain NEAR means within 15 words');
  }
  if (!as || !bs || as.length * bs.length > MAX_NEAR_PAIRS) {
    changes.add('proximity', raw, 'AND', as && bs ? `the proximity search would need ${as.length * bs.length} word pairs; OpenAlex ran it as AND` : 'OpenAlex proximity takes words and phrases, not nested groups; it ran as AND');
    const a = searchText(node.a, changes, 'AND');
    const b = searchText(node.b, changes, 'AND');
    if (!a || !b) return a || b;
    return `(${needsParens(node.a) ? `(${a})` : a} AND ${needsParens(node.b) ? `(${b})` : b})`;
  }
  // adjacent in order (Ovid adj, adj1, Cochrane NEXT) between single words: a phrase
  const pairs = [];
  for (const a of as) {
    for (const b of bs) {
      const [av, bv] = fitWildcards([cleanWord(a.v, changes, a.raw), cleanWord(b.v, changes, b.raw)], true, changes, raw);
      if (!av || !bv) continue;
      if (phrase) { pairs.push(`"${av} ${bv}"`); continue; }
      const quote = a.quoted || b.quoted || /[*?\s]/.test(av + bv);
      const q = v => (quote ? `"${v.replace(/"/g, '')}"` : v);
      pairs.push(`(${q(av)} and ${q(bv)} within ${n} words of each other)`);
    }
  }
  if (!pairs.length) return null;
  if (pairs.length === 1) return pairs[0];
  if (as.length > 1 || bs.length > 1) {
    changes.add('proximity', raw, `${pairs.length} word pairs, joined with OR`, 'OpenAlex proximity takes one word or phrase on each side, so each pair is its own proximity search');
  }
  return `(${pairs.join(' OR ')})`;
}

function emitClause(node, changes) {
  const fields = fieldsOf(node);
  if (fields.size === 1) {
    const field = [...fields][0];
    const text = searchText(node, changes);
    return text ? `${field} has (${stripOuter(text)})` : null;
  }
  if (node.k === 'and' || node.k === 'or') {
    // siblings searching the same field share one clause: title-abstract has (asthma OR wheez*)
    const groups = [];
    const byField = new Map();
    for (const k of node.kids) {
      const fs = fieldsOf(k);
      if (fs.size === 1) {
        const f = [...fs][0];
        if (!byField.has(f)) { const g = { field: f, kids: [] }; byField.set(f, g); groups.push(g); }
        byField.get(f).kids.push(k);
      } else groups.push({ node: k });
    }
    const parts = groups.map(g => {
      if (g.node) {
        const c = emitClause(g.node, changes);
        return c ? `(${c})` : null;
      }
      const sub = g.kids.length === 1 ? g.kids[0] : { k: node.k, kids: g.kids };
      const text = searchText(sub, changes);
      return text ? `${g.field} has (${stripOuter(text)})` : null;
    }).filter(Boolean);
    return parts.join(` ${node.k} `);
  }
  if (node.k === 'not') {
    const a = node.a ? emitClause(node.a, changes) : null;
    const b = emitClause(node.b, changes);
    const bb = fieldsOf(node.b).size > 1 ? `(${b})` : b;
    return a ? `${fieldsOf(node.a).size > 1 && node.a.k !== 'and' ? `(${a})` : a} and not ${bb}` : `not ${bb}`;
  }
  if (node.k === 'near') {
    // terms in different fields: OpenAlex proximity runs in one field
    changes.add('proximity', node.raw, `searched in ${FIELD_WORDS[TAK]}`, 'the two sides of a proximity search were in different fields');
    const setField = n => { if (!n) return; if (n.k === 'term' || n.k === 'near') n.field = TAK; ['a', 'b'].forEach(k => setField(n[k])); (n.kids || []).forEach(setField); };
    setField(node);
    return emitClause(node, changes);
  }
  return null;
}

function rawFor(l, v) {
  const parts = String(l.raw || '').split(/\s+OR\s+/i);
  return parts.find(p => p.toLowerCase().includes(String(v).toLowerCase())) || v;
}

function limitClauses(limits, changes, source) {
  const out = [];
  for (const l of limits) {
    if (l.kind === 'year' || l.kind === 'years') {
      let from = l.from ?? null;
      let to = l.to ?? null;
      if (l.kind === 'years') {
        if (!l.years.length) { changes.add('limits', l.raw, 'left out', 'couldn\'t read the years'); continue; }
        from = Math.min(...l.years); to = Math.max(...l.years);
        const contiguous = to - from + 1 === new Set(l.years).size;
        if (!contiguous) changes.add('limits', l.raw, `published ${from} through ${to}`, 'OpenAlex took the range from the first to the last year listed');
      }
      if (l.neg) { changes.add('limits', l.raw, 'left out', 'excluding years isn\'t supported in this translation'); continue; }
      if (from && to && from === to) out.push(`year is (${from})`);
      else {
        if (from) out.push(`year >= (${from})`);
        if (to) out.push(`year <= (${to})`);
      }
      continue;
    }
    if (l.kind === 'lastyears') {
      const y = new Date().getFullYear() - l.n + 1;
      out.push(`year >= (${y})`);
      changes.add('limits', l.raw, `published ${y} or later`, 'OpenAlex limits by publication year, not by the exact date');
      continue;
    }
    if (l.kind === 'lang') {
      const codes = [];
      for (const v of l.values) {
        const code = LANGUAGES[v.toLowerCase().replace(/[^a-z]/g, '')];
        if (code) codes.push(code); else changes.add('limits', v, 'left out', 'OpenAlex doesn\'t recognize this language');
      }
      if (codes.length) out.push(`language is ${l.neg ? 'not ' : ''}(${[...new Set(codes)].join(' or ')})`);
      continue;
    }
    if (l.kind === 'type') {
      const types = [];
      const designs = [];
      for (const v of l.values) {
        const key = v.toLowerCase().replace(/^"|"$/g, '').trim();
        const hit = TYPES[key];
        if (hit === undefined || hit === null) { changes.add('limits', rawFor(l, v), 'left out', 'OpenAlex has no matching document type'); continue; }
        if (hit[2]) changes.add('limits', rawFor(l, v), `type ${hit[1]}`, hit[2]);
        if (hit[0] === 'type') types.push(hit[1]);
        else if (hit[0] === 'design') designs.push(hit[1]);
        else if (hit[0] === 'retracted') out.push('it\'s retracted');
      }
      if (types.length) out.push(`type is ${l.neg ? 'not ' : ''}(${[...new Set(types)].join(' or ')})`);
      if (designs.length) {
        out.push(`study design is ${l.neg ? 'not ' : ''}(${[...new Set(designs)].join(' or ')})`);
        changes.add('limits', designs.join(', '), 'OpenAlex study design', 'OpenAlex tags study designs from the paper itself, not from an indexer, so its matches differ');
      }
      continue;
    }
    if (l.kind === 'srctype') {
      const map = { j: 'journal', journal: 'journal', b: 'book series', k: 'book', book: 'book', p: 'conference', conference: 'conference', d: 'repository' };
      const vals = l.values.map(v => map[v.toLowerCase()]).filter(Boolean);
      if (vals.length === 1 && vals[0] === 'journal') out.push(`source type is ${l.neg ? 'not ' : ''}(journal)`);
      else changes.add('limits', l.raw, 'left out', 'only the journal source type is translated');
      continue;
    }
    if (l.kind === 'oa') {
      if (!l.neg) out.push('it\'s open access');
      changes.add('limits', l.raw, 'open access', 'OpenAlex\'s open-access flag covers any free version it found, which can differ from Scopus\'s');
      continue;
    }
    changes.add('limits', l.raw, 'left out', `OpenAlex has no equivalent for this limit${l.key ? ` (${l.key})` : ''}`);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------------------------------------------

export function translateSearch(input) {
  if (!input || typeof input !== 'string') return null;
  const text = normalize(input).trim();
  if (!text || text.length > 50000) return null;
  const source = detectSource(text);
  if (!source) return null;
  return translateFrom(text, source);
}

// Web of Science's history: `(...) (Topic) and 2024 or 2023 (Publication Years) and Article (Document Types)`, and its
// refine text `, Language: English, Publication date: since 2000`. Rewritten as WoS field codes before parsing.
const WOS_HISTORY_FIELDS = { topic: 'TS', title: 'TI', abstract: 'AB', 'all fields': 'ALL', 'author keywords': 'AK',
  'publication years': 'PY', 'document types': 'DT', languages: 'LA' };
function wosHistory(text) {
  let t = text.replace(/\s+/g, ' ').trim()
    .replace(/,?\s*Language:\s*([A-Za-z]+)/gi, ' AND LA=($1)')
    .replace(/,?\s*Publication date:\s*since\s*(\d{4})/gi, ' AND PUBYEAR >= $1');
  const re = /(.+?)\s*\[(topic|title|abstract|all fields|author keywords|publication years|document types|languages)\]\s*(?:and\s+|$)/gi;
  if (!/\[(?:topic|publication years|document types|languages)\]/i.test(t)) return t === text.replace(/\s+/g, ' ').trim() ? text : t;
  const parts = [];
  let last = 0;
  for (const m of t.matchAll(re)) {
    if (m.index !== last) return text;
    parts.push(`${WOS_HISTORY_FIELDS[m[2].toLowerCase()]}=(${m[1].trim()})`);
    last = m.index + m[0].length;
  }
  if (last !== t.length) return text;
  return parts.join(' AND ');
}

function translateFrom(text, source) {
  if (source === 'wos') text = wosHistory(text);
  const dialects = dialectsIn(text, source);
  CURRENT.source = source;
  const changes = new Changes();
  const result = { source, sourceLabel: LABELS[source] || LABELS.mixed, oql: null, changes: [], error: null };

  try {
    let tree;
    const numbered = splitNumberedLines(text) || splitNumberedLines(unflattenLines(text));
    if (numbered) {
      const lines = new Map();
      for (const line of numbered) {
        const combo = isCombinationLine(line.text);
        let body = line.text;
        let limitToks = [];
        // Ovid: "limit 7 to (english language and yr="2000 - 2020")", "remove duplicates from 8"
        const lim = body.match(/^limit\s+(\d+)\s+to\s+(.+)$/i);
        if (lim) { body = lim[1]; limitToks = ovidLimits(lim[2], changes); }
        const dup = body.match(/^remove duplicates from\s+(\d+)$/i);
        if (dup) body = dup[1];
        // "Deduplicate" on its own works on the line before it
        const bare = /^(?:deduplicate|remove duplicates)\s*$/i.test(body);
        if (bare) body = String(numbered[numbered.indexOf(line) - 1]?.n ?? '');
        const toks = tokenize(body, { source, dialects, numbered: true, combo: combo || !!lim || !!dup || bare, prefix: line.prefix });
        let { tree: t } = parse(toks, source, changes);
        if (!combo) notePrecedence(toks, source, changes);
        if (limitToks.length) t = { k: 'and', kids: [t, ...limitToks] };
        lines.set(line.n, { tree: t, used: false });
      }
      const last = numbered[numbered.length - 1];
      lines.get(last.n).used = true;
      tree = resolveRefs(structuredClone(lines.get(last.n).tree), lines, changes);
      const unused = numbered.filter(l => !lines.get(l.n).used).map(l => l.n);
      changes.add('numbered-lines', `${numbered.length} numbered lines`, `ran line ${last.n}, with the lines it combines`, 'the last line is the search; OpenAlex wrote it out in full');
      if (unused.length) changes.add('numbered-lines', `line${unused.length > 1 ? 's' : ''} ${unused.join(', ')}`, 'left out', 'the last line doesn\'t use them');
      // a reference that never resolved to a line ("3 AND 6" left over from "3# and 6#") would search the digits
      if (hasNumberTerms(tree)) throw new ParseError('Some search lines refer to other lines in a way OpenAlex can\'t read. Paste the lines with one numbered line per row.');
    } else {
      // several complete searches, one per line, with nothing joining them: ask rather than guess AND or OR
      const searches = text.split(/\n/).map(l => l.trim()).filter(Boolean);
      if (searches.length >= 2 && searches.every(balanced) && !searches.some((l, k) => k > 0 && (/^(?:AND|OR|NOT)\b|^\)/i.test(l) || /\b(?:AND|OR|NOT)$|\($/i.test(searches[k - 1])))) {
        throw new ParseError(`This has ${searches.length} separate searches, one per line. Paste one at a time, or join them with OR (any of them) or AND (all of them).`);
      }
      const flat = text.replace(/\s+/g, ' ').replace(/^\d{1,2}[.)]\s+(?=\S)/, '').replace(/^\d{1,2}\s+(?=\()/, '');
      const toks = tokenize(flat, { source, dialects, numbered: false, combo: false });
      const parsed = parse(toks, source, changes);
      tree = resolveRefs(parsed.tree, new Map(), changes);
      notePrecedence(toks, source, changes);
    }

    const ctx = { anyTagged: anyTagged(tree) };
    tree = assignFields(tree, null, source, changes, ctx);
    const extracted = extractLimits(tree, changes);
    tree = headingsToWords(extracted.tree, changes, source, true);
    tree = simplify(tree);
    const filters = limitClauses(extracted.limits, changes, source);
    const search = tree ? emitClause(tree, changes) : null;
    if (!search && !filters.length) {
      result.error = { message: 'Nothing in this search can run in OpenAlex.' };
    } else {
      result.oql = `get works where ${[search, ...filters].filter(Boolean).join(' and ')}`;
    }
  } catch (e) {
    if (!(e instanceof ParseError)) throw e;
    result.error = { message: e.message };
  }
  result.changes = summarize(changes.list);
  return result;
}

function balanced(line) {
  let depth = 0;
  let q = false;
  for (const c of line) {
    if (c === '"') q = !q;
    if (q) continue;
    if (c === '(') depth++;
    if (c === ')' && --depth < 0) return false;
  }
  return depth === 0 && !q;
}

function hasNumberTerms(node) {
  if (!node) return false;
  if (node.k === 'term' && !node.quoted && /^\d{1,3}[#*?]?$/.test(node.v)) return true;
  return ['a', 'b', 'kid'].some(k => hasNumberTerms(node[k])) || (node.kids || []).some(hasNumberTerms);
}

function anyTagged(node) {
  if (!node) return false;
  if (node.k === 'field' || node.k === 'heading' || (node.k === 'term' && (node.tag || node.prox))) return true;
  return ['a', 'b', 'kid'].some(k => anyTagged(node[k])) || (node.kids || []).some(anyTagged);
}

function hasUnparenthesizedMix(toks) {
  const levels = [new Set()];
  const ends = new Set(['term', 'heading', ')', 'ref', 'refs', 'limit', 'drop', 'suffix']);
  const starts = new Set(['term', 'heading', '(', 'fieldopen', 'ref', 'refs', 'limit', 'drop']);
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    const l = levels[levels.length - 1];
    // two operands side by side: an implicit AND
    if (k > 0 && starts.has(t.t) && ends.has(toks[k - 1].t) && l) l.add('AND');
    if (t.t === '(' || t.t === 'fieldopen') { if (!t.single) levels.push(new Set()); }
    else if (t.t === ')') levels.pop();
    else if (t.t === 'op' && l) l.add(t.v === 'ANDNOT' ? 'NOT' : t.v);
    const cur = levels[levels.length - 1];
    if (cur && cur.has('OR') && (cur.has('AND') || cur.has('NOT'))) return true;
  }
  return false;
}

function notePrecedence(toks, source, changes) {
  if (!hasUnparenthesizedMix(toks)) return;
  const how = { pubmed: 'left to right, as PubMed does', scopus: 'OR before AND, as Scopus does' }[source] || 'AND before OR, as the source database does';
  changes.add('precedence', 'AND and OR without parentheses', `grouped ${how}`, 'the OpenAlex query shows the grouping with parentheses; check it matches what you meant');
}

// Ovid "limit N to (...)": english language, yr="2000 - 2020", humans, journal article ...
function ovidLimits(text, changes) {
  const out = [];
  const t = text.replace(/^\(|\)$/g, '');
  const yr = t.match(/yr\s*=\s*["']?\s*(\d{4})\s*(?:-\s*(\d{4}|current))?\s*["']?/i);
  if (yr) out.push({ k: 'limit', kind: 'year', from: +yr[1], to: yr[2] && /^\d{4}$/.test(yr[2]) ? +yr[2] : (yr[2] ? null : +yr[1]), raw: yr[0] });
  for (const [re, lim] of [
    [/english language|\benglish\b/i, { kind: 'lang', values: ['english'] }],
    [/\bfrench\b/i, { kind: 'lang', values: ['french'] }],
    [/\bgerman\b/i, { kind: 'lang', values: ['german'] }],
    [/\bspanish\b/i, { kind: 'lang', values: ['spanish'] }],
    [/journal article/i, { kind: 'type', values: ['article'] }],
    [/\breview\b/i, { kind: 'type', values: ['review'] }],
    [/randomized controlled trial/i, { kind: 'type', values: ['randomized controlled trial'] }],
    [/meta analysis|meta-analysis/i, { kind: 'type', values: ['meta-analysis'] }],
    [/systematic review/i, { kind: 'type', values: ['systematic review'] }],
  ]) {
    if (re.test(t)) out.push({ k: 'limit', ...lim, raw: (t.match(re) || [''])[0] });
  }
  // whatever is left: humans, animals, age groups ("adolescent <13 to 18 years>"), abstracts, full text ...
  let rest = t;
  if (yr) rest = rest.replace(yr[0], ' ');
  for (const l of out) rest = rest.replace(new RegExp(l.raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
  for (const item of rest.split(/\s+(?:and|or)\s+|[(),;]/i).map(x => x.trim()).filter(x => /[a-z]/i.test(x))) {
    changes.add('limits', `limit to ${item}`, 'left out', 'OpenAlex has no equivalent for this Ovid limit');
  }
  return out;
}

/** The text a reviewer pastes into their methods: the original search, the OpenAlex query, the date, the changes. */
export function methodsText(result, original, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  const lines = [
    `Search translated from ${result.sourceLabel} to OpenAlex on ${day}.`,
    '',
    `Original (${result.sourceLabel}):`,
    original.trim(),
    '',
    'OpenAlex query, as run:',
    result.oql || '(not run)',
  ];
  if (result.changes.length) {
    lines.push('', 'Differences:');
    for (const c of result.changes) lines.push(`- ${c.original}: ${c.result} (${c.why})`);
  }
  return lines.join('\n');
}
