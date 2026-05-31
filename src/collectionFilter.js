// Cross-type collection filtering (oxjob #273, API #266).
//
// A user collection (`col_<base58>`) can be used as the VALUE of any entity-ID
// filter field whose selected entity type matches the collection's
// `entity_type` — e.g. a sources-collection on `primary_location.source.id`.
// This module holds the *pure* logic for deciding which collections a given
// field can offer, so it can be unit-tested without the Vuex store or network
// and shared by both filter surfaces (advanced rows + novice chips).

import { getFacetConfig } from "@/facetConfigUtils";

/**
 * Which entity type does a filter field select values of?
 *
 * For the dedicated `collection` field the match type is the SERP entity type
 * (a works SERP's `collection:` filter offers works-collections). For any other
 * `selectEntity` field it is the field's `entityToSelect`
 * (e.g. `primary_location.source.id` -> "sources"). Returns null when the field
 * has no selectable entity type (e.g. string-only filters).
 *
 * @param {string} entityType - the SERP entity type (works/authors/…)
 * @param {string} filterKey
 * @returns {string|null}
 */
export function collectionMatchType(entityType, filterKey) {
    if (filterKey === "collection") return entityType;
    return getFacetConfig(entityType, filterKey)?.entityToSelect ?? null;
}

/**
 * Pure: given the user's collections and the entity type a field selects,
 * return the collections usable as a value of that field — type-matched,
 * optionally filtered by a search term (name or description), sorted
 * alphabetically, in suggestion shape.
 *
 * Structural type-matching (`entity_type === selectType`) is what makes the
 * API's cross-type 400 unreachable from the GUI: a field can only ever offer
 * collections of its own type.
 *
 * @param {Array<Object>} collections - raw collection objects from the store
 * @param {string|null} selectType - the field's match type (see collectionMatchType)
 * @param {string} [searchString]
 * @returns {Array<{value:string, displayValue:string, entityCount:number, isCollection:true}>}
 */
export function filterCollectionsForField(collections, selectType, searchString) {
    if (!selectType) return [];
    const term = (searchString || "").trim().toLowerCase();
    return (collections || [])
        .filter(c => c && c.entity_type === selectType)
        .filter(c => {
            if (!term) return true;
            const name = (c.display_name || "").toLowerCase();
            const desc = (c.description || "").toLowerCase();
            return name.includes(term) || desc.includes(term);
        })
        .sort((a, b) =>
            (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" })
        )
        .map(c => ({
            value: c.id,
            displayValue: c.display_name,
            entityCount: c.entity_count,
            isCollection: true,
        }));
}
