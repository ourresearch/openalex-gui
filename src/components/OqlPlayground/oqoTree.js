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
// Operators are strictly AFFIRMATIVE (iter 20 / decision 22): `is`, `contains`,
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
  if (cls.has("search")) add("contains", "contains");
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
// (`contains (amphibian or "amphibi*")`). A bare wildcard auto-routes to exact —
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

// typed surface text -> { column_id, value } on a search base column
export function searchSurfaceToFilter(text, anyCol) {
  const base = searchBaseColumn(anyCol);
  const t = String(text).trim();
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
// For a SEARCH filter (e.g. `title_and_abstract.search contains "x"`), the field
// chip's menu lets the user re-point the filter at a DIFFERENT search surface
// (title vs full text vs abstract …) without retyping the value — the only field
// swap that keeps the values meaningful (changing a non-search field's property
// makes its values nonsense, so it's disallowed). This derives the candidate
// fields from the per-entity /properties catalog: every BASE `.search` column
// (a `type:"search"` property whose name ends in `.search`, never the `.exact`
// twin — exactness is a per-value surface-form concern, not a field choice),
// minus the one we're already on. Pure + stateless so it's unit-testable and the
// field chip needn't know the catalog's shape beyond this call.
export function searchFieldSiblings(properties, currentColumn) {
  if (!properties || !isSearchColumn(currentColumn)) return [];
  const base = searchBaseColumn(currentColumn);
  return Object.entries(properties)
    .filter(([k, p]) => p && p.type === "search" && /\.search$/.test(k))
    .filter(([k]) => searchBaseColumn(k) !== base)
    .map(([k, p]) => ({ column_id: k, label: p.display_name || k }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
