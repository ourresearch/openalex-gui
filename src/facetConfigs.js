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

const makeFacetQueryFilters = function(facetFilters){

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
        },


        // works
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
            key: "institutions.id",
            entityTypes: ["works"],
            displayName: "Institution",
            isEntity: true,
            entityId: "institutions",
            autocompleteEndpoint: "autocomplete/institutions",
            valuesToShow: "mostCommon",
        },
        {
            key: "author.id",
            entityTypes: ["works"],
            displayName: "Author",
            isEntity: true,
            entityId: "authors",
            autocompleteEndpoint: "autocomplete/authors",
            valuesToShow: "mostCommon",
        },
        {
            key: "is_oa",
            entityTypes: ["works"],
            displayName: "Free to read",
            valuesToShow: "mostCommon",
        },
        {
            key: "host_venue.publisher",
            entityTypes: ["works"],
            displayName: "Publisher",
            autocompleteEndpoint: "autocomplete/venues/publisher",
            valuesToShow: "mostCommon",
        },
        {
            key: "institutions.country_code",
            entityTypes: ["works"],
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
        },
        {
            key: "type",
            entityTypes: ["works"],
            displayName: "Type",
            valuesToShow: "mostCommon",
        },
        {
            key: "referenced_works",
            entityTypes: ["works"],
            displayName: "Cites work",
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
    return ret.map(config => {
        return {
            ...config,
            values: [],
        }
    })
}

const getFacetConfig = function(key, attr){
    const myFacetConfig = facetConfigs().find(f => f.key === key)
    if (myFacetConfig) return myFacetConfig[attr]
}

const makeFacet = function(key, isNegated, values){
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