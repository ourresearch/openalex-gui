const allEntityTypes = function (hideThese) {
    const types = ["works", "authors", "institutions", "venues", "concepts"]
    if (hideThese) {
        if (!Array.isArray(hideThese)) hideThese = [hideThese]
        return types.filter(e => {
            return hideThese.indexOf(e) > -1
        })
    } else {
        return types
    }
}

const makeFacetQueryFilters = function (facetFilters) {

}

const facetCategories = {
    works: [
        "general",
        "institution",
        "host",
        "access",
        "ids",
        "citation",
    ]
}

const facetConfigs = function () {
    const ret = [
        // shared
        {
            key: "x_concepts.id",
            entityTypes: ["authors", "institutions", "venues"],
            displayName: "Core concepts",
            isEntity: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            valuesToShow: "mostCommon",
            category: "general"
        },


        // works:  wavic
        {
            key: "concepts.id",
            entityTypes: ["works"],
            displayName: "Concept",
            isEntity: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            valuesToShow: "mostCommon",
            category: "general",
            isCore: true,
        },
        {
            key: "host_venue.id",
            entityTypes: ["works"],
            displayName: "Host",
            isEntity: true,
            entityId: "venues",
            autocompleteEndpoint: "autocomplete/venues",
            valuesToShow: "mostCommon",
            category: "host",
            isCore: true,
        },
        {
            key: "authorships.institutions.id",
            entityTypes: ["works"],
            displayName: "Institution",
            isEntity: true,
            entityId: "institutions",
            autocompleteEndpoint: "autocomplete/institutions",
            valuesToShow: "mostCommon",
            category: "institution",
            isCore: true,
        },
        {
            key: "authorships.author.id",
            entityTypes: ["works"],
            displayName: "Author",
            isEntity: true,
            entityId: "authors",
            autocompleteEndpoint: "autocomplete/authors",
            valuesToShow: "mostCommon",
            category: "general",
            isCore: true,
        },


        // works: host venue
        {
            key: "host_venue.publisher",
            entityTypes: ["works"],
            displayName: "Host publisher",
            autocompleteEndpoint: "autocomplete/venues/publisher",
            valuesToShow: "mostCommon",
            category: "host",
        },
        {
            key: "host_venue.type",
            entityTypes: ["works"],
            displayName: "Host type",
            autocompleteEndpoint: "autocomplete/venues/publisher",
            valuesToShow: "mostCommon",
            category: "host",
        },


        // works: open access
        {
            key: "open_access.is_oa",
            entityTypes: ["works"],
            displayName: "Access",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Toll-access", "Open Access"],
            category: "access",
            isCore: true,
        },
        {
            key: "host_venue.license",
            entityTypes: ["works"],
            displayName: "OA license",
            valuesToShow: "mostCommon",
            category: "access",
        },
        {
            key: "open_access.oa_status",
            entityTypes: ["works"],
            displayName: "OA color",
            valuesToShow: "mostCommon",
            category: "access",
        },
        // {
        //     key: "has_abstract",
        //     entityTypes: ["works"],
        //     displayName: "Has abstract",
        //     valuesToShow: "mostCommon",
        // },


        // works: institutions:
        {
            key: "authorships.institutions.country_code",
            entityTypes: ["works"],
            displayName: "Institution country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            isCountry: true,
            category: "institution",
            isCore: true,
        },
        {
            key: "authorships.institutions.type",
            entityTypes: ["works"],
            displayName: "Institution type",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            category: "institution",
        },


        // works: general
        {
            key: "type",
            entityTypes: ["works"],
            displayName: "Work type",
            valuesToShow: "mostCommon",
            category: "general",
        },
        {
            key: "publication_year",
            entityTypes: ["works"],
            displayName: "Year published",
            valuesToShow: "mostCommon",
            sortByValue: true,
            isRange: true,
            category: "general",
            isCore: true,
        },
        {
            key: "has_doi",
            entityTypes: ["works"],
            displayName: "ID: DOI",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Has no DOI", "Has DOI"],
            category: "ids",
        },
        // {
        //     key: "has_pmid",
        //     entityTypes: ["works"],
        //     displayName: "Work IDs: PMID",
        //     valuesToShow: "boolean",
        //     isBoolean: true,
        //     booleanValues: ["Has no PMID", "Has PMID"],
        // },
        // {
        //     key: "has_ngrams",
        //     entityTypes: ["works"],
        //     displayName: "N-grams",
        //     valuesToShow: "boolean",
        //     isBoolean: true,
        //     booleanValues: ["Has no n-grams", "Has n-grams"],
        // },
        // {
        //     key: "is_paratext",
        //     entityTypes: ["works"],
        //     displayName: "Paratext",
        //     valuesToShow: "boolean",
        //     isBoolean: true,
        //     booleanValues: ["Isn't paratext", "Is paratext"],
        // },
        {
            key: "is_retracted",
            entityTypes: ["works"],
            displayName: "Retraction status",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Isn't retracted", "Is retracted"],
            category: "general",
        },

        // works: links to other works
        {
            key: "cited_by_count",
            entityTypes: ["works"],
            displayName: "Citation count",
            valuesToShow: "mostCommon",
            sortByValue: true,
            isRange: true,
            category: "citation",
            isCore: true,
        },
        {
            key: "cited_by",
            entityTypes: ["works"],
            displayName: "Cited by",
            isEntity: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            valuesToShow: "select",
            category: "citation",
        },
        {
            key: "cites",
            entityTypes: ["works"],
            displayName: "Cites",
            isEntity: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            valuesToShow: "select",
            category: "access",
        },
        {
            key: "related_to",
            entityTypes: ["works"],
            displayName: "Related to",
            isEntity: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            valuesToShow: "select",
            category: "general",
            isHidden: true,
        },


        // authors
        {
            key: "last_known_institution.id",
            entityTypes: ["authors"],
            displayName: "Institution",
            isEntity: true,
            entityId: "institutions",
            autocompleteEndpoint: "autocomplete/institutions",
            valuesToShow: "mostCommon",
        },
        {
            key: "last_known_institution.country_code",
            entityTypes: ["authors"],
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            isCountry: true,
        },
        {
            key: "last_known_institution.type",
            entityTypes: ["authors"],
            displayName: "Institution type",
            autocompleteEndpoint: "autocomplete/institutions/type",
            valuesToShow: "mostCommon",
        },


        // venues
        {
            key: "publisher",
            entityTypes: ["venues"],
            displayName: "Publisher",
            autocompleteEndpoint: "autocomplete/venues/publisher",
            valuesToShow: "mostCommon",
        },
        {
            key: "is_oa",
            entityTypes: ["venues"],
            displayName: "Open Access",
            valuesToShow: "mostCommon",
        },
        {
            key: "is_in_doaj",
            entityTypes: ["venues"],
            displayName: "Indexed in DOAJ",
            valuesToShow: "mostCommon",
        },


        // institutions
        {
            key: "country_code",
            entityTypes: ["institutions"],
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            isCountry: true,
        },
        {
            key: "type",
            entityTypes: ["institutions"],
            displayName: "Type",
            autocompleteEndpoint: "autocomplete/institutions/type",
            valuesToShow: "mostCommon",
        },


        // concepts
        {
            key: "level",
            entityTypes: ["concepts"],
            displayName: "Level",
            maxPotentialFiltersToShow: 10,
            valuesToShow: "mostCommon",
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
}

const getFacetConfig = function (key, attr) {
    const myFacetConfig = facetConfigs().find(f => f.key === key)
    if (!myFacetConfig) throw(`openAlex error: getFacetConfig: no such key as "${key}"`)

    if (!attr) return myFacetConfig
    if (myFacetConfig) return myFacetConfig[attr]
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