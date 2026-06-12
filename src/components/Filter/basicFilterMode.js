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

// --- Default chip sets (#440 r10) ---------------------------------------------
// Moved here from NoviceFilterChips so the chip-slot budget is shared with the
// SERP mode gate: the basic bar shows a FIXED number of chip slots (the default
// set's size); active filters displace inactive defaults from the right, and
// when the active count outgrows the slots the SERP forces advanced mode.
// Display (NoviceFilterChips) and gate (SerpInputContainer) MUST agree on the
// slot count, same contract as facetTypeToChipType above.

export const defaultChipsByEntity = {
  works: [
    { key: 'publication_year', label: 'Year', chipType: 'year' },
    { key: 'type', label: 'Type', chipType: 'entity', entityToSelect: 'types' },
    { key: 'open_access.is_oa', label: 'Open Access', chipType: 'boolean' },
    { key: 'primary_topic.field.id', label: 'Field', chipType: 'entity', entityToSelect: 'fields' },
    { key: 'authorships.author.id', label: 'Author', chipType: 'entity', entityToSelect: 'authors' },
    { key: 'authorships.institutions.lineage', label: 'Institution', chipType: 'entity', entityToSelect: 'institutions' },
  ],
  authors: [
    { key: 'last_known_institutions.id', label: 'Institution', chipType: 'entity', entityToSelect: 'institutions' },
    { key: 'last_known_institutions.country_code', label: 'Country', chipType: 'entity', entityToSelect: 'countries' },
  ],
  sources: [
    { key: 'type', label: 'Source type', chipType: 'entity', entityToSelect: 'source-types' },
    { key: 'topics.id', label: 'Topic', chipType: 'entity', entityToSelect: 'topics' },
    { key: 'is_oa', label: 'Open Access', chipType: 'boolean' },
    { key: 'host_organization', label: 'Publisher', chipType: 'entity', entityToSelect: 'publishers' },
  ],
  institutions: [
    { key: 'type', label: 'Institution type', chipType: 'entity', entityToSelect: 'institution-types' },
    { key: 'country_code', label: 'Country', chipType: 'entity', entityToSelect: 'countries' },
  ],
  funders: [
    { key: 'country_code', label: 'Country', chipType: 'entity', entityToSelect: 'countries' },
  ],
  topics: [
    { key: 'subfield', label: 'Subfield', chipType: 'entity', entityToSelect: 'subfields' },
    { key: 'field', label: 'Field', chipType: 'entity', entityToSelect: 'fields' },
    { key: 'domain', label: 'Domain', chipType: 'entity', entityToSelect: 'domains' },
    { key: 'works_count', label: 'Works count', chipType: 'range' },
    { key: 'cited_by_count', label: 'Citations count', chipType: 'range' },
  ],
  subfields: [
    { key: 'field', label: 'Field', chipType: 'entity', entityToSelect: 'fields' },
    { key: 'domain', label: 'Domain', chipType: 'entity', entityToSelect: 'domains' },
    { key: 'works_count', label: 'Works count', chipType: 'range' },
    { key: 'cited_by_count', label: 'Citations count', chipType: 'range' },
  ],
  fields: [
    { key: 'domain', label: 'Domain', chipType: 'entity', entityToSelect: 'domains' },
    { key: 'works_count', label: 'Works count', chipType: 'range' },
    { key: 'cited_by_count', label: 'Citations count', chipType: 'range' },
  ],
  domains: [],
  types: [],
  continents: [],
  awards: [
    { key: 'funder.id', label: 'Funder', chipType: 'entity', entityToSelect: 'funders' },
    { key: 'funding_type', label: 'Funding type', chipType: 'entity' },
    { key: 'start_year', label: 'Start year', chipType: 'range' },
  ],
  publishers: [
    { key: 'works_count', label: 'Works count', chipType: 'range' },
    { key: 'cited_by_count', label: 'Citations count', chipType: 'range' },
  ],
  keywords: [
    { key: 'works_count', label: 'Works count', chipType: 'range' },
    { key: 'cited_by_count', label: 'Citations count', chipType: 'range' },
  ],
  countries: [
    { key: 'works_count', label: 'Works count', chipType: 'range' },
    { key: 'cited_by_count', label: 'Citations count', chipType: 'range' },
  ],
  languages: [
    { key: 'works_count', label: 'Works count', chipType: 'range' },
    { key: 'cited_by_count', label: 'Citations count', chipType: 'range' },
  ],
  sdgs: [],
  "source-types": [],
  "institution-types": [],
  licenses: [],
  "oa-statuses": [],
};

export const semanticDefaultChipConfigs = [
  { key: 'publication_year', label: 'Year', chipType: 'year' },
  { key: 'type', label: 'Type', chipType: 'entity', entityToSelect: 'types' },
  { key: 'open_access.is_oa', label: 'Open Access', chipType: 'boolean' },
  { key: 'authorships.author.id', label: 'Author', chipType: 'entity', entityToSelect: 'authors' },
  { key: 'authorships.institutions.lineage', label: 'Institution', chipType: 'entity', entityToSelect: 'institutions' },
];

// The fixed number of chip slots on the basic bar for an entity type.
export function chipSlotCount(entityType, isSemantic = false) {
  if (isSemantic) return semanticDefaultChipConfigs.length;
  return (defaultChipsByEntity[entityType] || []).length;
}
