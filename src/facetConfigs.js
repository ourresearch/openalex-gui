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
            key: "display_name.search",
            entityTypes: allEntityTypes(),
            displayName: "Name",
        },
        {
            key: "x_concepts.id",
            entityTypes: ["authors", "institutions", "venues"],
            displayName: "Core concepts",
            isEntity: true,
            autocompleteEndpoint: "autocomplete/concepts",
        },


        // works
        {
            key: "concepts.id",
            entityTypes: ["works"],
            displayName: "Concepts",
            isEntity: true,
            autocompleteEndpoint: "autocomplete/concepts",
        },
        {
            key: "host_venue.id",
            entityTypes: ["works"],
            displayName: "Venues",
            isEntity: true,
            autocompleteEndpoint: "autocomplete/venues",
        },
        {
            key: "institutions.id",
            entityTypes: ["works"],
            displayName: "Institution",
            isEntity: true,
            autocompleteEndpoint: "autocomplete/institutions",
        },
        {
            key: "author.id",
            entityTypes: ["works"],
            displayName: "Author",
            isEntity: true,
            autocompleteEndpoint: "autocomplete/authors",
        },
        {
            key: "oa_status",
            entityTypes: ["works"],
            displayName: "Open Access",
        },
        {
            key: "host_venue.publisher",
            entityTypes: ["works"],
            displayName: "Publisher",
            autocompleteEndpoint: "autocomplete/venues/publisher",
        },
        {
            key: "institutions.country_code",
            entityTypes: ["works"],
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
        },
        {
            key: "type",
            entityTypes: ["works"],
            displayName: "Type",
        },


        // authors
        {
            key: "last_known_institution.id",
            entityTypes: ["authors"],
            displayName: "Institution",
            isEntity: true,
            autocompleteEndpoint: "autocomplete/institutions",
        },
        {
            key: "last_known_institution.country_code",
            entityTypes: ["authors"],
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
        },
        {
            key: "last_known_institution.type",
            entityTypes: ["authors"],
            displayName: "Institution type",
            autocompleteEndpoint: "autocomplete/institutions/type",
        },


        // venues
        {
            key: "publisher",
            entityTypes: ["venues"],
            displayName: "Publisher",
            autocompleteEndpoint: "autocomplete/venues/publisher",
        },
        {
            key: "is_oa",
            entityTypes: ["venues"],
            displayName: "Open Access",
        },
        {
            key: "is_in_doaj",
            entityTypes: ["venues"],
            displayName: "Indexed in DOAJ",
        },


        // institutions
        {
            key: "country_code",
            entityTypes: ["institutions"],
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
        },
        {
            key: "type",
            entityTypes: ["institutions"],
            displayName: "Type",
            autocompleteEndpoint: "autocomplete/institutions/type",
        },


        // concepts
        {
            key: "level",
            entityTypes: ["concepts"],
            displayName: "Level",
            maxPotentialFiltersToShow: 10,
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