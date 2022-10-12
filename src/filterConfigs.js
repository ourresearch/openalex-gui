import {facetConfigs, getFacetConfig} from "./facetConfigs";
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


const filtersFromUrlStr = function (str) {
    if (!str) return []
    if (str.indexOf(":") === -1) return []

    const facetStrings = str.split(",")
    const filters = []
    facetStrings.forEach(facetStr => {
        const [key, valuesStr] = facetStr.split(":")

        const values = valuesStr.split("|")
        values.forEach(value => {
            filters.push(createSimpleFilter(key, value))
        })
    })


    return filters
}

const filtersAsUrlStr = function (filters, keyToNegate) {
    const keys = filters.filter(f => typeof f.value !== "undefined").map(f => f.key)
    keys.sort()
    const uniqueKeys = [...new Set(keys)]
    const facetStrings = uniqueKeys.map(k => {
        const values = filters.filter(f => f.key === k).map(f => f.value)
        let valueString = values.join("|")
        if (keyToNegate === k) valueString = "!" + valueString
        return k + ":" + valueString
    })
    return facetStrings.join(",")
}


const removeFilterFromUrlStr = function(urlStr, filterToRemove){
    if (!urlStr) return
    const filters = filtersFromUrlStr(urlStr)
    const newFilters = filters.filter(f => {
        return f.asStr !== filterToRemove.asStr
    })
    return filtersAsUrlStr(newFilters)
}

const makeResultsFiltersFromApi = function (apiFacets) {
    let ret = []
    apiFacets
        .filter(f => f.key !== "search")
        .forEach(facet => {
        facet.values.forEach(valueObj => {
            ret.push(createDisplayFilter(
                facet.key,
                valueObj.value,
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

const createSimpleFilter = function (key, value) {
    const cleanValue = createFilterValue(value)
    const facetConfig = getFacetConfig(key)
    return {
        ...facetConfig,
        // key,
        value: cleanValue,
        asStr: createFilterId(key, cleanValue),
        isEntity: entityKeys.includes(key), // better to just include the whole config maybe...
    }
}

const createDisplayFilter = function (key, value, displayValue, count, totalCount) {
    return {
        ...createSimpleFilter(key, value),
        displayValue,
        count,
        countPercent: (count / totalCount) * 100,
    }
}

const makeFilterList = function (filters, resultsFilters) {
    if (!filters.length) return []
    const config = getFacetConfig(filters[0].key)

    let ret = _.cloneDeep(filters)
          .filter(f => f.value !== "unknown")
          .map(f => {
            return {
              ...f,
              isResultsFilter: resultsFilters.map(f => f.asStr).includes(f.asStr),
            }
          })

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

    makeFilterList,
}