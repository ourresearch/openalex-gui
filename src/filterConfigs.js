import {facetConfigs} from "./facetConfigs";
import {api} from "./api";

const entityKeys = facetConfigs().filter(f => f.isEntity).map(f => f.key)


const createFilterId = function (key, value) {
    const openAlexUrlBase = "https://openalex.org/"
    if (typeof value === "string" && value.indexOf(openAlexUrlBase) === 0) {
        value = value.replace("https://openalex.org/", "").toLowerCase()
    }
    key = key.toLowerCase()
    return key + ":" + value
}


const addDisplayNamesToFilters = async function (filtersList) {
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

const textSearchFromUrlString = function (str) {
    str.split(",").find(filterString => {
        const [key, value] = filterString.split(":");
        return key ==="display_name.search"
    })?.value
}

const filterPairsFromUrlStr = async function (str) {
    const facetStrings = str.split(",")
    const filters = []
    facetStrings.forEach(facetStr => {
        const [key, valuesStr] = facetStr.split(":")

        // although the api (and our own URL) treats this as just another filter,
        // we don't store it that way.
        if (key !== "display_name.search") {

            const values = valuesStr.split("|")
            values.forEach(value => {
                filters.push([key, value])
            })
        }

    })
    const ret = await addDisplayNamesToFilters(filters)
    return ret

}

const filterPairsAsUrlStrOld = function (filters) {
    const keys = filters.map(f => f.key)
    const facetStrings = keys.map(k => {
        const values = filters.filter(f => f.key === k).map(f => f.value)
        return k + ":" + values.join("|")
    })
    return facetStrings.join(",")
}
const filterPairsAsUrlStr = function (filterPairs) {
    const keys = filterPairs.map(f => f[0])
    const facetStrings = keys.map(k => {
        const values = filterPairs.filter(f => f[0] === k).map(f => f[1])
        return k + ":" + values.join("|")
    })
    return facetStrings.join(",")
}


const createFilterValue = function(rawValue){
    if (typeof rawValue === "string") {
        rawValue = rawValue.replace("https://openalex.org/", "")
    }    
    return rawValue
}

// change name to createFilter() after refactor
const createSimpleFilter = function(key, value){
    const cleanValue = createFilterValue(value)
    return {
        key,
        value: cleanValue,
        asStr: createFilterId(key, cleanValue),
    }
}

const createDisplayFilter = function (key, value, displayName, count) {
    return {
        ...createSimpleFilter(key, value),
        displayName,
        count,
        isEntity: entityKeys.includes(key), // better to just include the whole config maybe...
    }
}


// goal is to completely replace this with createSimpleFilter() and createDisplayFilter()
const createFilter = function (key, value, displayName, count) {
    if (typeof value === "string") {
        value = value.replace("https://openalex.org/", "")
    }

    return {
        id: createFilterId(key, value),
        key,
        value,
        count: null,
        displayName: displayName ?? value,
        isEntity: entityKeys.includes(key)
    }
}

export {
    createFilter,
    createSimpleFilter,
    createDisplayFilter,
    createFilterId,
    addDisplayNamesToFilters,
}