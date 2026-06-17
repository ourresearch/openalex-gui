// One source of truth for the OQL semantic-role palette, shared by both OQL
// surfaces so they read as one feature (#357 text editor + #428 no-code builder):
//   keyword     (Find / where / sort by / group by / sample)  slate  — structural, inert
//   conjunction (and / or)                                    yellow — toggleable joins
//   property    (field names, entity, boolean phrases)        violet
//   relation    (is / has / > / is not / similar to)     sky
//   value       (ids, strings, numbers, enum slugs)           teal
// The builder paints bg-filled "bricks"; the editor colors bare text — same hues.
//
// PERCEPTUALLY UNIFORM (iter 18.2): the colours are generated in OKLCH so every
// role carries the same perceptual weight — the old Tailwind -100 steps were NOT
// iso-lightness (bg chroma ran yellow .088 > teal .050 > violet .028 > sky .025).
// Both tiers now share one (lightness, chroma) pair, differing only in hue:
//   backgrounds  oklch(0.94, 0.0306, H)  — C capped by the violet/sky sRGB
//                gamut limit at this lightness (the binding constraint);
//                raised from L=0.925 per Jason ("lighter and airier", 18.3)
//   foregrounds  oklch(0.45, 0.0726, H)  — C capped by the teal gamut limit
// Keyword keeps its hue but only 30% of the tier chroma: it's the structural,
// near-neutral role and shouldn't compete. Hue identity comes from the previous
// palette (bg yellow sits at H≈96 — the amber-500 anchor H≈70 reads tan at low
// chroma; dark-yellow text reads olive, so the conjunction FG keeps the warm
// brown H≈47). Regenerate with the script in the #428 job log (oxjobs) if hues
// ever change. History: amber-100 (iter 11, faint) → pink (iter 17, nope) →
// amber-200 (iter 18, heavy) → OKLCH-uniform (iter 18.2).
export const OQL_ROLES = {
  keyword:     { fg: "#4e5662", bg: "#e7ecf1" },   // slate hue, 30% tier chroma
  conjunction: { fg: "#764831", bg: "#f1ecd5" },   // yellow bg / warm brown fg
  property:    { fg: "#574d7a", bg: "#ece8fe" },   // violet
  relation:    { fg: "#2e5a7a", bg: "#d9effd" },   // sky
  value:       { fg: "#14625c", bg: "#d6f2ec" },   // teal
};

// `[Name]` annotations in the editor: inert decoration, gray (not a role).
export const OQL_ANNOTATION_FG = "#94a3b8"; // slate-400

// The builder's brick CSS vars (consumed by .builder and every row/group/value
// component under it — see OqlQueryBuilder.vue). Bound via :style on the root so
// the stylesheet carries no hex of its own.
//
// NOTE (Jason 2026-06-17): the BUILDER bricks are now all ONE grey — the same
// translucent treatment as the paren blocks — rather than the per-role hues. Every
// role maps to the same pair: a low-alpha BLACK fill so the line hover-highlight
// shines through (matches OqlParenChip's `rgba(0,0,0,0.07)`), and a high-opacity
// black label. The per-role HUES (OQL_ROLES above) are UNCHANGED — they still color
// the #357 TEXT editor (oqlLanguage.js); only the builder's filled bricks went grey.
const BRICK_BG = "rgba(0, 0, 0, 0.07)"; // translucent — background highlight shines through
const BRICK_FG = "rgba(0, 0, 0, 0.8)";  // high-opacity black label
export const OQL_ROLE_CSS_VARS = {
  "--kw-fg": BRICK_FG,
  "--kw-bg": BRICK_BG,
  "--conn-fg": BRICK_FG,
  "--conn-bg": BRICK_BG,
  "--prop-fg": BRICK_FG,
  "--prop-bg": BRICK_BG,
  "--rel-fg": BRICK_FG,
  "--rel-bg": BRICK_BG,
  "--val-fg": BRICK_FG,
  "--val-bg": BRICK_BG,
};
