import {facetConfigs, getFacetConfig} from "./facetConfigs";
import {api} from "./api";

const entityKeys = facetConfigs().filter(f => f.isEntity).map(f => f.key)


const createFilterId = function (key, value, isNegated) {
    const openAlexUrlBase = "https://openalex.org/"
    if (typeof value === "string" && value.indexOf(openAlexUrlBase) === 0) {
        value = value.replace("https://openalex.org/", "").toLowerCase()
    }
    key = key.toLowerCase()
    const negateSymbol = (isNegated) ? "!" : ""
    return `${key}:${negateSymbol}${value}`
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


const filtersFromUrlStr = function (entityType, str) {
    if (!str) return []
    if (str.indexOf(":") === -1) return []

    const facetStrings = str.split(",")
    const filters = []
    facetStrings.forEach(facetStr => {
        const [key, valuesStr] = facetStr.split(":")
        if (valuesStr[0] === "!") {
            const value = valuesStr.replace("!", "")
            filters.push(createSimpleFilter(entityType, key, value, true))
        } else {
            const values = valuesStr.split("|")
            values.forEach(value => {
                filters.push(createSimpleFilter(entityType, key, value, false))
            })
        }
    })
    return filters
}


// const filtersAsUrlStr = function (filters) {
//     return filters
//         .filter(f => typeof f.value !== "undefined")
//         .map(f => f.asStr)
//         .join(",")
// }
const filtersAsUrlStr = function (filters, entityType) {
    const filtersAsStrings = filters.map(f => {
        if (!f) return ""
        const valuePrepend = (f.isNegated) ? "!" : ""
        const value = valuePrepend + f.value
        return [f.key, value].join(":")
    })
    return filtersAsStrings.join(",")

    // old way allowed for OR-ing values within a facet, now unsupported.
    const configs = facetConfigs(entityType)
    const mergedFiltersByFacet = configs.map(c => {
        const myFilters = filters.filter(f => f.key === c.key)
        return mergeFacetFilters(myFilters)
    })
    const ret = mergedFiltersByFacet.flat().join(",")
    return ret
}

const mergeFacetFilters = function (filters) {
    if (!filters.length) return []
    const positiveFilters = filters.filter(f => !f.isNegated)
    const positiveFiltersToString = mergePositiveFacetFilters(positiveFilters)

    const negatedFilters = filters.filter(f => f.isNegated)
    const negativeFiltersToStrings = negatedFilters.map(f => {
        return [f.key, "!" + f.value].join(":")
    })

    const ret = [positiveFiltersToString, ...negativeFiltersToStrings].filter(x => !!x)
    // console.log("mergeFacetFilters done", filters[0].key, ret)
    return ret
}

const mergePositiveFacetFilters = function (filters) {
    if (!filters.length) return
    const key = filters[0].key
    return [
        key,
        filters.map(f => f.value).join("|")
    ].join(":")
}


// const filtersFromFiltersApiResponse = function (apiFacets) {
//     console.log("filtersFromFiltersApiResponse", apiFacets)
//     let ret = []
//     apiFacets
//         .filter(f => f.key !== "search")
//         .forEach(facet => {
//             facet.values.forEach(valueObj => {
//                 ret.push(createDisplayFilter(
//                     facet.key,
//                     valueObj.value,
//                     facet.is_negated,
//                     valueObj.display_name,
//                     valueObj.count,
//                 ))
//             })
//         })
//     ret = ret.filter(f => f.key !== "search")
//     return ret
// }
const filtersFromFiltersApiResponse = function (entityType, apiFacets) {
    let ret = []
    apiFacets
        .filter(f => f.key !== "search")
        .forEach(facet => {
            facet.values.forEach(valueObj => {
                const isNegated = facet.is_negated
                ret.push(createDisplayFilter(
                    entityType,
                    facet.key,
                    valueObj.value,
                    isNegated,
                    valueObj.display_name,
                    valueObj.count,
                ))
            })
        })
    ret = ret.filter(f => f.key !== "search")
    return ret
}



const createFilterValue = function (rawValue) {
    if (typeof rawValue === "string") {
        rawValue = rawValue.replace("https://openalex.org/", "")
        // rawValue = rawValue.replace("unknown", null)
    }
    return rawValue
}

const createSimpleFilter = function ( entityType, key, value, isNegated) {
    const cleanValue = createFilterValue(value)
    const facetConfig = getFacetConfig(entityType, key)
    return {
        ...facetConfig,
        // key,
        value: cleanValue,
        asStr: createFilterId(key, cleanValue, isNegated),
        kv: createFilterId(key, cleanValue),
        // isEntity: entityKeys.includes(key),
        isNegated: !!isNegated,
    }
}

const createSimpleFilterFromPid = function(pid){
    if (!pid) return
    const trimmedPid = pid.trim()
    const pidFilters = facetConfigs().map(f => {
        const matches = trimmedPid.match(f.regex)
        if (matches?.length === 2){
            const value = matches[1] // first capture group
            return createSimpleFilter(
                f.entityType,
                f.key,
                value
            )
        }
        else {
            return null
        }
    })

    return pidFilters.find(f => !!f) // shoudld be only one not null
}

const createDisplayFilter = function (entityType, key, value, isNegated, displayValue, count, totalCount) {
    return {
        ...createSimpleFilter(entityType, key, value, isNegated), // @todo change!
        displayValue,
        count,
        countPercent: (count / totalCount) * 100,
    }
}

const displayYearRange = function (range) {
    range = range.map(r => {
        return (r === null || r === Infinity) ? "" : r
    })

    const currentYear = new Date().getFullYear()
    if (range[0] === "" && range[1] === "") return null
    else if (range[0] === range[1]) return range[0]
    else if (range[0] === "") return "through " + range[1]
    else if (range[1] === "") {
        if (range[0] == currentYear) {
            return currentYear
        } else {
            return "since " + range[0]
        }
    } else return range.join("-")
}


const sortedFilters = function(filters, sortByValue){
    const ret = _.cloneDeep(filters)

    if (sortByValue) {
        ret.sort((a, b) => {
            return (a.value > b.value) ? -1 : 1
        })
    } else {
        ret.sort((a, b) => {
            return b.count - a.count
        })
    }
    return ret
}



export {
    filtersAsUrlStr,
    filtersFromUrlStr,

    filtersFromFiltersApiResponse,
    createSimpleFilter,
    createSimpleFilterFromPid,
    createDisplayFilter,
    createFilterId,
    addDisplayNamesToFilters,
    displayYearRange,

    sortedFilters,
}