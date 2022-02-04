const getfilterCounts = async function(filtersList) {
    return filtersList
}
const getFilterDisplayNames = async function(filtersList) {
    return filtersList
}

const createFilterId = function(key, value){
    if (typeof value === "string") {
        value = value.replace("https://openalex.org/", "")
    }
    return key + ":" + value
}

const createFilter = function ({key, value, count, displayName}) {
    if (typeof value === "string") {
        value = value.replace("https://openalex.org/", "")
    }

    return {
        id: createFilterId(key, value),
        key,
        value,
        count,
        displayName: displayName ?? value,
    }
}

export {
    createFilter,
    createFilterId,
    getfilterCounts,
    getFilterDisplayNames,
}