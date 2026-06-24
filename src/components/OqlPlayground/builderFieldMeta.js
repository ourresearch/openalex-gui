// Field-picker metadata for the no-code OQL builder's INLINE field-chip menu
// (the SelectionMenu popular-first + search-all + "More" dropdown rendered by
// OqlFieldChip).
//
// oxjob #505 converged the "All fields" DIALOG (BuilderFieldDialog) off the raw
// server `/properties` registry and onto the curated `facetConfigs.js` vocabulary
// (via `facetsByCategory()`), but explicitly LEFT this inline menu on `/properties`
// as a deferred follow-up. That left a footgun: the dropdown's search box searched
// the entire huge `/properties` surface while its own "More" dialog only offered the
// curated subset — so you could find (and pick) fields from the menu that the dialog
// couldn't show. This module now reads the SAME curated source as the dialog, so the
// inline menu and the "More" dialog are in lockstep.
//
// To drive the shared SERP `SelectionMenu` we expose, per entity:
//   - fieldKeys(entity)            : every curated filter-eligible facet key
//   - popularFieldKeys(entity, …)  : the ~8-10 to show before searching
//   - fieldDisplayName(entity,key) : key -> human label (titleCased, dialog-matched)
//   - fieldIcon(entity, key)       : key -> mdi icon (curated facet icon)
//
// The keys are FACET keys (the dialog's vocabulary). A handful are GUI-side aliases
// that differ from the server `/properties` key the leaf-builder needs; the parent
// (OqlQueryBuilder) bridges them via OQL_FIELD_KEY_ALIASES on select — the exact same
// bridge the dialog's select path uses, so the two pickers can never diverge.

import { facetsByCategory } from "@/facetConfigUtils";
import filters from "@/filters";

// The curated facets eligible to be an OQL filter LHS — the SAME set
// BuilderFieldDialog shows: facetsByCategory restricted to the OQL leaf-buildable
// types, `actions: filter`, and minus the soft-retired `is_xpac` (oxjob #498).
// `hideFromPicker` facets are already dropped by facetsByCategory. Cached per entity.
const _curatedCache = {};
function curatedFacets(entity) {
  if (!_curatedCache[entity]) {
    const m = {};
    try {
      for (const cat of facetsByCategory(entity, "", ["selectEntity", "boolean", "range", "search"], [])) {
        for (const fc of cat.filterConfigs) {
          if ((fc.actions || []).includes("filter") && fc.key !== "is_xpac") m[fc.key] = fc;
        }
      }
    } catch { /* entity may have no facet configs */ }
    _curatedCache[entity] = m;
  }
  return _curatedCache[entity];
}

// Dialog-matched label: verbatim when flagged, else titleCased display name.
function labelFor(fc) {
  if (!fc) return "";
  return fc.displayNameVerbatim ? fc.displayName : filters.titleCase(fc.displayName);
}

// Every curated filter-eligible facet key for the entity, sorted by display label.
export function fieldKeys(entity) {
  const facets = curatedFacets(entity);
  return Object.keys(facets).sort((a, b) =>
    labelFor(facets[a]).localeCompare(labelFor(facets[b])));
}

// Popular keys = the entity's curated facets flagged popular-for-filter; topped up
// with the first few curated keys if too few line up.
export function popularFieldKeys(entity, allKeys) {
  const facets = curatedFacets(entity);
  const popular = Object.values(facets)
    .filter((c) => (c.actionsPopular || []).includes("filter"))
    .map((c) => c.key);
  if (popular.length < 4) {
    for (const k of allKeys) {
      if (popular.length >= 8) break;
      if (!popular.includes(k)) popular.push(k);
    }
  }
  return popular.slice(0, 10);
}

export function fieldDisplayName(entity, key) {
  return labelFor(curatedFacets(entity)[key]) || key;
}

export function fieldIcon(entity, key) {
  return curatedFacets(entity)[key]?.icon || "mdi-tag-outline";
}
