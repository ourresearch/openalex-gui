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
// COLOR-CODED BUILDER (Jason 2026-06-24, #507): the builder bricks carry one hue per block
// family, drawn from the ColorBrewer **Pastel2** qualitative palette (Jason picked it from a
// 4-way bake-off of already-light palettes). The earlier attempts LIGHTENED a dark palette
// (Dark2) into tints, which still read as red/green/blue; the fix is to use a palette that is
// LIGHT in its primary state — the resting fill IS the native pastel, and the brick only goes
// dark on SELECTION. Mapping (Pastel2 order):
//   conjunction (and / or / & / the → arrow blocks)   MINT       (Pastel2 #b3e2cd, H≈166)
//   property    (field names, with the folded-in predicate `is`/`has`/`≥`)   PEACH (#fdcdac, H≈56)
//   value       (ids, strings, numbers, dates, enums)  PERIWINKLE (Pastel2 #cbd5e8, H≈263)
//   keyword     (where / sort by / return)             stays NEUTRAL slate — not one of the
//               three families; it's structural, inert, shouldn't compete.
// The per-role HUES of OQL_ROLES (above) are UNCHANGED — they still color the #357 TEXT editor
// (oqlLanguage.js); this object only repaints the no-code builder bricks.
//
// Each family is one native Pastel2 fill (the resting brick) plus three OKLCH-derived shades
// at the SAME hue: a darker tint for hover, a dark fill + white text for selection, and a dark
// shade for the resting label.
//   resting bg   the native Pastel2 hex (light, the primary state)
//   resting fg   oklch(0.42, gamut-capped, H)  — readable dark label on the pastel
//   hover bg     native − 0.06 L (same hue, slightly darker — NOT a grey wash; fixes the
//                hover-desaturates-to-grey bug)
//   selected     oklch(0.50, ~0.15, H) fill + white text — "keeps its colour, goes dark, text
//                goes light" (Jason).
// Regenerate via /tmp/oklch3.mjs (genNative) if the source hexes change.
//
// resting bg/fg        hover bg     selected bg/fg
//   conn  #b3e2cd #005c42  #a0ceba    #007555 #fff   (mint)
//   prop  #fdcdac #763b00  #e9ba99    #964d00 #fff   (peach)
//   val   #cbd5e8 #1b44a3  #b8c2d4    #345db7 #fff   (periwinkle)
// keyword stays neutral slate (bg #e7ecf1 / fg #4e5662) — unchanged, never selected.
const SEL_FG = "#ffffff";
export const OQL_ROLE_CSS_VARS = {
  // keyword — neutral, structural (unchanged slate)
  "--kw-fg": "#4e5662",
  "--kw-bg": "#e7ecf1",
  // conjunction — MINT
  "--conn-fg": "#005c42",
  "--conn-bg": "#b3e2cd",
  "--conn-bg-hov": "#a0ceba",
  "--conn-fg-sel": SEL_FG,
  "--conn-bg-sel": "#007555",
  // property / field — PEACH
  "--prop-fg": "#763b00",
  "--prop-bg": "#fdcdac",
  "--prop-bg-hov": "#e9ba99",
  "--prop-fg-sel": SEL_FG,
  "--prop-bg-sel": "#964d00",
  // relation — unused in the builder (predicate folds into the field); mirror prop.
  "--rel-fg": "#763b00",
  "--rel-bg": "#fdcdac",
  // value — PERIWINKLE
  "--val-fg": "#1b44a3",
  "--val-bg": "#cbd5e8",
  "--val-bg-hov": "#b8c2d4",
  "--val-fg-sel": SEL_FG,
  "--val-bg-sel": "#345db7",
};
