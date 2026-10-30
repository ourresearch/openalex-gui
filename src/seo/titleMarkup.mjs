// oxjob #1928: which '<' in a title is markup and which is text. Dependency-free so the page head (seo/recordHead.mjs,
// also run by server/) and the v-html titles (titleHtml.js) share one rule. A '<' is markup only when it opens a
// well-formed tag with a markup name (or a dangerous element, whatever its attributes); every other '<' is text:
// "<Hygrophila phlomoides> Nees", "1<m<p and c>0", "<i − 1i>-associative".

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

// Elements that must never reach a page as text either: markup whatever their attributes, so they are removed
// as they always were (sanitize-html drops script/style with their content).
const DANGEROUS_AT = /^<\/?(script|style|iframe|frame|img|svg|object|embed|applet|noscript|textarea|template|link|meta|base|form|input|button|select|video|audio|source)(?=[\s/>])[^<>]*>/i;

// The markup tag that starts `rest`, or null when its '<' is text.
export function markupTagAt(rest) {
  const d = DANGEROUS_AT.exec(rest);
  if (d) return d[0];
  const m = TAG_AT.exec(rest);
  if (!m) return null;
  const name = m[1].toLowerCase();
  return name.includes(":") || MARKUP_NAMES.has(name) ? m[0] : null;
}

// For v-html: escape each text '<' so a sanitizer keeps it as text.
export function escapeTextLessThan(title) {
  let out = "";
  for (let i = 0; i < title.length; i++) {
    out += title[i] === "<" && !markupTagAt(title.slice(i, i + 300)) ? "&lt;" : title[i];
  }
  return out;
}

// For plain-text heads: remove markup tags, keep every text '<' (entities are left as they are).
export function stripMarkup(title) {
  let out = "";
  for (let i = 0; i < title.length; i++) {
    const tag = title[i] === "<" ? markupTagAt(title.slice(i, i + 300)) : null;
    if (tag) i += tag.length - 1;
    else out += title[i];
  }
  return out;
}
