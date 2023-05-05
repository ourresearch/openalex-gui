import {facetConfigs, getFacetConfig} from "./facetConfigs";
import {api} from "./api";

const entityKeys = facetConfigs().filter(f => f.isEntity).map(f => f.key)


const createFilterId = function (key, value, isNegated) {
    key = key.toLowerCase()
    const negateSymbol = (isNegated) ? "!" : ""

    const openAlexUrlBase = "https://openalex.org/"
    if (typeof value === "string" && value.indexOf(openAlexUrlBase) === 0) {
        value = value.replace("https://openalex.org/", "").toLowerCase()
    }
    return `${key}:${negateSymbol}${value}`
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
    const filtersAsStrings = filters.map((f => f.asStr))
    const dedupedFilterStrings = new Set([...filtersAsStrings])
    return [...dedupedFilterStrings].join(",")
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

const createSimpleFilter = function (entityType, key, value, isNegated) {

    const displayValue = createFilterValue(value)
    const nullValues = ["unknown", "null"]
    const apiValue = (nullValues.includes(displayValue)) ? null : displayValue

    const facetConfig = getFacetConfig(entityType, key)
    return {
        ...facetConfig,
        // key,
        value: displayValue,
        asStr: createFilterId(key, apiValue, isNegated),
        kv: createFilterId(key, apiValue),
        // isEntity: entityKeys.includes(key),
        isNegated: !!isNegated,
        isNullValue: (apiValue === null),
    }
}

const copySimpleFilter = function (filter, overwriteWith) {

    return createSimpleFilter(
        overwriteWith?.entityType ?? filter.entityType,
        overwriteWith?.key ?? filter.key,
        overwriteWith?.value ?? filter.value,
        overwriteWith?.isNegated ?? filter.isNegated
    )
}

const createSimpleFilterFromPid = function (pid) {
    if (!pid) return
    const trimmedPid = pid.trim()
    const pidFilters = facetConfigs().map(f => {
        const matches = trimmedPid.match(f.regex)
        if (matches?.length === 2) {
            const value = matches[1] // first capture group
            return createSimpleFilter(
                f.entityType,
                f.key,
                value
            )
        } else {
            return null
        }
    })
    return pidFilters.find(f => !!f) // shoudld be only one not null
}

const createDisplayFilterFromPid = function (pid) {
    if (!pid) return
    const trimmedPid = pid.trim()
    const pidFilters = facetConfigs().map(f => {
        const matches = trimmedPid.match(f.regex)
        if (matches?.length === 2) {
            const value = matches[1] // first capture group
            return createDisplayFilter(
                f.entityType,
                f.key,
                value,
                false,
                value
            )
        } else {
            return null
        }
    })
    return pidFilters.find(f => !!f) // shoudld be only one not null
}


const convertYearRangeToPrettyWords = function (yearRange) {
    if (yearRange[0] === yearRange[1]) {
        return yearRange[0]
    } else if (!yearRange[0]) {
        // return "Before " + (Number(yearRange[1]) + 1)
        return  "Before or in " + (Number(yearRange[1]) )
    } else if (!yearRange[1]) {
        return  yearRange[0] + " and later"
    } else {
        return yearRange.join("-")
    }
}

const convertRangeToPrettyWords = function (range) {
    if (range[0] === range[1]) {
        return range[0] + " exactly"
    } else if (!range[0]) {
        // return (Number(range[1]).toLocaleString() ) + " or fewer"
        return "At most " + (Number(range[1]).toLocaleString() )
    } else if (!range[1]) {
        return  Number(range[0]).toLocaleString() + " or more"
    } else {
        return range.join("-")
    }
}

const createDisplayFilter = function (entityType, key, value, isNegated, displayValue, count, totalCount) {

    const simpleFilter = createSimpleFilter(entityType, key, value, isNegated)
    if (simpleFilter.isRange && /\d*-\d*/.test(value)) {
        if (key === "publication_year") {
            displayValue = convertYearRangeToPrettyWords(value.split("-"))
        }
        else {
            displayValue = convertRangeToPrettyWords(value.split("-"))
        }

    }
    if (simpleFilter.displayNullAs  && value === "unknown") {
        displayValue = simpleFilter.displayNullAs

    }

    return {
        ...simpleFilter,
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


const sortedFilters = function (filters, sortByValue) {
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
    copySimpleFilter,
    createSimpleFilterFromPid,
    createDisplayFilterFromPid,
    createDisplayFilter,
    createFilterId,
    displayYearRange,

    sortedFilters,
}