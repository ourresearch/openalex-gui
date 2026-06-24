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
// COLOR-CODED BUILDER (Jason 2026-06-24, #507): the builder bricks carry three
// brand-primary hues, one per block family — RED / GREEN / BLUE on near-black, the
// most on-brand way to have primaries at all. (Cons noted & accepted: red/green
// colourblindness, and the green=ok/red=error connotation; we're giving it a punt.)
//   conjunction (and / or / & / the → arrow blocks)   GREEN
//   property    (field names, with the folded-in predicate `is`/`has`/`≥`)   RED
//   value       (ids, strings, numbers, dates, enums)  BLUE — "closest to a link",
//               so the VALUE blue is pinned to the exact site link colour
//               (--ox-link = #1f6feb). The other families are generated to MATCH
//               its perceptual weight (see below).
//   keyword     (where / sort by / return)             stays NEUTRAL slate — not one
//               of the three families; it's structural, inert, shouldn't compete.
// The per-role HUES of OQL_ROLES (above) are UNCHANGED — they still color the #357
// TEXT editor (oqlLanguage.js); this object only repaints the no-code builder bricks.
//
// PERCEPTUAL WEIGHT (same OKLCH method as the iter-18.2 generation documented above):
// to keep the three families equal-weight, the resting FOREGROUNDS all sit at ONE
// lightness — L=0.5686, the lightness of the link blue — so no family reads heavier
// than another. Chroma is shared where the sRGB gamut allows (blue & red at the link
// blue's C=0.2023) and falls to the gamut limit only for green (C≈0.164 at that L);
// equal lightness is what carries the equal weight, chroma rides as high as each hue
// can. Backgrounds are one faint tint tier — oklch(0.94, 0.028, H) (blue/red are the
// gamut-binding hues here, green has headroom). SELECTED keeps the family hue but
// darkens the fill (oklch(0.50, ~0.15, H)) with white text — "maintains its colour,
// the colour goes dark, the text goes light" (Jason). Regenerate via the OKLCH script
// in the #507 / #428 job logs if any hue/lightness changes.
//
// resting:                         selected (dark fill, white text):
//   conn  bg #dff1e1 fg #009038      conn  bg #00782e fg #ffffff
//   prop  bg #fee4e2 fg #d42d34      prop  bg #ac3032 fg #ffffff
//   val   bg #e0ecff fg #1f6feb      val   bg #245fbc fg #ffffff   (#1f6feb = link)
// keyword stays neutral slate (bg #e7ecf1 / fg #4e5662) — unchanged, never selected.
const SEL_FG = "#ffffff";
export const OQL_ROLE_CSS_VARS = {
  // keyword — neutral, structural (unchanged slate)
  "--kw-fg": "#4e5662",
  "--kw-bg": "#e7ecf1",
  // conjunction — GREEN
  "--conn-fg": "#009038",
  "--conn-bg": "#dff1e1",
  "--conn-fg-sel": SEL_FG,
  "--conn-bg-sel": "#00782e",
  // property / field — RED
  "--prop-fg": "#d42d34",
  "--prop-bg": "#fee4e2",
  "--prop-fg-sel": SEL_FG,
  "--prop-bg-sel": "#ac3032",
  // relation — unused in the builder (predicate folds into the field); mirror prop.
  "--rel-fg": "#d42d34",
  "--rel-bg": "#fee4e2",
  // value — BLUE (fg pinned to the exact site link colour)
  "--val-fg": "#1f6feb",
  "--val-bg": "#e0ecff",
  "--val-fg-sel": SEL_FG,
  "--val-bg-sel": "#245fbc",
};
