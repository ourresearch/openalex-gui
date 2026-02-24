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

    // WORKAROUND: Server-side bug - the grouping API uses "publisher_lineage" but
    // the API response object uses "host_organization_lineage". This replacement
    // ensures we find the correct config. This is a known issue that should be
    // fixed on the server side but is out of scope for the frontend.
    key = key.replace("primary_location.source.host_organization_lineage", "primary_location.source.publisher_lineage")

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
