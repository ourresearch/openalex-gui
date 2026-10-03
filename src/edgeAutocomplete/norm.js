// Text normalisation shared by the Worker, the browser client and the Databricks build (build/norm.py must match).
const FOLD_FROM = "\u00e0\u00e1\u00e2\u00e3\u00e4\u00e5\u00e7\u00e8\u00e9\u00ea\u00eb\u00ec\u00ed\u00ee\u00ef\u00f0\u00f1\u00f2\u00f3\u00f4\u00f5\u00f6\u00f8\u00f9\u00fa\u00fb\u00fc\u00fd\u00ff\u0101\u0103\u0105\u0107\u0109\u010b\u010d\u010f\u0111\u0113\u0115\u0117\u0119\u011b\u011d\u011f\u0121\u0123\u0125\u0127\u0129\u012b\u012d\u012f\u0131\u0135\u0137\u013a\u013c\u013e\u0140\u0142\u0144\u0146\u0148\u014d\u014f\u0151\u0155\u0157\u0159\u015b\u015d\u015f\u0161\u0163\u0165\u0167\u0169\u016b\u016d\u016f\u0171\u0173\u0175\u0177\u017a\u017c\u017e\u017f\u0192\u01a1\u01b0\u01ce\u01d0\u01d2\u01d4\u01d6\u01d8\u01da\u01dc\u01df\u01e1\u01e7\u01e9\u01eb\u01ed\u01f0\u01f5\u01f9\u01fb\u0201\u0203\u0205\u0207\u0209\u020b\u020d\u020f\u0211\u0213\u0215\u0217\u0219\u021b\u021f\u0227\u0229\u022b\u022d\u022f\u0231\u0233\u1e01\u1e03\u1e05\u1e07\u1e09\u1e0b\u1e0d\u1e0f\u1e11\u1e13\u1e15\u1e17\u1e19\u1e1b\u1e1d\u1e1f\u1e21\u1e23\u1e25\u1e27\u1e29\u1e2b\u1e2d\u1e2f\u1e31\u1e33\u1e35\u1e37\u1e39\u1e3b\u1e3d\u1e3f\u1e41\u1e43\u1e45\u1e47\u1e49\u1e4b\u1e4d\u1e4f\u1e51\u1e53\u1e55\u1e57\u1e59\u1e5b\u1e5d\u1e5f\u1e61\u1e63\u1e65\u1e67\u1e69\u1e6b\u1e6d\u1e6f\u1e71\u1e73\u1e75\u1e77\u1e79\u1e7b\u1e7d\u1e7f\u1e81\u1e83\u1e85\u1e87\u1e89\u1e8b\u1e8d\u1e8f\u1e91\u1e93\u1e95\u1e96\u1e97\u1e98\u1e99\u1e9b\u1ea1\u1ea3\u1ea5\u1ea7\u1ea9\u1eab\u1ead\u1eaf\u1eb1\u1eb3\u1eb5\u1eb7\u1eb9\u1ebb\u1ebd\u1ebf\u1ec1\u1ec3\u1ec5\u1ec7\u1ec9\u1ecb\u1ecd\u1ecf\u1ed1\u1ed3\u1ed5\u1ed7\u1ed9\u1edb\u1edd\u1edf\u1ee1\u1ee3\u1ee5\u1ee7\u1ee9\u1eeb\u1eed\u1eef\u1ef1\u1ef3\u1ef5\u1ef7\u1ef9";
const FOLD_TO = "aaaaaaceeeeiiiidnoooooouuuuyyaaaccccddeeeeegggghhiiiiijklllllnnnooorrrsssstttuuuuuuwyzzzsfouaiouuuuuaagkoojgnaaaeeiioorruusthaeooooyabbbcdddddeeeeefghhhhhiikkkllllmmmnnnnoooopprrrrsssssttttuuuuuvvwwwwwxxyzzzhtwysaaaaaaaaaaaaeeeeeeeeiioooooooooooouuuuuuuyyyy";
const GREEK = {"\u03b1": "alpha", "\u03b2": "beta", "\u03b3": "gamma", "\u03b4": "delta", "\u03b5": "epsilon", "\u03b6": "zeta", "\u03b7": "eta", "\u03b8": "theta", "\u03b9": "iota", "\u03ba": "kappa", "\u03bb": "lambda", "\u03bc": "mu", "\u03bd": "nu", "\u03be": "xi", "\u03c0": "pi", "\u03c1": "rho", "\u03c3": "sigma", "\u03c2": "sigma", "\u03c4": "tau", "\u03c5": "upsilon", "\u03c6": "phi", "\u03c7": "chi", "\u03c8": "psi", "\u03c9": "omega"};
const MULTI = [["\u00df", "ss"], ["\u00e6", "ae"], ["\u0153", "oe"], ["\u00fe", "th"], ["\u0133", "ij"]];

const FOLD = new Map();
for (let i = 0; i < FOLD_FROM.length; i++) FOLD.set(FOLD_FROM[i], FOLD_TO[i]);
const APOS = /[’'`´ʼ]/g;
const NONALNUM = /[^\p{L}\p{N}]+/gu;
const MARKS = /\p{M}/gu;
const LATIN = /[À-ɏḀ-ỿ]/g;
const GREEK_RE = /[α-ω]/g;
const ASCII = /^[\x00-\x7f]*$/;

export function norm(s, greek) {
  if (!s) return "";
  s = s.toLowerCase();
  if (ASCII.test(s)) return s.replace(APOS, "").replace(/[^a-z0-9]+/g, " ").trim();
  s = s.replace(APOS, "");
  for (const [a, b] of MULTI) if (s.includes(a)) s = s.split(a).join(b);
  if (greek) s = s.replace(GREEK_RE, (c) => (GREEK[c] ? " " + GREEK[c] + " " : c));
  s = s.normalize("NFC").replace(MARKS, "").replace(LATIN, (c) => FOLD.get(c) || c);
  return s.replace(NONALNUM, " ").trim();
}

const ENDS_OPEN = /[\p{L}\p{N}]$/u;
// -> [[token, complete], ...]; the last token is partial unless the string ends in a non-alphanumeric char;
// one-character tokens are always partial (initials match by prefix)
export function parse(q, greek) {
  const n = norm(q, greek);
  if (!n) return [];
  const toks = n.split(" ");
  const open = ENDS_OPEN.test(q);
  return toks.map((t, i) => [t, t.length > 1 && (i < toks.length - 1 || !open)]);
}

