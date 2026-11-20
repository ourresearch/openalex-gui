// Script-aware name folding for the add-works matcher (oxjob #1562).
//
// Why: the matcher used to keep only the letters a-z, so a byline written
// in Cyrillic, Greek, CJK or any other non-Latin script tokenized to
// nothing and could never match the claimant. A profile named
// "A. S. Ivanova" could not add a work signed "Иванова Анна Сергеевна",
// and a profile whose name is written in Cyrillic matched nothing at
// all. This module gives the matcher three things:
//   1. foldName: lowercases and strips Latin accents as before, but keeps
//      the letters of every other script intact (the API's phrase search
//      does not fold й or Greek accents, so the ladder must send them
//      as typed).
//   2. romanizations: Cyrillic (Russian and Ukrainian conventions) and
//      Greek written in Latin letters.
//   3. spellingKey: one coarse key per token that the common romanization
//      schemes share ("Pokrovskiy", "Pokrovskii", "Pokrovsky" and
//      "Покровский" all give "pokrovski"), so a byline and a profile name
//      written in different scripts still compare equal. The matcher only
//      compares keys across scripts: between two Latin names the key would
//      merge distinct names (Liu and Lu, Jiang and Yang).

// Relative path so audit scripts can load these helpers in plain Node.
import { EXTRA_FOLD } from '../../utils/highlightTerms.js';

const LATIN_MARKS_RE = /(\p{Script=Latin})\p{M}+/gu;
const GREEK_MARKS_RE = /(\p{Script=Greek})\p{M}+/gu;

// Latin letters that NFD does not decompose into base + accent, folded
// the way the API's search folds them. Before #1562 they were dropped
// outright ("Łukasz" -> "ukasz", "Đức" -> "uc"), which the API's phrase
// search never matches.
const LATIN_FOLD_RE = new RegExp(`[${Object.keys(EXTRA_FOLD).join('')}]`, 'g');

// A letter of a script other than Latin. Common and Inherited letters are
// shared across scripts and don't count: the modifier apostrophe in
// "OʼNeill" is a Common letter.
const NON_LATIN_LETTER_RE = /[^\P{L}\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u;

// Lowercase; strip accents from Latin letters only; fold the Latin
// letters NFD leaves alone. Letters of other scripts pass through
// unchanged (precomposed, NFC; toLowerCase writes Greek final sigma as ς,
// which is also how the API's phrase search wants it).
export function foldName(name) {
  return (name || '')
    .normalize('NFD')
    .replace(LATIN_MARKS_RE, '$1')
    .normalize('NFC')
    .toLowerCase()
    .replace(LATIN_FOLD_RE, c => EXTRA_FOLD[c]);
}

export function hasNonLatinLetters(name) {
  return NON_LATIN_LETTER_RE.test(name || '');
}

const mapChars = (token, map) => [...token].map(c => map[c] ?? c).join('');

// --- Cyrillic -------------------------------------------------------------
// Russian, after the 2013 passport / Library of Congress conventions; the
// spelling key then absorbs the y/j/i, kh/h, ts/c, ch/č... differences of
// the other schemes. Serbian, Macedonian and Belarusian letters included.
const CYRILLIC_RU = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'iu', я: 'ia',
  ѐ: 'e', ѝ: 'i', є: 'ie', і: 'i', ї: 'i', ґ: 'g', ў: 'u', ђ: 'dj',
  ј: 'j', љ: 'lj', њ: 'nj', ћ: 'c', џ: 'dz', ѓ: 'g', ќ: 'k', ѕ: 'dz',
};
// Ukrainian national romanization differs where the key notices: г is h
// (Hryhorii, not Grigorii).
const CYRILLIC_UK = { ...CYRILLIC_RU, г: 'h' };
const CYRILLIC_RE = /\p{Script=Cyrillic}/u;

// --- Greek ----------------------------------------------------------------
// ELOT 743 style. αυ/ευ read af/ef before a voiceless consonant or at the
// end, else av/ev; χ comes in two flavours, ch and h (Christos, Hristos).
const GREEK_LETTERS = {
  α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 'th', ι: 'i',
  κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p', ρ: 'r', σ: 's', ς: 's',
  τ: 't', υ: 'y', φ: 'f', ψ: 'ps', ω: 'o',
};
const GREEK_RE = /\p{Script=Greek}/u;

function romanizeGreek(token, chi) {
  const t = token.normalize('NFD').replace(GREEK_MARKS_RE, '$1').normalize('NFC')
    .replace(/^μπ/, 'b').replace(/^ντ/, 'd').replace(/^γκ/, 'g')
    .replace(/ου/g, 'ou')
    .replace(/([αεη])υ(?=[κπτχφθσςξψ]|$)/g, '$1f')
    .replace(/([αεη])υ/g, '$1v')
    .replace(/γγ/g, 'ng').replace(/γκ/g, 'ng').replace(/γχ/g, `n${chi}`)
    .replace(/γξ/g, 'nx').replace(/χ/g, chi);
  return mapChars(t, GREEK_LETTERS);
}

// Every Latin-letter reading of one (already folded) token: the token
// itself when it has no Cyrillic or Greek, else one string per scheme.
export function romanizations(token) {
  let out = [token];
  if (CYRILLIC_RE.test(token)) {
    out = [mapChars(token, CYRILLIC_RU), mapChars(token, CYRILLIC_UK)];
  } else if (GREEK_RE.test(token)) {
    out = [romanizeGreek(token, 'ch'), romanizeGreek(token, 'h')];
  }
  return [...new Set(out)];
}

// Coarse key that the common romanization schemes of one name share.
// The matcher compares keys only between names in different scripts, and
// only in its spelling-insensitive pass, which runs when the exact cascade
// found no strict or initials match. The first letter keeps its identity
// (bar y/j -> i and a word-initial ye -> e) so that initials still line up
// with full names.
export function spellingKey(token) {
  let t = token
    .replace(/x/g, 'ks')
    .replace(/ck/g, 'k')
    // A hard c is k (Greek κ, Cyrillic к written c: Comoutos, Nicolaos);
    // before h and z it is part of ch/cz, handled next.
    .replace(/c(?![ehiyz])/g, 'k')
    .replace(/szcz|shch|shtch/g, 's')
    .replace(/tsch|tch/g, 'c')
    .replace(/sch/g, 's')
    .replace(/ch|cz|ts|tz/g, 'c')
    .replace(/sh|sz/g, 's')
    .replace(/zh|dz/g, 'z')
    .replace(/kh/g, 'h')
    .replace(/th/g, 't')
    .replace(/ph/g, 'f')
    .replace(/w/g, 'v')
    .replace(/ou/g, 'u')
    // Greek μπ and ντ are written mb/mp and nd/nt (Lambrakis, Lamprakis).
    .replace(/mb/g, 'mp')
    .replace(/nd/g, 'nt')
    .replace(/[yj]/g, 'i')
    .replace(/(.)\1+/g, '$1');
  // Cyrillic е after a vowel or at the start is often written ye/ie
  // (Yevgeny, Sergeyevich).
  t = t.replace(/^ie/, 'e');
  if (t.length > 1) t = t[0] + t.slice(1).replace(/ie/g, 'e');
  return t.replace(/(.)\1+/g, '$1');
}
