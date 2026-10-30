// oxjob #1928: titles are text that may carry a little markup (<i>, <sub>, <mml:math>...). Pages render them
// with v-html after sanitize-html, which drops anything shaped like a tag, so a '<' that is text vanished with
// the words after it: "<Hygrophila phlomoides> Nees" showed " Nees", "1<m<p and c>0" showed "10".
// Rule: a '<' stays markup only when it opens a well-formed tag with a markup name; every other '<' is escaped
// first, so sanitize-html keeps it as text. Kept tags: b, i, em, strong, a (as before); other markup is
// dropped with its text kept (as before).
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = ["b", "i", "em", "strong", "a"];

// Element names that occur as markup in titles: HTML inline/block, JATS and MathML. A namespaced name
// (mml:math, jats:italic) always counts.
const MARKUP_NAMES = new Set([
  "a", "abbr", "b", "big", "br", "cite", "code", "del", "div", "em", "font", "i", "ins", "mark", "p", "q",
  "s", "small", "span", "strike", "strong", "sub", "sup", "tt", "u", "var", "wbr",
  "bold", "italic", "sc", "scp", "monospace", "underline", "overline", "roman", "sans-serif", "named-content",
  "styled-content", "inline-formula", "tex-math", "xref", "ext-link",
  "math", "mi", "mn", "mo", "mrow", "msub", "msup", "msubsup", "mfrac", "msqrt", "mtext", "mover", "munder",
]);

// '<', optional '/', a name, then only well-formed attributes (name="value" / name='value'), then '>' or '/>'.
// "<i − 1i>" or "<p and c>" carry words, not attributes, so they are text.
const TAG_AT = /^<\/?([a-zA-Z][a-zA-Z0-9-]*(?::[a-zA-Z][a-zA-Z0-9-]*)?)((?:\s+[a-zA-Z_:][a-zA-Z0-9_:.-]*\s*=\s*(?:"[^"<>]*"|'[^'<>]*'))*)\s*\/?>/;

// Elements that must never reach a page as text either: treated as markup whatever their attributes, so
// sanitize-html removes them (script/style with their content), as it always did.
const DANGEROUS_AT = /^<\/?(script|style|iframe|frame|img|svg|object|embed|applet|noscript|textarea|template|link|meta|base|form|input|button|select|video|audio|source)(?=[\s/>])[^<>]*>/i;

function opensMarkup(rest) {
  if (DANGEROUS_AT.test(rest)) return true;
  const m = TAG_AT.exec(rest);
  if (!m) return false;
  const name = m[1].toLowerCase();
  return name.includes(":") || MARKUP_NAMES.has(name);
}

export function escapeTextLessThan(title) {
  let out = "";
  for (let i = 0; i < title.length; i++) {
    const ch = title[i];
    if (ch === "<" && !opensMarkup(title.slice(i, i + 300))) out += "&lt;";
    else out += ch;
  }
  return out;
}

export function titleHtml(title) {
  return sanitizeHtml(escapeTextLessThan(title), { allowedTags: ALLOWED_TAGS });
}
