import {facetConfigs} from "../facetConfigs";
import {api} from "../api";

const entityKeys = facetConfigs().filter(f => f.isEntity).map(f => f.key)


const createFilterId = function (key, value) {
    const openAlexUrlBase = "https://openalex.org/"
    if (typeof value === "string" && value.indexOf(openAlexUrlBase) === 0) {
        value = value.replace("https://openalex.org/", "").toLowerCase()
    }
    key = key.toLowerCase()
    return key + ":" + value
}


const addDisplayNamesToFilters = async function(filtersList) {
    const openAlexIdFilterValues = filtersList.filter(f => f.isEntity).map(f => f.value)


    const displayNamesDict = await api.getEntityDisplayNames(openAlexIdFilterValues)
    console.log("displayNamesDict", displayNamesDict)
    return filtersList.map(f => {
        return {
            ...f,
            displayName: displayNamesDict[f.value]
        }
    })
}

const createFilter = function (key, value) {
    if (typeof value === "string") {
        value = value.replace("https://openalex.org/", "")
    }

    return {
        id: createFilterId(key, value),
        key,
        value,
        count: null,
        displayName: value,
        isEntity: entityKeys.includes(key)
    }
}

export {
    createFilter,
    createFilterId,
    addDisplayNamesToFilters,
}