// One source of truth for the OQL semantic-role palette, shared by both OQL
// surfaces so they read as one feature (#357 text editor + #428 no-code builder):
//   keyword     (Find / where / sort by / group by / sample)  slate  — structural, inert
//   conjunction (and / or)                                    amber  — toggleable joins
//   property    (field names, entity, boolean phrases)        violet
//   relation    (is / contains / > / is not / similar to)     sky
//   value       (ids, strings, numbers, enum slugs)           teal
// The builder paints bg-filled "bricks"; the editor colors bare text — same hues.
export const OQL_ROLES = {
  keyword:     { fg: "#475569", bg: "#e2e8f0" },   // slate-600 / slate-200
  // Conjunction colour history: amber-100 (iter 11, too faint for how
  // load-bearing and/or is) → pink (iter 17, "girls bike from 1992") →
  // amber again but a step deeper so it actually shows (iter 18).
  conjunction: { fg: "#92400e", bg: "#fde68a" },   // amber-800 / amber-200
  property:    { fg: "#5b21b6", bg: "#ede9fe" },   // violet-800 / violet-100
  relation:    { fg: "#0369a1", bg: "#e0f2fe" },   // sky-700 / sky-100
  value:       { fg: "#0f766e", bg: "#ccfbf1" },   // teal-700 / teal-100
};

// `[Name]` annotations in the editor: inert decoration, gray (not a role).
export const OQL_ANNOTATION_FG = "#94a3b8"; // slate-400

// The builder's brick CSS vars (consumed by .builder and every row/group/value
// component under it — see OqlQueryBuilder.vue). Bound via :style on the root so
// the stylesheet carries no hex of its own.
export const OQL_ROLE_CSS_VARS = {
  "--kw-fg": OQL_ROLES.keyword.fg,
  "--kw-bg": OQL_ROLES.keyword.bg,
  "--conn-fg": OQL_ROLES.conjunction.fg,
  "--conn-bg": OQL_ROLES.conjunction.bg,
  "--prop-fg": OQL_ROLES.property.fg,
  "--prop-bg": OQL_ROLES.property.bg,
  "--rel-fg": OQL_ROLES.relation.fg,
  "--rel-bg": OQL_ROLES.relation.bg,
  "--val-fg": OQL_ROLES.value.fg,
  "--val-bg": OQL_ROLES.value.bg,
};
