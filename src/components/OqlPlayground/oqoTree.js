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
//   near "phrase" -> stemmed, adjacent  (.search)
// The builder lets the user type those surface forms directly into a value box;
// each VALUE routes to its own column, so one row can mix exact + stemmed values
// (`has (amphibian or "amphibi*")`). A bare wildcard auto-routes to exact —
// stemming destroys the literal prefix, so `near`/stemmed + wildcard is invalid
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

// Friendly PROXIMITY surfaces (oxjob #514) — the inverse of the backend
// `_render_term` (query_translation/oql_lang.py): the no-code builder lets a user type
// the readable `within N words` form and we encode it to the canonical `"phrase"~N`
// value the engine already executes (#355). Quotes are required (the engine's proximity
// is exact/phrase-scoped); `word`/`words` both accepted; N is a bare integer.
//   binary   `"A" within N words of "B"`     -> .search.exact  `"A"~N~"B"` (exact-only, WoS NEAR/N)
//   stemmed  `near "phrase" within N words`  -> .search        `"phrase"~N`
//   exact    `"phrase" within N words`       -> .search.exact  `"phrase"~N`
const PROX_BINARY_RE = /^"([^"]*)"\s+within\s+(\d+)\s+words?\s+of\s+"([^"]*)"$/i;
const PROX_STEMMED_RE = /^near\s+"([^"]*)"\s+within\s+(\d+)\s+words?$/i;
const PROX_EXACT_RE = /^"([^"]*)"\s+within\s+(\d+)\s+words?$/i;

// typed surface text -> { column_id, value } on a search base column
export function searchSurfaceToFilter(text, anyCol) {
  const base = searchBaseColumn(anyCol);
  const t = String(text).trim();
  // Proximity surfaces first — they wrap quoted phrases the plain quoted/near branches
  // below would otherwise mis-route (a `within N words` suffix isn't a closing quote).
  const binp = t.match(PROX_BINARY_RE);
  if (binp) {
    return { column_id: `${base}.search.exact`, value: `"${binp[1]}"~${binp[2]}~"${binp[3]}"` };
  }
  const stemProx = t.match(PROX_STEMMED_RE);
  if (stemProx) {
    return { column_id: `${base}.search`, value: `"${stemProx[1]}"~${stemProx[2]}` };
  }
  const exactProx = t.match(PROX_EXACT_RE);
  if (exactProx) {
    return { column_id: `${base}.search.exact`, value: `"${exactProx[1]}"~${exactProx[2]}` };
  }
  const near = t.match(/^near\s+(.+)$/i);
  if (near && near[1].startsWith('"')) {
    return { column_id: `${base}.search`, value: near[1] }; // stemmed adjacent phrase
  }
  if (/^".*"~\d+(~".*")?$/.test(t)) {
    return { column_id: `${base}.search.exact`, value: t }; // proximity passthrough
  }
  const quoted = t.match(/^"(.*)"$/s);
  if (quoted) {
    const inner = quoted[1];
    // exact: the column suffix carries exactness; single token stays bare,
    // a multi-word phrase keeps its quotes (mirrors the parser's encoding)
    return { column_id: `${base}.search.exact`, value: /\s/.test(inner) ? t : inner };
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
