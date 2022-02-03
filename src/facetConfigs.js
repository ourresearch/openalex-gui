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
        },
        {
            key: "concept.id",
            entityTypes: ["works"],
            displayName: "Concepts",
        },
        {
            key: "host_venue.id",
            entityTypes: ["works"],
            displayName: "Venues",
        },
    ]
    return ret.map(config => {
        return {
            ...config,
            values: [],
        }
    })
}

export {
    facetConfigs
}