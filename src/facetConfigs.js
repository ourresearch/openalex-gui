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
        {
            key: "display_name.search",
            entityTypes: allEntityTypes(),
            displayName: "Name",
        },
        {
            key: "x-concepts.id",
            entityTypes: ["authors", "institutions", "venues"],
            displayName: "Concepts",
            isEntity: true,
        },
        {
            key: "concepts.id",
            entityTypes: ["works"],
            displayName: "Concepts",
            isEntity: true,
        },
        {
            key: "host_venue.id",
            entityTypes: ["works"],
            displayName: "Venues",
            isEntity: true,
        },
        {
            key: "institutions.id",
            entityTypes: ["works"],
            displayName: "Institution",
            isEntity: true,
        },
        {
            key: "author.id",
            entityTypes: ["works"],
            displayName: "Author",
            isEntity: true,
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
        },
        {
            key: "institutions.country_code",
            entityTypes: ["works"],
            displayName: "Country",
        },
        {
            key: "type",
            entityTypes: ["works"],
            displayName: "Type",
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