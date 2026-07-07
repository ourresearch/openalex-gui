// Property-metadata + search-surface helpers for the no-code OQL builder (oxjob
// #428). Originally this module was also the OQO<->editor-tree adapter, but iter 22
// (decision B) made the server's `oql_render_v2` tree the builder's edit model, so
// the tree adapters (rootFromOqo / buildOqo / makeLeaf / value-tree constructors /
// the old BuilderFilter* components that consumed them) were retired. What remains
// are the pure, stateless helpers the live builder still imports:
//   - value-editor KIND from a property (text/number/boolean/entity)
//   - the UI operator list from a property's operator classes
//   - the search-term SURFACE form routing (bare/quoted/wildcard -> the right
//     `.search` / `.search.exact` column), shared by v2Edit.js + v2ToOqo.js.

// ---- property metadata -> value-editor kind ---------------------------------
// Value bricks are exactly text/search · number · boolean · entity (iter 20 —
// "no enum class; everything is an entity"). The fixed-vocab pickers that iter 11
// called "enum" (type/country/institution-type) are just entity value-picking
// over a list endpoint, so they report as "entity" with an enumEntity hint.

export function valueKindForProperty(prop) {
  if (!prop) return "text";
  const t = prop.type;
  if (t === "boolean") return "boolean";
  if (t === "number") return "number";
  if (t === "date" || t === "datetime") return "date"; // → OqlDateChip (calendar picker)
  if (t === "openalex_id") return "entity";
  if (prop.entity_type) return "entity"; // list-vocab entity (formerly "enum")
  return "text";
}

// An entity whose values come from a fixed `/{entity-type}` list rather than the
// `/autocomplete/{entity}` search — the only thing that distinguishes the old
// "enum" kind. Used by the value picker to pick its data source.
export function isListVocabEntity(prop) {
  return !!(prop && prop.type !== "openalex_id" && prop.entity_type);
}

export function autocompleteEntityFor(prop) {
  return prop?.entity_type || null;
}

// ---- property operator-classes -> UI operator options -----------------------
// Operators are strictly AFFIRMATIVE (iter 20 / decision 22): `is`, `has`,
// `>`… — never `is not` / `does not contain`. Negation lives on the value.

export function uiOperatorsForProperty(prop) {
  const cls = new Set(prop?.operators || []);
  const type = prop?.type;
  const out = [];
  const add = (label, op, unary = false) =>
    out.push({ key: `${op}|${unary}`, label, op, unary });

  if (type === "boolean") {
    add("is", "is");
    if (cls.has("null")) add("is unknown", "is", true);
    return out;
  }
  if (cls.has("search")) add("has", "has");
  if (cls.has("range")) {
    add("≥", ">=");
    add("≤", "<=");
    add(">", ">");
    add("<", "<");
  }
  if (cls.has("eq") || (!cls.has("search") && !cls.has("range"))) add("is", "is");
  else if (cls.has("range")) add("is", "is");
  if (cls.has("collection")) add("in collection", "in collection");
  if (cls.has("null")) add("is unknown", "is", true);
  return out;
}

// ---- search-term surface form (oxjob #428 iter 11) ---------------------------
// OQL search-value conventions (query_translation/oql_lang.py `_parse_search_atom`):
//   bare word     -> stemmed            (.search)
//   "quoted"      -> exact, no-stem     (.search.exact)  <- wildcards belong here
//   stemmed "phrase" -> stemmed, adjacent  (.search)
// The builder lets the user type those surface forms directly into a value box;
// each VALUE routes to its own column, so one row can mix exact + stemmed values
// (`has (amphibian or "amphibi*")`). A bare wildcard auto-routes to exact —
// stemming destroys the literal prefix, so `stemmed` + wildcard is invalid
// (the parser rejects it); the old passthrough produced exactly that bug.

const SEARCH_COL_RE = /\.search(\.exact)?$/;
export function isSearchColumn(col) {
  return typeof col === "string" && SEARCH_COL_RE.test(col);
}
export function searchBaseColumn(col) {
  return String(col).replace(SEARCH_COL_RE, "");
}
// The `.search` / `.search.exact` surface suffix of a search column ("" if none).
// Re-pointing a search filter to a sibling surface keeps each value's own suffix.
export function searchColumnSuffix(col) {
  const m = String(col).match(SEARCH_COL_RE);
  return m ? m[0] : "";
}

// Friendly PROXIMITY surface (oxjob #514) — the inverse of the backend `_render_term`
// (query_translation/oql_lang.py): the no-code builder lets a user type the readable list
// form `within N (a, b, ...)` and we encode it to the canonical `~`-string value the engine
// executes (binary #355 / K-ary #514). The ONE proximity surface: K operands (2+) within an
// N-word window. Quotes FREEZE an operand (exact); bare operands stem. Stemming is per-leaf:
//   all-bare    `within N (a, b)`         -> .search        `"a"~N~"b"`
//   any-quoted  `within N ("a", "b")`     -> .search.exact  `"a"~N~"b"`
//   K-ary       `within N ("a", "b", "c")` -> .search.exact `"a"~N~"b"~"c"`
// (The old `within N words` suffix / `within N words of` forms were removed.)
const PROX_LIST_RE = /^within\s+(\d+)\s*\(([^)]*)\)$/i;

// typed surface text -> { column_id, value } on a search base column
export function searchSurfaceToFilter(text, anyCol) {
  const base = searchBaseColumn(anyCol);
  const t = String(text).trim();
  // Proximity list first — its trailing `(...)` would otherwise be mis-read by the plain
  // quoted branch below.
  const lst = t.match(PROX_LIST_RE);
  if (lst) {
    const ops = lst[2]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const m = s.match(/^"(.*)"$/s);
        return { text: m ? m[1] : s, quoted: !!m };
      });
    if (ops.length >= 2) {
      // all-bare operands => stemmed (.search); any quoted => exact (.search.exact).
      const exact = ops.some((o) => o.quoted);
      const col = exact ? `${base}.search.exact` : `${base}.search`;
      // canonical `~`-string: operands are always quoted (structural delimiters); the
      // column carries stem-vs-exact. `"op1"~N~"op2"~"op3"...`.
      const value =
        `"${ops[0].text}"~${lst[1]}~"${ops[1].text}"` +
        ops.slice(2).map((o) => `~"${o.text}"`).join("");
      return { column_id: col, value };
    }
  }
  const stem = t.match(/^stemmed\s+(.+)$/i);
  if (stem && stem[1].startsWith('"')) {
    // auto-close an unbalanced phrase (`stemmed "bar baz` — Enter before the closing
    // quote); the literal lone `"` would silently vanish on the server round-trip (#560)
    const p = stem[1].slice(1).includes('"') ? stem[1] : `${stem[1]}"`;
    return { column_id: `${base}.search`, value: p }; // stemmed adjacent phrase
  }
  if (/^".*"~\d+(~".*")*$/.test(t)) {
    return { column_id: `${base}.search.exact`, value: t }; // proximity passthrough (binary/K-ary)
  }
  const quoted = t.match(/^"(.*)"$/s);
  if (quoted) {
    const inner = quoted[1];
    // exact: the column suffix carries exactness; single token stays bare,
    // a multi-word phrase keeps its quotes (mirrors the parser's encoding)
    return { column_id: `${base}.search.exact`, value: /\s/.test(inner) ? t : inner };
  }
  // An unbalanced LEADING quote (`"bar baz` — the user hit Enter before closing it) reads
  // as exact-phrase intent: auto-close it. Passing the literal `"` through as part of a
  // stemmed term made the quote silently vanish on the server round-trip (#560 Phase 3).
  if (t.length > 1 && t.startsWith('"') && !t.slice(1).includes('"')) {
    const inner = t.slice(1).trim();
    if (inner) return { column_id: `${base}.search.exact`, value: /\s/.test(inner) ? `"${inner}"` : inner };
  }
  if (/[*?]/.test(t)) {
    // wildcards run on exact (no-stem) text — auto-route instead of erroring
    return { column_id: `${base}.search.exact`, value: /\s/.test(t) ? `"${t}"` : t };
  }
  return { column_id: `${base}.search`, value: t };
}

// ---- sibling search fields (oxjob #467) -------------------------------------
// For a SEARCH filter (e.g. `title_and_abstract.search has "x"`), the field
// chip's menu lets the user re-point the filter at a DIFFERENT search surface
// without retyping the value — the only field swap that keeps the values meaningful
// (changing a non-search field's property makes its values nonsense, so it's
// disallowed). Per Jason (2026-06-15) the swap is CURATED down to just the three
// primary surfaces — **title / abstract / full text, in that order** — rather than
// every `.search` column in the catalog (which surfaced obscure ones like
// "byline"/"semantic"/"default" nobody recognized). Each is offered only if it
// exists in this entity's catalog, and carries `current:true` when it's the surface
// the filter is already on (so the menu marks it active and you always see the same
// three). Returns [] when the filter isn't on a search column. Pure + stateless
// (unit-tested). The base is always the stemmed `.search` column — exactness is a
// per-value surface-form concern, never a field choice, so the `.exact` twins never
// appear here.
// Jason (2026-06-19) re-curated the middle surface from abstract-only to the broader
// title/abstract scope, so the three offered scopes step up in breadth: title →
// title/abstract → full text.
const SEARCH_SWAP_FIELDS = [
  { column_id: "display_name.search", label: "title" },
  { column_id: "title_and_abstract.search", label: "title/abstract" },
  { column_id: "fulltext.search", label: "full text" },
];
export function searchFieldSiblings(properties, currentColumn) {
  if (!properties || !isSearchColumn(currentColumn)) return [];
  const curBase = searchBaseColumn(currentColumn);
  return SEARCH_SWAP_FIELDS
    .filter((f) => properties[f.column_id])
    .map((f) => ({
      column_id: f.column_id,
      label: properties[f.column_id].display_name || f.label,
      current: searchBaseColumn(f.column_id) === curBase,
    }));
}
