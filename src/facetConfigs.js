const facetCategories = {
    works: [
        "popular",
        "institution",
        "location",
        "source",
        "access",
        "indexed by",
        "citation",
        "other",
    ],
    authors: [
        "popular",
        "institution",
        "location",
        "indexed by",
        "other",
    ],
    sources: [
        "popular",
        "access",
        "other",
    ],
    publishers: [
        "popular",
        "other",
    ],
    institutions: [
        "popular",
        "location",
        "other",
    ],
    concepts: [
        "popular",
        "other"
    ],
}



const facetConfigs = function (entityType) {
    const ret = [


        // works:  WASPFIC

        {
            key: "ids.openalex",
            entityType: "works",
            displayName: "Work",
            isEntity: true,
            noOptions: true,
            valuesToShow: "select",
            category: "other",
            icon: "mdi-file-document-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([wW]\d+)$/,
        },
        {
            key: "concepts.id",
            entityType: "works",
            displayName: "Concept",
            isEntity: true,
            showInSidebar: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            valuesToShow: "mostCommon",
            category: "other",
            isCore: true,
            icon: "mdi-lightbulb-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([cC]\d+)$/,
        },
        {
            key: "locations.source.id",
            entityType: "works",
            displayName: "Source",
            isEntity: true,
            showInSidebar: true,
            entityId: "sources",
            autocompleteEndpoint: "autocomplete/sources",
            valuesToShow: "mostCommon",
            category: "source",
            isCore: true,
            icon: "mdi-book-open-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([sS]\d+)$/,
        },
        {
            key: "locations.source.host_organization",
            entityType: "works",
            displayName: "Publisher",
            isEntity: true,
            showInSidebar: true,
            entityId: "publishers",
            autocompleteEndpoint: "autocomplete/publishers",
            valuesToShow: "mostCommon",
            category: "source",
            isCore: true,
            icon: "mdi-domain",
            regex: /^(?:https:\/\/openalex\.org\/)?([pP]\d+)$/,
        },
        {
            key: "authorships.institutions.id",
            entityType: "works",
            displayName: "Institution",
            isEntity: true,
            showInSidebar: true,
            entityId: "institutions",
            autocompleteEndpoint: "autocomplete/institutions",
            valuesToShow: "mostCommon",
            category: "institution",
            isCore: true,
            icon: "mdi-town-hall",
            regex: /^(?:https:\/\/openalex\.org\/)?([iI]\d+)$/,
        },
        {
            key: "authorships.author.id",
            entityType: "works",
            displayName: "Author",
            isEntity: true,
            showInSidebar: true,
            entityId: "authors",
            autocompleteEndpoint: "autocomplete/authors",
            valuesToShow: "mostCommon",
            category: "popular",
            isCore: true,
            icon: "mdi-account-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([aA]\d+)$/,
        },




        // works: open access
        {
            key: "open_access.is_oa",
            entityType: "works",
            displayName: "Access",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Toll-access", "Open Access"],
            category: "access",
            isCore: true,
            icon: "mdi-lock-open-outline",
        },
        {
            key: "best_oa_location.license",
            entityType: "works",
            displayName: "License",
            valuesToShow: "mostCommon",
            category: "access",
            icon: "mdi-lock-open-outline",
        },
        {
            key: "open_access.oa_status",
            entityType: "works",
            displayName: "Color",
            valuesToShow: "mostCommon",
            category: "access",
            icon: "mdi-lock-open-outline",
        },
        {
            key: "best_oa_location.version",
            entityType: "works",
            displayName: "Version",
            valuesToShow: "mostCommon",
            category: "access",
            icon: "mdi-lock-open-outline",
        },
        // {
        //     key: "has_abstract",
        //     entityType: "works",
        //     displayName: "Has abstract",
        //     valuesToShow: "mostCommon",
        // },


        // works: institutions:
        {
            key: "authorships.institutions.country_code",
            entityType: "works",
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            isCountry: true,
            category: "location",
            isCore: true,
            icon: "mdi-map-marker-outline",
            // icon: "mdi-town-hall",
        },
        {
            key: "authorships.institutions.continent",
            entityType: "works",
            displayName: "Continent",
            valuesToShow: "mostCommon",
            category: "location",
            isCore: true,
            icon: "mdi-map-marker-outline",
            // icon: "mdi-town-hall",
        },
        {
            key: "authorships.institutions.is_global_south",
            entityType: "works",
            displayName: "Global South",
            category: "location",
            isBoolean: true,
            booleanValues: ["Global North", "Global South"],
            icon: "mdi-map-marker-outline",
            // icon: "mdi-town-hall",
        },
        {
            key: "authorships.institutions.type",
            entityType: "works",
            displayName: "Institution type",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            category: "institution",
            icon: "mdi-town-hall",
        },


        {
            key: "type",
            entityType: "works",
            displayName: "Type",
            valuesToShow: "mostCommon",
            category: "popular",
            icon: "mdi-file-document-outline",
        },
        {
            key: "publication_year",
            entityType: "works",
            displayName: "Year published",
            valuesToShow: "range",
            sortByValue: true,
            isRange: true,
            category: "popular",
            isCore: true,
            sortToTop: true,
            icon: "mdi-calendar-text"
        },
        {
            key: "has_doi",
            entityType: "works",
            displayName: "Crossref",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Not in Crossref", "In Crossref"],
            category: "indexed by",
            icon: "mdi-database-outline",
        },
        {
            key: "has_pmid",
            entityType: "works",
            displayName: "PubMed",
            valuesToShow: "boolean",
            isBoolean: true,
            category: "indexed by",
            icon: "mdi-database-outline",
            booleanValues: ["Not in PubMed", "In PubMed"],
        },
        {
            key: "has_pmcid",
            entityType: "works",
            displayName: "PubMed Central",
            valuesToShow: "boolean",
            isBoolean: true,
            category: "indexed by",
            icon: "mdi-database-outline",
            booleanValues: ["Not in PubMed Central", "In PubMed Central"],
        },
        {
            key: "is_retracted",
            entityType: "works",
            displayName: "Retracted",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Isn't retracted", "Is retracted"],
            category: "other",
            icon: "mdi-file-document-outline"
        },

        // works: links to other works
        // {
        //     key: "cited_by_count",
        //     entityType: "works",
        //     displayName: "Citation count",
        //     valuesToShow: "mostCommon",
        //     sortByValue: true,
        //     isRange: true,
        //     category: "citation",
        //     isCore: true,
        // },
        {
            key: "cited_by",
            entityType: "works",
            displayName: "Cited by",
            isEntity: true,
            showInSidebar: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            valuesToShow: "select",
            category: "citation",
            icon: "mdi-format-quote-close",
        },
        {
            key: "cites",
            entityType: "works",
            displayName: "Cites",
            isEntity: true,
            showInSidebar: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            valuesToShow: "select",
            category: "citation",
            icon: "mdi-format-quote-close",
        },
        {
            key: "related_to",
            entityType: "works",
            displayName: "Related to",
            isEntity: true,
            showInSidebar: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            valuesToShow: "select",
            category: "other",
            isHidden: true,
            icon: "mdi-file-document-multiple-outline",
        },


        // authors
        {
            key: "last_known_institution.id",
            entityType: "authors",
            displayName: "Institution",
            isEntity: true,
            entityId: "institutions",
            autocompleteEndpoint: "autocomplete/institutions",
            valuesToShow: "mostCommon",
            category: "institution",
            icon: "mdi-town-hall",
        },
        {
            key: "last_known_institution.country_code",
            entityType: "authors",
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            isCountry: true,
            category: "location",
            icon: "mdi-map-marker-outline",
        },
        {
            key: "last_known_institution.type",
            entityType: "authors",
            displayName: "Institution type",
            autocompleteEndpoint: "autocomplete/institutions/type",
            valuesToShow: "mostCommon",
            category: "institution",
            icon: "mdi-town-hall",
        },
        {
            key: "has_orcid",
            entityType: "authors",
            displayName: "ORCID",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Not in ORCID", "In ORCID"],
            category: "indexed by",
            icon: "mdi-database-outline",
        },
        {
            key: "x_concepts.id",
            entityType: "authors",
            displayName: "Concepts",
            isEntity: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            valuesToShow: "mostCommon",
            category: "other",
            icon: "mdi-lightbulb-outline",
        },


        // sources
        {
            key: "publisher",
            entityType: "sources",
            displayName: "Publisher",
            autocompleteEndpoint: "autocomplete/sources/publisher",
            valuesToShow: "mostCommon",
            category: "popular",
            icon: "mdi-book-open-outline",
        },
        {
            key: "type",
            entityType: "sources",
            displayName: "Source type",
            valuesToShow: "mostCommon",
            category: "popular",
            icon: "mdi-book-open-outline",
        },
        {
            key: "is_oa",
            entityType: "sources",
            displayName: "Open Access",
            valuesToShow: "mostCommon",
            category: "access",
            icon: "mdi-lock-open-outline",
        },
        {
            key: "is_in_doaj",
            entityType: "sources",
            displayName: "In DOAJ",
            valuesToShow: "mostCommon",
            category: "access",
            icon: "mdi-lock-open-outline",
        },
        {
            key: "x_concepts.id",
            entityType: "sources",
            displayName: "Concepts",
            isEntity: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            valuesToShow: "mostCommon",
            category: "other",
            icon: "mdi-lightbulb-outline",
        },


        // institutions
        {
            key: "country_code",
            entityType: "institutions",
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            isCountry: true,
            category: "location",
            icon: "mdi-map-marker-outline"
        },
        {
            key: "type",
            entityType: "institutions",
            displayName: "Institution type",
            autocompleteEndpoint: "autocomplete/institutions/type",
            valuesToShow: "mostCommon",
            category: "popular",
            icon: "mdi-town-hall"
        },
        {
            key: "x_concepts.id",
            entityType: "institutions",
            displayName: "Concepts",
            isEntity: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            valuesToShow: "mostCommon",
            category: "other",
            icon: "mdi-lightbulb-outline",
        },


        // concepts
        {
            key: "level",
            entityType: "concepts",
            displayName: "Level",
            maxPotentialFiltersToShow: 10,
            valuesToShow: "mostCommon",
            category: "popular",
            icon: "mdi-lightbulb-outline"
        },
    ]


    return ret
        // .filter(f => onlyReturnTheseFacets.includes(f.key))
        .map(config => {
            return {
                ...config,
                // values: [],
            }
        })
        .filter(config => {
            return !entityType || config.entityType === entityType
        })
}

const getFacetConfigFromPid = function (pid) {
    const trimmedPid = pid.trim()
    const x = facetConfigs().find(f => {

    })
    return x


}


const getFacetConfig = function (entityType, key) {
    const myFacetConfig = facetConfigs().find(f => f.key === key && f.entityType === entityType)
    if (!myFacetConfig) throw(`openAlex error: getFacetConfig: no facet found for ${entityType} filter "${key}"`)
    return myFacetConfig
}

const makeFacet = function (key, isNegated, values) {
    return {
        key,
        isNegated,
        values,
        config: facetConfigs()[key]

    }

}


export {
    makeFacet,
    facetConfigs,
    getFacetConfig,
    facetCategories,
}