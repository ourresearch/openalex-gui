// Metrics for OQL corpus cases, used by the OQL playground Cases subpage (#345).
// Kept as a standalone module so the complexity definition is transparent and
// unit-testable rather than buried in a component.

// Complexity = number of leaf filters in the OQO boolean tree.
// A leaf is any node carrying a `column_id`; branch nodes (`{join, filters}`)
// just recurse. This is the cheap, defensible metric chosen for #345: the L21
// systematic-review tree -- the natural high-complexity anchor -- scores 114.
// Returns null for cases with no executable OQO (status: error / boundary).
export function oqoLeafCount(oqo) {
  if (!oqo) return null;
  const count = (node) => {
    if (!node) return 0;
    if (Array.isArray(node)) return node.reduce((s, n) => s + count(n), 0);
    if (node.filters) return count(node.filters); // branch
    if (node.filter_rows) return count(node.filter_rows); // OQO root
    if (node.column_id) return 1; // leaf
    return 0;
  };
  return count(oqo.filter_rows);
}

// Taxonomy derived from the case ID prefix. The corpus groups spine cases by
// topic (ENT/BOOL/G/PW) but lumps every #284 worked-example under one opaque
// "#284" group; the ID prefix is the reliable signal that both gives a readable
// category AND splits #284 by its sub-source. Order matters: BOOL before B.
const PREFIX_TAXONOMY = [
  { re: /^ENT/, category: "Entity references", source: "#330 spec spine" },
  { re: /^BOOL/, category: "Boolean logic", source: "#330 spec spine" },
  { re: /^PW/, category: "Proximity & wildcards", source: "#330 spec spine" },
  { re: /^G/, category: "Search semantics", source: "#330 spec spine" },
  { re: /^A/, category: "Filter, sort & sample", source: "#284 worked examples" },
  { re: /^B/, category: "Group by", source: "#284 worked examples" },
  { re: /^L/, category: "Librarian & SR queries", source: "#284 worked examples" },
];

function taxonomyFor(id) {
  return PREFIX_TAXONOMY.find((t) => t.re.test(id || "")) || null;
}

// Human-readable topical category for a case, from its ID prefix.
export function caseCategory(id) {
  return taxonomyFor(id)?.category ?? "Other";
}

// Provenance of a case (which corpus it came from), from its ID prefix.
export function caseSource(id) {
  return taxonomyFor(id)?.source ?? "Other";
}
