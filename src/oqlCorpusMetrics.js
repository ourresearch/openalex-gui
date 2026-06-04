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
