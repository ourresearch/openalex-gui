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
    if (!str) return
    return str.split(",")
        .map(filterString => {
            const [key, value] = filterString.split(":");
            return {key, value}
        })
        .find(f => {
            return f.key === "display_name.search"
        })?.value
}

const filtersFromUrlStr = function (str) {
    if (!str) return []
    if (str.indexOf(":") === -1) return []

    const facetStrings = str.split(",")
    const filters = []
    facetStrings.forEach(facetStr => {
        const [key, valuesStr] = facetStr.split(":")

        // although the api (and our own URL) treats this as just another filter,
        // we don't store it that way.
        if (key !== "display_name.search") {

            const values = valuesStr.split("|")
            values.forEach(value => {
                filters.push(createSimpleFilter(key, value))
            })
        }
    })
    return filters
}

const filtersAsUrlStr = function (filters, keyToNegate) {
    const keys = filters.filter(f => typeof f.value !== "undefined").map(f => f.key)
    keys.sort()
    const facetStrings = keys.map(k => {
        const values = filters.filter(f => f.key === k).map(f => f.value)
        let valueString = values.join("|")
        if (keyToNegate === k) valueString = "!" + valueString
        return k + ":" + valueString
    })
    return facetStrings.join(",")
}


const createFilterValue = function (rawValue) {
    if (typeof rawValue === "string") {
        rawValue = rawValue.replace("https://openalex.org/", "")
    }
    return rawValue
}

// change name to createFilter() after refactor
const createSimpleFilter = function (key, value) {
    const cleanValue = createFilterValue(value)
    return {
        key,
        value: cleanValue,
        asStr: createFilterId(key, cleanValue),
        isEntity: entityKeys.includes(key), // better to just include the whole config maybe...
    }
}

const createDisplayFilter = function (key, value, displayValue, count) {
    return {
        ...createSimpleFilter(key, value),
        displayValue,
        count,
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
    filtersAsUrlStr,
    filtersFromUrlStr,
    textSearchFromUrlString,

    createFilter,
    createSimpleFilter,
    createDisplayFilter,
    createFilterId,
    addDisplayNamesToFilters,
}