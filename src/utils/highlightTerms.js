// Mark the searched words inside a raw affiliation string, like Ctrl+F (oxjob #1364, ZD 24627).
//
// The affiliation editor's search (elastic-api /raw-affiliation-strings ?q=) is an Elasticsearch
// simple_query_string with default_operator AND on a field that ignores case and accents
// (Łódź = Lodz, Straße = Strasse, measured live 16 Nov 2026) and matches whole words. So a row
// matches when every searched word appears somewhere in it, in any order. We mark each word (or
// "quoted phrase") where it appears, folded the same way, so every returned row shows why it matched.
// Rendering is by segments, never v-html: these strings come from publishers.

const WORD_RUN = /[\p{L}\p{N}]+/gu;
const NON_WORD_GAP = /^[^\p{L}\p{N}]{0,3}$/u; // "supérieure de Lyon", "Lyon, France": one mark
const SHORT = 2; // "de", "of", "la": marked only next to another searched word, else French bios light up

// Letters NFD does not split but Elasticsearch's asciifolding does. Shared with the
// add-works name matcher (AuthorCuration/nameScripts.js).
export const EXTRA_FOLD = {
  'ł': 'l', 'ø': 'o', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'đ': 'd', 'ð': 'd', 'þ': 'th',
  'ı': 'i', 'ħ': 'h', 'ŀ': 'l', 'ŧ': 't', 'ŋ': 'n',
};

function foldChar(ch) {
  const base = ch.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  let out = '';
  for (const c of base) out += EXTRA_FOLD[c] ?? c;
  return out;
}

export function fold(text) {
  let out = '';
  for (const ch of String(text ?? '')) out += foldChar(ch);
  return out;
}

// Folded text plus, for each folded code unit, where its source character starts and ends.
function foldWithMap(text) {
  let folded = '';
  const starts = [];
  const ends = [];
  let i = 0;
  for (const ch of text) {
    const f = foldChar(ch);
    // A combining accent in decomposed text folds to nothing: keep it with its letter.
    if (!f.length && ends.length) ends[ends.length - 1] = i + ch.length;
    for (let k = 0; k < f.length; k++) {
      starts.push(i);
      ends.push(i + ch.length);
    }
    folded += f;
    i += ch.length;
  }
  return { folded, starts, ends };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The searched words of a simple_query_string, without the words it excludes.
// Returns [{ pieces: ['ens', 'lyon', 'fr'], phrase: bool, prefix: bool }].
export function parseSearchTerms(q) {
  const terms = [];
  const tokens = String(q ?? '').match(/[-+]?"[^"]*"?(?:~\d*)?|[^\s"]+/g) || [];
  for (let token of tokens) {
    token = token.replace(/^[(+]+/, '');
    if (token.startsWith('~')) continue; // a slop or fuzziness suffix, not a word
    if (token.startsWith('-')) continue; // -word, -"phrase": excluded, so never marked
    const phrase = token.startsWith('"');
    const parts = phrase ? [token] : token.split('|');
    for (let part of parts) {
      part = part.replace(/^[("]+|[)"]+$/g, '').replace(/~\d*$/, '').replace(/[)"]+$/, '');
      const prefix = !phrase && part.endsWith('*');
      const pieces = fold(part).match(WORD_RUN);
      if (pieces) terms.push({ pieces, phrase, prefix });
    }
  }
  return terms;
}

function findAll(folded, pieces, prefix) {
  const core = pieces.map(escapeRe).join('[^\\p{L}\\p{N}]+') + (prefix ? '[\\p{L}\\p{N}]*' : '');
  // (^|non-word) instead of a lookbehind, which older Safari can't parse.
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${core})(?![\\p{L}\\p{N}])`, 'gu');
  const hits = [];
  let m;
  while ((m = re.exec(folded)) !== null) {
    const start = m.index + m[1].length;
    hits.push([start, start + m[2].length]);
    if (m[0].length === 0) re.lastIndex++;
  }
  return hits;
}

// [{ text, hit }] covering `text` in order; hit segments are the searched words.
export function highlightSegments(text, terms) {
  const str = String(text ?? '');
  if (!str || !terms?.length) return str ? [{ text: str, hit: false }] : [];
  const { folded, starts, ends } = foldWithMap(str);
  const toSource = ([a, b]) => [starts[a], ends[b - 1]];

  const long = [];
  const short = [];
  for (const term of terms) {
    let hits = findAll(folded, term.pieces, term.prefix);
    // "ens-lyon.fr" also matches rows where its words sit apart: mark the words then.
    if (!hits.length && !term.phrase && term.pieces.length > 1) {
      hits = term.pieces.flatMap((p) => findAll(folded, [p], false));
    }
    const isShort = !term.prefix && term.pieces.join('').length <= SHORT;
    (isShort ? short : long).push(...hits.map(toSource));
  }

  let ranges = long;
  if (!long.length) {
    ranges = short;
  } else {
    const adjacent = (a, b) => {
      const [x, y] = a[0] <= b[0] ? [a, b] : [b, a];
      return y[0] <= x[1] || NON_WORD_GAP.test(str.slice(x[1], y[0]));
    };
    let left = short;
    let grew = true;
    while (grew && left.length) {
      grew = false;
      const keep = left.filter((s) => ranges.some((r) => adjacent(r, s)));
      if (keep.length) {
        ranges = ranges.concat(keep);
        left = left.filter((s) => !keep.includes(s));
        grew = true;
      }
    }
  }
  if (!ranges.length) return [{ text: str, hit: false }];

  ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && (r[0] <= last[1] || NON_WORD_GAP.test(str.slice(last[1], r[0])))) {
      last[1] = Math.max(last[1], r[1]);
    } else {
      merged.push([r[0], r[1]]);
    }
  }

  const segments = [];
  let at = 0;
  for (const [a, b] of merged) {
    if (a > at) segments.push({ text: str.slice(at, a), hit: false });
    segments.push({ text: str.slice(a, b), hit: true });
    at = b;
  }
  if (at < str.length) segments.push({ text: str.slice(at), hit: false });
  return segments;
}
