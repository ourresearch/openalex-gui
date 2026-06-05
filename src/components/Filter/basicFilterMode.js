import { getFacetConfig } from '@/facetConfigUtils';

// Map a facet config to the basic-view chip type it renders as, or null when the
// field has no chip in the basic view. Single source of truth shared by
// NoviceFilterChips (which chips to build) and ExpertSerp (whether basic mode can
// represent the current query) — they MUST agree or the "force advanced" rule
// below would offer basic for a query the chips can't actually show.
export function facetTypeToChipType(facetConfig) {
  if (!facetConfig) return null;
  if (facetConfig.type === 'selectEntity') return 'entity';
  if (facetConfig.type === 'boolean') return 'boolean';
  if (facetConfig.type === 'range' && facetConfig.key === 'publication_year') return 'year';
  if (facetConfig.type === 'range') return 'range';
  return null;
}

// Whether the basic (chip) view can FAITHFULLY represent every clause in the
// current query — i.e. switching to basic would neither drop nor alter anything.
// When false, the SERP forces advanced mode and disables the Basic toggle
// (#353 round 4). A chip is one field showing a single value / pipe-OR list /
// range / boolean, so a query qualifies only when ALL of:
//   - every clause maps to a chip (known field + chip-able type),
//   - no field appears in more than one clause — basic would otherwise collapse
//     repeats into one OR chip, silently turning AND into OR (the #353 B9 trap),
//   - no clause is negated unless it's a boolean (only the boolean chip shows a
//     NOT state; entity/year/range chips would render a negation as positive).
// `filters` are filter objects from filtersFromUrlStr (have .key + .isNegated).
export function basicCanRepresent(entityType, filters) {
  const seenKeys = new Set();
  for (const f of filters || []) {
    const chipType = facetTypeToChipType(getFacetConfig(entityType, f.key));
    if (!chipType) return false;                          // no chip for this field
    if (f.isNegated && chipType !== 'boolean') return false; // un-showable negation
    if (seenKeys.has(f.key)) return false;               // duplicate field (AND→OR)
    seenKeys.add(f.key);
  }
  return true;
}
