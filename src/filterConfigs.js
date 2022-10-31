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


const filtersFromUrlStr = function (str) {
    if (!str) return []
    if (str.indexOf(":") === -1) return []


    const filters = str.split(",").map(facetStr => {
        let [key, value] = facetStr.split(":")
        const isNegated = value[0] === "!"
        value = value.replace("!", "")
        return createSimpleFilter(key, value, isNegated)
    })
    return filters
}

const filtersAsUrlStr = function (filters) {
    return filters
        .filter(f => typeof f.value !== "undefined")
        .map(f => f.asStr)
        .join(",")
}


const removeFilterFromUrlStr = function (urlStr, filterToRemove) {
    if (!urlStr) return
    const filters = filtersFromUrlStr(urlStr)
    const newFilters = filters.filter(f => {
        return f.asStr !== filterToRemove.asStr
    })
    return filtersAsUrlStr(newFilters)
}

const makeResultsFiltersFromApi = function (apiFacets) {
    console.log("makeResultsFiltersFromApi", apiFacets)
    let ret = []
    apiFacets
        .filter(f => f.key !== "search")
        .forEach(facet => {
            facet.values.forEach(valueObj => {
                ret.push(createDisplayFilter(
                    facet.key,
                    valueObj.value,
                    facet.is_negated,
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

const createSimpleFilter = function (key, value, isNegated) {
    const cleanValue = createFilterValue(value)
    const facetConfig = getFacetConfig(key)
    return {
        ...facetConfig,
        // key,
        value: cleanValue,
        asStr: createFilterId(key, cleanValue, isNegated),
        kv: createFilterId(key, cleanValue),
        isEntity: entityKeys.includes(key),
        isNegated: !!isNegated,
    }
}

const createDisplayFilter = function (key, value, isNegated, displayValue, count, totalCount) {
    return {
        ...createSimpleFilter(key, value, isNegated),
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
    else if (range[0] === "") return "Through " + range[1]
    else if (range[1] === "") {
        if (range[0] == currentYear) {
            return currentYear
        } else {
            return "Since " + range[0]
        }
    } else return range.join("-")
}

const makeFilterList = function (filters, resultsFilters, includeResultsFilters = true) {
    if (!filters.length) return []
    const config = getFacetConfig(filters[0].key)

    let ret = _.cloneDeep(filters)
        .filter(f => f.value !== "unknown")
        .map(f => {
            const myResultsFilter = resultsFilters.find(rf => rf.kv === f.kv)
            return myResultsFilter ?? f
        })

    if (includeResultsFilters) {
        const retFilterStrings = ret.map(f => f.kv)
        const missingResultsFilters = resultsFilters.filter(f => !retFilterStrings.includes(f.kv))
        ret.push(..._.cloneDeep(missingResultsFilters))
    }


    if (config.sortByValue) {
        ret.sort((a, b) => {
            return (a.value > b.value) ? -1 : 1
        })
    } else {
        ret.sort((a, b) => {
            return b.count - a.count
        })
    }

    // const maxCountSelected = Math.max(...resultsFilters.map(r => r.count))
    // const maxCount = Math.max(...ret.map(r => r.count))

    // ret.forEach(f => {
    //   f.countNormalized = f.count / maxCount
    // })


    return ret
}


export {
    filtersAsUrlStr,
    filtersFromUrlStr,
    removeFilterFromUrlStr,

    makeResultsFiltersFromApi,
    createSimpleFilter,
    createDisplayFilter,
    createFilterId,
    addDisplayNamesToFilters,
    displayYearRange,
    makeFilterList,
}