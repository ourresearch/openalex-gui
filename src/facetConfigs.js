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


const onlyReturnTheseFacets = [
    "has_doi",
    "has_ngrams",
    "is_paratext",
    "is_retracted",

    "open_access.is_oa",
    "authorships.author.id",
    "authorships.institutions.country_code",
    "authorships.institutions.id",
    "authorships.institutions.type",
    "has_abstract",
    "host_venue.display_name",
    "host_venue.license",
    "host_venue.publisher",
    "host_venue.type",
    "open_access.oa_status",
    "publication_year",
    "type"
]

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
        },


        // works:  wavic
        {
            key: "concepts.id",
            entityTypes: ["works"],
            displayName: "Concepts",
            isEntity: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            valuesToShow: "mostCommon",
        },
        {
            key: "host_venue.id",
            entityTypes: ["works"],
            displayName: "Venues",
            isEntity: true,
            entityId: "venues",
            autocompleteEndpoint: "autocomplete/venues",
            valuesToShow: "mostCommon",
        },
        {
            key: "authorships.institutions.id",
            entityTypes: ["works"],
            displayName: "Institution",
            isEntity: true,
            entityId: "institutions",
            autocompleteEndpoint: "autocomplete/institutions",
            valuesToShow: "mostCommon",
        },
        {
            key: "authorships.author.id",
            entityTypes: ["works"],
            displayName: "Author",
            isEntity: true,
            entityId: "authors",
            autocompleteEndpoint: "autocomplete/authors",
            valuesToShow: "mostCommon",
        },


        // works: host venue
        {
            key: "host_venue.publisher",
            entityTypes: ["works"],
            displayName: "Publisher",
            autocompleteEndpoint: "autocomplete/venues/publisher",
            valuesToShow: "mostCommon",
        },
        {
            key: "host_venue.type",
            entityTypes: ["works"],
            displayName: "Venue type",
            autocompleteEndpoint: "autocomplete/venues/publisher",
            valuesToShow: "mostCommon",
        },


        // works: open access
        {
            key: "open_access.is_oa",
            entityTypes: ["works"],
            displayName: "Open Access",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Toll-access", "Open Access"]
        },
        {
            key: "host_venue.license",
            entityTypes: ["works"],
            displayName: "License",
            valuesToShow: "mostCommon",
        },
        {
            key: "open_access.oa_status",
            entityTypes: ["works"],
            displayName: "OA color",
            valuesToShow: "mostCommon",
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
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            isCountry: true,
        },
        {
            key: "authorships.institutions.type",
            entityTypes: ["works"],
            displayName: "Institution type",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
        },


        // works: general
        {
            key: "type",
            entityTypes: ["works"],
            displayName: "Type",
            valuesToShow: "mostCommon",
        },
        {
            key: "publication_year",
            entityTypes: ["works"],
            displayName: "Year",
            valuesToShow: "mostCommon",
            sortByValue: true,
            isRangeable: true,
        },
        {
            key: "has_doi",
            entityTypes: ["works"],
            displayName: "DOI",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Has no DOI", "Has DOI"],
        },
        {
            key: "has_ngrams",
            entityTypes: ["works"],
            displayName: "N-grams",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Has no n-grams", "Has n-grams"],
        },
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
            displayName: "Retraction",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Isn't retracted", "Is retracted"],
        },

        // works: links to other works
        {
            key: "cited_by_count",
            entityTypes: ["works"],
            displayName: "Citation count",
            valuesToShow: "mostCommon",
        },
        {
            key: "cited_by",
            entityTypes: ["works"],
            displayName: "Cited by",
            isEntity: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            valuesToShow: "select",
        },
        {
            key: "cites",
            entityTypes: ["works"],
            displayName: "Cites",
            isEntity: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            valuesToShow: "select",
        },
        {
            key: "related_to",
            entityTypes: ["works"],
            displayName: "Related to",
            isEntity: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            valuesToShow: "select",
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
}