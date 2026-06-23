// Value-expression parser for the no-code builder (oxjob #507 Phases 5 + 6).
//
// When a user types a boolean expression INTO ONE VALUE CHIP — e.g.
// `cancer or tumor or neoplasm`, `a and b`, or (Phase 6) an explicitly
// parenthesized `(cancer or tumor) and therapy` — and presses Enter, the builder
// DECOMPOSES that text into the matching value tree (vleaf / vgroup) instead of
// storing the literal string as a single value. This module is the pure
// text -> AST half; v2Edit.decomposeValue turns the AST into real value nodes.
//
// SCOPE: this parses a single FIELD's VALUE list (the right-hand side of one
// clause), not whole filters. There are no field/operator tokens here — only
// terms joined by and/or, optionally negated and parenthesized.
//
// GRAMMAR (standard boolean precedence, matching OQL #503: NOT > AND > OR):
//   or   := and ( "or"  and )*
//   and  := not ( "and" not )*
//   not  := "not"* atom            (De Morgan'd down to leaves: NNF)
//   atom := "(" or ")" | term
//   term := one or more consecutive words (a multi-word phrase is ONE value;
//           a quoted "…" run and wildcards stay verbatim — the search surface is
//           re-derived per value at OQO-build time by searchSurfaceToFilter).
//
// `and`/`or`/`not` are operators ONLY as standalone words (case-insensitive,
// outside quotes). Inside quotes they are literal, so `"rock or roll"` is one
// value. This mirrors how every boolean query language (WoS/Scopus/OQL) reads
// bare connectives — a literal connective must be quoted.
//
// AST node shapes (intentionally simpler than the v2 value tree — no ids):
//   leaf   { t:"leaf", value:string, negated:boolean }
//   group  { t:"group", join:"and"|"or", children:[node...] }

const KEYWORDS = new Set(["and", "or", "not"]);

// ---- tokenizer -------------------------------------------------------------
// Emits { type:"lparen"|"rparen"|"and"|"or"|"not"|"word", text }. A `word` is one
// whitespace-/paren-delimited chunk; a quoted run is a single `word` keeping its
// quotes. Parens are split off even when glued to a word (`(cancer` / `not(`).
function tokenize(input) {
  const toks = [];
  const s = String(input == null ? "" : input);
  let i = 0;
  const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") { i += 1; continue; }
    if (ch === "(") { toks.push({ type: "lparen", text: "(" }); i += 1; continue; }
    if (ch === ")") { toks.push({ type: "rparen", text: ")" }); i += 1; continue; }
    if (ch === '"') {
      // read to the closing quote (or end of input); keep the quotes in the word
      let j = i + 1;
      while (j < n && s[j] !== '"') j += 1;
      const text = s.slice(i, j < n ? j + 1 : j); // include closing quote if present
      toks.push({ type: "word", text });
      i = j < n ? j + 1 : j;
      continue;
    }
    // a bare word: read until whitespace / paren / quote
    let j = i;
    while (j < n && !" \t\n\r()\"".includes(s[j])) j += 1;
    const raw = s.slice(i, j);
    const lower = raw.toLowerCase();
    if (KEYWORDS.has(lower)) toks.push({ type: lower, text: raw });
    else toks.push({ type: "word", text: raw });
    i = j;
  }
  return toks;
}

// ---- combinators -----------------------------------------------------------
const leaf = (value, negated = false) => ({ t: "leaf", value, negated: !!negated });

// Flatten same-join children so `a or b or c` is ONE three-child group, not nested
// pairs — matching the canonical value tree the server would render.
function group(join, left, right) {
  const kids = [];
  const push = (node) => {
    if (node.t === "group" && node.join === join) kids.push(...node.children);
    else kids.push(node);
  };
  push(left); push(right);
  return { t: "group", join, children: kids };
}

// De Morgan: push a NOT down to the leaves so the AST is in NNF (the value tree
// carries negation only on leaves — a vgroup has no `negated` flag). NOT(a OR b)
// = (NOT a AND NOT b); recursion handles nesting.
function negate(node) {
  if (node.t === "group") {
    return { t: "group", join: node.join === "and" ? "or" : "and",
             children: node.children.map(negate) };
  }
  return { t: "leaf", value: node.value, negated: !node.negated };
}

// ---- recursive-descent parser ---------------------------------------------
// Returns the AST root, or null when the input has no value terms at all.
export function parseValueExpr(input) {
  const toks = tokenize(input);
  let p = 0;
  const peek = () => toks[p];
  const eat = (type) => (peek() && peek().type === type ? toks[p++] : null);

  const parseAtom = () => {
    if (eat("lparen")) {
      const inner = parseOr();
      eat("rparen"); // tolerate a missing close paren (live typing)
      return inner; // may be null for "()"; caller filters empties
    }
    // a term: one or more consecutive words joined by single spaces
    const words = [];
    while (peek() && peek().type === "word") words.push(toks[p++].text);
    if (!words.length) return null;
    return leaf(words.join(" "));
  };

  const parseNot = () => {
    let neg = false;
    while (eat("not")) neg = !neg;
    const atom = parseAtom();
    if (!atom) return null;
    return neg ? negate(atom) : atom;
  };

  const parseAnd = () => {
    let left = parseNot();
    while (peek() && peek().type === "and") {
      p += 1;
      const right = parseNot();
      if (!right) break;
      left = left ? group("and", left, right) : right;
    }
    return left;
  };

  const parseOr = () => {
    let left = parseAnd();
    while (peek() && peek().type === "or") {
      p += 1;
      const right = parseAnd();
      if (!right) break;
      left = left ? group("or", left, right) : right;
    }
    return left;
  };

  const ast = parseOr();
  return ast || null;
}

// Should typing this text DECOMPOSE the value chip into multiple chips / a nested
// group, rather than store it as a single literal value? True only when the parse
// found a connector (i.e. the root is a group). A plain single term — even a quoted
// phrase like `"machine learning"` or a bare `not foo` — stays ONE value, so the
// caller keeps its normal single-value commit path (which already handles search
// surface routing and per-clause negation). Decomposition is about SPLITTING on
// and/or, not about reinterpreting a single typed value.
export function isCompoundValue(input) {
  const ast = parseValueExpr(input);
  return !!ast && ast.t === "group";
}
