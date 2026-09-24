/**
 * Search-box intent classifier: browser/Node port of work/features.py + the exported int8 weights (#1347).
 *
 * No dependencies. Feature extraction must stay byte-for-byte equal to features.py:
 *   - NFC normalise, collapse whitespace, trim; `low` = lowercase
 *   - char n-grams n=1..4 over " " + low + " "
 *   - word unigrams/bigrams over low.split(" "), first/last word
 *   - shape features on the original casing
 *   - FNV-1a 32-bit over UTF-16 code units of "prefix:feature", masked to 2^buckets_log2
 * Score(class) = sum(w[class][bucket]) * scale[class] / sqrt(#active buckets) + bias[class]; softmax.
 *
 *   import { loadIntentModel, classifyIntent } from './intentModel.js'
 *   const model = loadIntentModel(weightsJson)         // parsed intent-weights.json
 *   classifyIntent(model, 'Climate OR change')        // { label, probs, confidence, buckets }
 */

const YEAR = /(?<!\d)(1[89]\d\d|20\d\d)(?!\d)/;
const DOI = /10\.\d{4,9}\/\S/;
const OP_WORD = /(?:^|\s)(AND|OR|NOT)(?:\s|$)/;
const URLISH = /https?:\/\/|www\.|\.(org|com|edu|net|gov)(\/|$)/;
const LEN_EDGES = [1, 2, 3, 5, 8, 12, 20, 40, 80];
const TOK_EDGES = [1, 2, 3, 5, 9];
const LETTER = /\p{L}/u;
const DIGIT = /\p{Nd}/u;

export function fnv1a16(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function bucketOf(n, edges) {
  for (let i = 0; i < edges.length; i++) if (n <= edges[i]) return String(i);
  return String(edges.length);
}

function scriptOf(ch) {
  const o = ch.codePointAt(0);
  if (o < 0x250) return 'lat';
  if (o >= 0x370 && o < 0x400) return 'grk';
  if (o >= 0x400 && o < 0x530) return 'cyr';
  if (o >= 0x590 && o < 0x600) return 'heb';
  if ((o >= 0x600 && o < 0x700) || (o >= 0x750 && o < 0x780)) return 'ara';
  if (o >= 0x900 && o < 0xe00) return 'ind';
  if (o >= 0xe00 && o < 0xe80) return 'tha';
  if (o >= 0x3040 && o < 0x3100) return 'kana';
  if ((o >= 0xac00 && o < 0xd7b0) || (o >= 0x1100 && o < 0x1200)) return 'kor';
  if ((o >= 0x3400 && o < 0xa000) || (o >= 0xf900 && o < 0xfb00) || (o >= 0x20000 && o < 0x30000)) return 'cjk';
  return 'oth';
}

export function normalize(q) {
  return String(q ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** All feature strings (before hashing). Mirrors features.features(). */
export function features(q) {
  const s = normalize(q);
  if (!s) return ['s:empty'];
  const low = s.toLowerCase();
  const out = [];
  const pad = ' ' + low + ' ';
  // Python slices by code point; JS by UTF-16 unit. Use Array.from for code points to match.
  const cps = Array.from(pad);
  const n = cps.length;
  for (const k of [1, 2, 3, 4]) {
    for (let i = 0; i + k <= n; i++) out.push(`c${k}:` + cps.slice(i, i + k).join(''));
  }
  const words = low.split(' ');
  for (const w of words) out.push('w:' + w);
  for (let i = 0; i + 1 < words.length; i++) out.push(`b:${words[i]} ${words[i + 1]}`);
  out.push('w0:' + words[0]);
  out.push('wz:' + words[words.length - 1]);
  const sChars = Array.from(s);
  out.push('s:len' + bucketOf(sChars.length, LEN_EDGES));
  out.push('s:tok' + bucketOf(words.length, TOK_EDGES));
  const letters = sChars.filter((c) => LETTER.test(c));
  let upper = 0;
  for (const c of letters) if (c !== c.toLowerCase()) upper++;
  let digits = 0;
  for (const c of sChars) if (DIGIT.test(c)) digits++;
  if (letters.length) {
    out.push('s:up' + bucketOf(Math.floor((10 * upper) / letters.length), [0, 1, 3, 6, 9]));
    out.push(sChars[0] !== sChars[0].toLowerCase() ? 's:cap1' : 's:cap0');
    let capwords = 0;
    for (const w of s.split(' ')) {
      if (!w) continue;
      const c0 = Array.from(w)[0];
      if (LETTER.test(c0) && c0 !== c0.toLowerCase()) capwords++;
    }
    out.push('s:capw' + bucketOf(Math.floor((10 * capwords) / words.length), [0, 3, 6, 9]));
  }
  out.push('s:dig' + bucketOf(Math.floor((10 * digits) / sChars.length), [0, 1, 3, 6]));
  const scripts = new Map();
  for (const c of letters) {
    const sc = scriptOf(c);
    scripts.set(sc, (scripts.get(sc) || 0) + 1);
  }
  if (scripts.size) {
    let best = null, bestN = -1;
    for (const [sc, cnt] of scripts) if (cnt > bestN) { best = sc; bestN = cnt; }
    out.push('s:script' + best);
    if (scripts.size > 1) out.push('s:mixedscript');
  }
  if (s.includes('"')) out.push('s:quote');
  if (s.includes('(') || s.includes(')')) out.push('s:paren');
  if (s.includes('*')) out.push('s:star');
  if (s.includes(',')) out.push('s:comma');
  if (s.includes(':')) out.push('s:colon');
  if (s.includes(';')) out.push('s:semi');
  if (s.endsWith('?')) out.push('s:qmark');
  if (s.slice(0, -1).includes('.')) out.push('s:dotmid');
  if (OP_WORD.test(s)) out.push('s:opword');
  if (YEAR.test(s)) out.push('s:year');
  if (DOI.test(s)) out.push('s:doi');
  if (URLISH.test(s)) out.push('s:url');
  const last = s[s.length - 1];
  if (',;:('.includes(last) || s.endsWith(' and') || s.endsWith(' or')) out.push('s:trailopen');
  return out;
}

export function buckets(q, log2) {
  const mask = (1 << log2) - 1;
  const set = new Set();
  for (const f of features(q)) set.add(fnv1a16(f) & mask);
  return Array.from(set).sort((a, b) => a - b);
}

/** Decode the exported weights once. */
export function loadIntentModel(blob) {
  const bin = typeof atob === 'function' ? atob(blob.w) : Buffer.from(blob.w, 'base64').toString('binary');
  const w = new Int8Array(bin.length);
  for (let i = 0; i < bin.length; i++) w[i] = (bin.charCodeAt(i) << 24) >> 24;
  const nb = 1 << blob.buckets_log2;
  if (w.length !== blob.classes.length * nb) throw new Error('intent weights: size mismatch');
  return { classes: blob.classes, log2: blob.buckets_log2, nb, w, scale: Float32Array.from(blob.scale), bias: Float32Array.from(blob.bias) };
}

export function classifyIntent(model, q) {
  const b = buckets(q, model.log2);
  const k = model.classes.length;
  const logits = new Float64Array(k);
  const norm = 1 / Math.sqrt(b.length || 1);
  for (let c = 0; c < k; c++) {
    let acc = 0;
    const off = c * model.nb;
    for (let i = 0; i < b.length; i++) acc += model.w[off + b[i]];
    logits[c] = acc * model.scale[c] * norm + model.bias[c];
  }
  let max = -Infinity;
  for (let c = 0; c < k; c++) if (logits[c] > max) max = logits[c];
  let z = 0;
  const probs = {};
  const e = new Float64Array(k);
  for (let c = 0; c < k; c++) { e[c] = Math.exp(logits[c] - max); z += e[c]; }
  let best = 0;
  for (let c = 0; c < k; c++) { probs[model.classes[c]] = e[c] / z; if (e[c] > e[best]) best = c; }
  const sorted = Object.values(probs).sort((a, b) => b - a);
  return { label: model.classes[best], probs, confidence: sorted[0] - (sorted[1] || 0), buckets: b };
}
