import {facetConfigs, getFacetConfig} from "./facetConfigs";
import {api} from "./api";
import {shortenOpenAlexId} from "@/util";


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

    const filterStrings = str.split(",")
    const filters = []
    filterStrings.forEach(filterString => {
        const regex = /(?<!http|https):/
        const [key, ...rest] = filterString.split(regex);
        const valuesStr = rest.join(':');
        const value = valuesStr.replace(/^!/, "");
        const isNegated = valuesStr[0] === "!"
        const myFilter = createSimpleFilter(
            entityType,
            key,
            value,
            isNegated,
        )
        filters.push(myFilter)
        // if (valuesStr[0] === "!") {
        //     const value = valuesStr.replace("!", "")
        //     filters.push(createSimpleFilter(entityType, key, value, true))
        // } else {
        //     filters.push(createSimpleFilter(entityType, key, valuesStr, false))


        // const values = valuesStr.split("|")
        // values.forEach(value => {
        //     filters.push(createSimpleFilter(entityType, key, value, false))
        // })
        // }
    })
    return filters
}

const getMatchModeFromSelectFilterValue = function (valueStr) {
    return (valueStr?.indexOf(",") > -1) ? "all" : "any"
}

const optionsToString = function (options) {
    return options.join("|")
}

const optionsFromString = function (str) {
    const strWithoutNegation = str.replace(/^!/, "")
    const regex = /[+|]/
    return strWithoutNegation.split(regex).map(option => {
        return option.toLowerCase()
    })
}


const deleteOptionFromFilterValue = function (valueStr, optionToDelete) {
    const oldOptions = optionsFromString(valueStr)
    const newOptions = oldOptions.filter(oldOption => {
        return oldOption !== optionToDelete
    })
    return optionsToString(newOptions)
}
const addOptionToFilterValue = function (valueStr, optionToAdd) {
    // const matchMode = getMatchModeFromSelectFilterValue(valueStr)
    const oldOptions = optionsFromString(valueStr)
    const newOptions = [...oldOptions, optionToAdd]
    return optionsToString(newOptions)
}


const toggleNegation = function (option) {
    return option[0] === "!" ?
        option.substr(1) :
        "!" + option

}
const negateOption = function (option) {
    return option[0] === "!" ?
        option :
        "!" + option
}
const removeNegationFromOption = function (option) {
    return option[0] === "!" ?
        option.substr(1) :
        option
}
const setOptionIsNegated = function(option, isNegated) {
    return isNegated ?
        negateOption(option) :
        removeNegationFromOption(option)
}

// alias because i'm refactoring
const setStringIsNegated = function(string, isNegated) {
    return isNegated ?
        negateOption(string) :
        removeNegationFromOption(string)
}



const toggleOptionIsNegated = function (valueStr, optionToToggleNegation) {
    const oldOptions = optionsFromString(valueStr)
    const newOptions = oldOptions.map(oldOption => {
        return oldOption === optionToToggleNegation ?
            toggleNegation(oldOption) :
            oldOption

    })
    return optionsToString(newOptions)
}




const makeSelectFilterValue = function (items, matchMode) {
    const sep = {
        any: "|",
        all: "+",
        none: "|"
    }
    const prepend = (matchMode === "none") ? "!" : ""
    return prepend + items.join(sep[matchMode])
}

const filtersAreEqual = function (f1, f2) {
    const sameKey = f1.key === f2.key
    const sameValue = f1.value === f2.value
    const sameNegation = f1.isNegated === f2.isNegated
    return sameKey && sameValue && sameNegation
}

// const filtersAsUrlStr = function (filters) {
//     return filters
//         .filter(f => typeof f.value !== "undefined")
//         .map(f => f.asStr)
//         .join(",")
// }
const filtersAsUrlStr = function (filters) {
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


const createFilterValue = function (rawValue, filterType) {
    if (filterType === "search") {
        return rawValue
    }
    if (typeof rawValue === "string") {
        // rawValue = rawValue.replace("https://openalex.org/", "")
        rawValue = shortenOpenAlexId(rawValue)
        // rawValue = rawValue.replace("unknown", null)
    }
    if (filterType === "boolean") {
        if (rawValue === undefined) {
            rawValue = true //boolean filters default to true
        }
        if (rawValue == "true") rawValue = true
        if (rawValue == "false") rawValue = false
    }
    return rawValue
}

const createSimpleFilter = function (entityType, key, value, isNegated) {
    // console.log("createSimpleFilter", key, value, isNegated)
    if (!key) {
        throw Error(
            `OpenAlex: createSimpleFilter(): no key provided.`
        )
    }
    const facetConfig = getFacetConfig(entityType, key)
    const myValue = createFilterValue(value, facetConfig.type)
    if (!myValue) isNegated = true

    const nullValues = ["unknown", "null"]
    const apiValue = (nullValues.includes(myValue)) ? null : myValue

    const negationSymbol = (isNegated && !!myValue) ?
        "!" :
        ""
    const asStr = facetConfig.key + ":" + negationSymbol + apiValue

    return {
        ...facetConfig,
        // key,
        value: myValue,
        asStr,
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




const convertYearRangeToPrettyWords = function (yearRange) {
    if (yearRange[0] === yearRange[1]) {
        return yearRange[0]
    } else if (!yearRange[0]) {
        // return "Before " + (Number(yearRange[1]) + 1)
        return "Before or in " + (Number(yearRange[1]))
    } else if (!yearRange[1]) {
        return yearRange[0] + " and later"
    } else {
        return yearRange.join("-")
    }
}

const convertRangeToPrettyWords = function (range) {
    if (range[0] === range[1]) {
        return range[0] + " exactly"
    } else if (!range[0]) {
        // return (Number(range[1]).toLocaleString() ) + " or fewer"
        return "At most " + (Number(range[1]).toLocaleString())
    } else if (!range[1]) {
        return Number(range[0]).toLocaleString() + " or more"
    } else {
        return range.join("-")
    }
}

const createDisplayFilter = function (entityType, key, value, isNegated, displayValue, count, countScaled) {

    const simpleFilter = createSimpleFilter(entityType, key, value, isNegated)
    if (simpleFilter.valuesToShow === 'range' && /\d*-\d*/.test(value)) {
        if (key === "publication_year") {
            displayValue = convertYearRangeToPrettyWords(value.split("-"))
        } else {
            displayValue = convertRangeToPrettyWords(value.split("-"))
        }

    }
    if (simpleFilter.displayNullAs && ["unknown", "null", null].includes(value)) {
        displayValue = simpleFilter.displayNullAs

    }

    return {
        ...simpleFilter,
        displayValue,
        count,
        countScaled,
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
    filtersAreEqual,

    filtersFromFiltersApiResponse,
    createSimpleFilter,
    copySimpleFilter,
    createDisplayFilter,
    createFilterId,
    displayYearRange,

    deleteOptionFromFilterValue,
    addOptionToFilterValue,
    toggleOptionIsNegated,
    setOptionIsNegated,
    setStringIsNegated,
    optionsToString,
    optionsFromString,

    sortedFilters,

    getMatchModeFromSelectFilterValue,
    makeSelectFilterValue,
}