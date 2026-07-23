import {sortByKey} from "./util";
import {facetConfigs, facetCategories, facetCategoriesIcons} from "./facetConfigs";


/**
 * Get a specific facet configuration by entity type and key.
 * 
 * @param {string} entityType - The entity type (e.g., "works", "authors")
 * @param {string} key - The facet key to look up
 * @returns {Object|null} The facet configuration or null if not found
 */
const getFacetConfig = function (entityType, key) {
    if (!key || !entityType) return

    // Special case: relevance_score is a sort-only option that's dynamically available
    // when a search filter is applied. It's not a real facet in the configs array.
    // The UI components (SerpResultsSortButton, url.js) conditionally enable this
    // based on whether isSearchFilterApplied() returns true.
    if (key === "relevance_score") {
        return {
            key: "relevance_score",
            displayName: "Relevance score",
            icon: "mdi-magnify",
            type: "search",
        }
    }

    // Virtual "collection" facet — every v1 entity type supports a collection: filter,
    // resolved server-side in elastic-api against users-api. The chip itself
    // is render-only; new collections are created via the SERP collections dropdown
    // and /settings/collections, not through a chip picker. NoviceFilterChip
    // detects this key and (1) resolves the value via /collections/<id>, (2)
    // short-circuits the picker menu.
    if (key === "collection") {
        return {
            key: "collection",
            // Membership-predicate label; the API key stays `collection:`. Kept in
            // sync with the injected facet in facetConfigs.js (#356). titleCase() in
            // the chip renders this "In Collection".
            displayName: "In collection",
            icon: "mdi-folder-outline",
            type: "selectEntity",
            entityToFilter: entityType,
            entityToSelect: "collections",
        }
    }

    // Facets are keyed on the CANONICAL server key (#455); fold the legacy alias
    // spellings (still valid on input — old URLs, saved searches) to the canonical.
    // Exact-match, not substring: "institutions.is_global_south" is a substring of
    // authors' distinct "last_known_institutions.is_global_south" key.
    if (key === "primary_location.source.publisher_lineage") {
        key = "primary_location.source.host_organization_lineage"
    } else if (key === "institutions.is_global_south") {
        key = "authorships.institutions.is_global_south"
    }

    const myFacetConfig = facetConfigs().find(f => f.key === key && f.entityToFilter === entityType)
    if (!myFacetConfig) {
        const msg = `openAlex error: getFacetConfig(): no facet found for '${entityType}' filter "${key}"`
        console.log(msg)
        return null
    }
    return myFacetConfig
}


/**
 * Find facet configurations matching a search string.
 * 
 * @param {string} entityType - The entity type to filter by
 * @param {string} searchString - The search string to match against display names
 * @returns {Array} Sorted array of matching facet configurations
 */
const findFacetConfigs = function (entityType, searchString) {
    const ret = facetConfigs(entityType)
        .filter(c => {
            return c.entityToFilter === entityType
        })
        .filter(c => {
            return c.displayName.toLowerCase().match(searchString?.toLowerCase())
        })

    const sorted = sortByKey(ret, "displayName")
    return sorted
}


/**
 * Get facets organized by category for a given entity type.
 * 
 * @param {string} entityType - The entity type
 * @param {string} searchString - Optional search string to filter facets
 * @param {Array} includeOnlyTypes - Optional array of facet types to include
 * @param {Array} excludeFiltersByKey - Optional array of facet keys to exclude
 * @returns {Array} Array of category objects with their facet configurations
 */
const facetsByCategory = function (
    entityType,
    searchString = "",
    includeOnlyTypes = [],
    excludeFiltersByKey = [],
    { semanticSearchOnly = false } = {},
) {
    const filtered = facetConfigs(entityType)
        .filter(c => {
            return !searchString || c.displayName.toLowerCase().match(searchString?.toLowerCase())
        })
        .filter(c => {
            return !includeOnlyTypes.length || includeOnlyTypes.includes(c.type)
        })
        .filter(c => {
            return !excludeFiltersByKey.length || !excludeFiltersByKey.includes(c.key)
        })
        .filter(c => {
            return !semanticSearchOnly || c.semanticSearchAllowed
        })
        // hideFromPicker facets stay resolvable via getFacetConfig (for chip/URL
        // rendering of legacy keys like title.search) but never appear in any of the
        // unified categorized pickers — they're redundant duplicates. (oxjob #505)
        .filter(c => !c.hideFromPicker)

    if (!facetCategories[entityType]) return []

    return facetCategories[entityType].map(categoryName => {
        const myFacets = filtered.filter(f => {
            return f.category === categoryName
        })

        return {
            displayName: categoryName,
            icon: facetCategoriesIcons[categoryName],
            filterConfigs: myFacets,
        }
    })
        .filter(categoryObj => {
            return categoryObj.filterConfigs.length > 0
        })
}


export {
    getFacetConfig,
    findFacetConfigs,
    facetsByCategory,
}
