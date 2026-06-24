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
// COLOR-CODED BUILDER (Jason 2026-06-24, #507): the builder bricks carry one hue per
// block family. The three hues are the ColorBrewer **Dark2** qualitative triple — chosen
// (not winged) because it has the best categorical separation of the qualitative palettes
// we checked: ~119° apart in OKLCH hue (Set1 103°, Set2 95°, Tableau10 82°, Okabe-Ito 79°),
// i.e. essentially the ideal 120° even spacing for three colours. Mapped warm→cool to keep
// the prior intuition (fields were warm, values cool):
//   conjunction (and / or / & / the → arrow blocks)   TEAL   (Dark2 #1b9e77, H≈167)
//   property    (field names, with the folded-in predicate `is`/`has`/`≥`)   ORANGE (H≈47)
//   value       (ids, strings, numbers, dates, enums)  PURPLE (Dark2 #7570b3, H≈286)
//   keyword     (where / sort by / return)             stays NEUTRAL slate — not one of the
//               three families; it's structural, inert, shouldn't compete.
// The per-role HUES of OQL_ROLES (above) are UNCHANGED — they still color the #357 TEXT
// editor (oqlLanguage.js); this object only repaints the no-code builder bricks.
//
// PERCEPTUAL WEIGHT (same OKLCH method as the iter-18.2 generation documented above):
// the three families are EQUAL-WEIGHT because each tier sits at ONE lightness — visual
// weight tracks lightness, so equal L = equal weight regardless of hue. Chroma rides each
// hue's sRGB gamut up to a shared cap (teal is the gamut-binding hue, as greens always are).
//   foregrounds  oklch(0.5686, min(0.16, gamut), H)   — text
//   backgrounds  oklch(0.94,   ~0.028, H)             — faint resting tint
//   hover        oklch(0.895,  ~0.050, H)             — a DARKER tint of the SAME hue (NOT a
//                grey wash): fixes the bug where hover desaturated toward grey.
//   selected     oklch(0.50,   min(0.16, gamut), H)   + white text — "keeps its colour, the
//                colour goes dark, the text goes light" (Jason).
// (Strict iso-CHROMA was tried and rejected: teal's gamut pins it so low that orange reads
//  brown. Equal lightness is what Jason meant by "perceptual uniformity".) Regenerate via
// /tmp/oklch2.mjs (or the OKLCH script in the #507 job log) if any hue/lightness changes.
//
// resting bg/fg        hover bg     selected bg/fg
//   conn  #daf2e7 #008c68  #bee8d5    #007557 #fff   (teal)
//   prop  #fce6dc #be5200  #fad3c1    #a04400 #fff   (orange)
//   val   #e9e9fe #7264cf  #d9d8fd    #5f4fb8 #fff   (purple)
// keyword stays neutral slate (bg #e7ecf1 / fg #4e5662) — unchanged, never selected.
const SEL_FG = "#ffffff";
export const OQL_ROLE_CSS_VARS = {
  // keyword — neutral, structural (unchanged slate)
  "--kw-fg": "#4e5662",
  "--kw-bg": "#e7ecf1",
  // conjunction — TEAL
  "--conn-fg": "#008c68",
  "--conn-bg": "#daf2e7",
  "--conn-bg-hov": "#bee8d5",
  "--conn-fg-sel": SEL_FG,
  "--conn-bg-sel": "#007557",
  // property / field — ORANGE
  "--prop-fg": "#be5200",
  "--prop-bg": "#fce6dc",
  "--prop-bg-hov": "#fad3c1",
  "--prop-fg-sel": SEL_FG,
  "--prop-bg-sel": "#a04400",
  // relation — unused in the builder (predicate folds into the field); mirror prop.
  "--rel-fg": "#be5200",
  "--rel-bg": "#fce6dc",
  // value — PURPLE
  "--val-fg": "#7264cf",
  "--val-bg": "#e9e9fe",
  "--val-bg-hov": "#d9d8fd",
  "--val-fg-sel": SEL_FG,
  "--val-bg-sel": "#5f4fb8",
};
