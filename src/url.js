import router from "./router";
import {
    filtersAsUrlStr,
    filtersFromUrlStr,
    filtersAreEqual,
    createSimpleFilter,
    getItemsFromSelectFilterValue,
    deleteOptionFromFilterValue,
    optionsFromString,
    addOptionToFilterValue,
    toggleOptionIsNegated,
    getMatchModeFromSelectFilterValue, optionsToString,
} from "./filterConfigs";
import {entityConfigs} from "@/entityConfigs";
import entity from "@/components/Entity/Entity.vue";
import {entityTypes, shortenOpenAlexId} from "./util";
import {filter} from "core-js/internals/array-iteration";
import {getActionConfig, getActionDefaultsStr, getActionDefaultValues} from "@/actionConfigs";



const addToQuery = function (oldQuery, k, v) {
    const newQuery = {...oldQuery}
    newQuery[k] = v
    return newQuery
}

const pushQueryParam = function (key, value) {
    const query = {
        ...router.currentRoute.query,
        [key]: value,
    }
    pushToRoute(router, {
        name: "Serp",
        query,
    })
}


const pushToRoute = async function (router, newRoute) {
    return await router.push(newRoute)
        .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
                throw e
            }
        })
}


const setPage = async function (page) {
    return pushToRoute(router, {
        name: "Serp",
        query: {
            ...router.currentRoute.query,
            page
        }
    })
}

const setShowApi = function (val) {
    pushQueryParam("show_api", val)
}


const pushNewFilters = async function (newFilters) {
    const filter = (newFilters.length) ?
        filtersAsUrlStr(newFilters) :
        undefined

    const query = {
        ...router.currentRoute.query,
        page: 1,
        filter,
    }
    query.sort = getActionDefaultsStr("sort", query)

    const newRoute = {
        name: "Serp",
        params: {entityType: "works"},
        query
    }
    return pushToRoute(router, newRoute)
}


const createFilter = async function (entityType, key, newValue) {
    console.log("url.createFilter()", entityType, key, newValue);

    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)
    if (oldFilters.map(f => f.key).includes(key)) {
        throw Error("OpenAlex: url.createFilter trying to create a filter with a key that's already in URL")
    }
    const newFilters = [...oldFilters, createSimpleFilter(entityType, key, newValue)]

    return await pushNewFilters(newFilters)

}
const readFilter = function (entityType, key) {
    return filtersFromUrlStr(entityType, router.currentRoute.query.filter).find(f => {
        return f.key === key
    })
}

const readFiltersLength = function(){
    return filtersFromUrlStr(
        router.currentRoute.params.entityType,
        router.currentRoute.query.filter,
    ).length
}
const readFilterValue = function (entityType, key) {
    const myFilter = filtersFromUrlStr(entityType, router.currentRoute.query.filter).find(f => {
        return f.key === key
    })
    return myFilter?.value
}

const isFilterApplied = function (entityType, key) {
    const filterValue = readFilterValue(entityType, key)
    return filterValue !== "" && filterValue !== undefined && filterValue !== null
}
const isSearchFilterApplied = function () {
    return router.currentRoute.query?.filter?.split(",")?.some(f => {
        return f.split(":")[0]?.indexOf(".search") > -1
    })
}


const updateFilter = async function (entityType, key, newValue) {
    console.log("url.updateFilter", entityType, key, newValue)
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)

    // add the new filter
    const newFilters = oldFilters.map(oldFilter => {
        const updatedValue = (oldFilter.key === key) ?
            newValue :
            oldFilter.value

        return createSimpleFilter(
            entityType,
            oldFilter.key,
            updatedValue
        )
    })

    return await pushNewFilters(newFilters)
}

const deleteFilterOption = async function (entityType, key, optionToDelete) {
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)

    const newFilters = oldFilters.map(oldFilter => {
        const newValue = (oldFilter.key === key) ?
            deleteOptionFromFilterValue(oldFilter.value, optionToDelete) :
            oldFilter.value // change nothing

        console.log("deleteFilterOption() newValue", optionToDelete, oldFilter.value, newValue)

        if (!newValue) return

        return createSimpleFilter(
            entityType,
            oldFilter.key,
            newValue
        )
    })

    return await pushNewFilters(newFilters.filter(f => !!f))
}
const addFilterOption = async function (entityType, key, optionToAdd) {
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)

    const newFilters = oldFilters.map(oldFilter => {
        const newValue = (oldFilter.key === key) ?
            addOptionToFilterValue(oldFilter.value, optionToAdd) :
            oldFilter.value // change nothing

        return createSimpleFilter(
            entityType,
            oldFilter.key,
            newValue
        )
    })

    return await pushNewFilters(newFilters)
}
const toggleFilterOptionIsNegated = async function (entityType, key, option) {
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)

    const newFilters = oldFilters.map(oldFilter => {
        const newValue = (oldFilter.key === key) ?
            toggleOptionIsNegated(oldFilter.value, option) :
            oldFilter.value // change nothing

        return createSimpleFilter(
            entityType,
            oldFilter.key,
            newValue
        )
    })

    return await pushNewFilters(newFilters)
}

const readFilterOptions =  function (entityType, key) {
    const filter = readFilter(entityType, key)
    if (!filter ) return []
    return optionsFromString(filter.value)
}

const readFilterMatchMode = function(entityType, key){
    const filter = readFilter(entityType, key)

    return getMatchModeFromSelectFilterValue(filter?.value)
}

const setFilterMatchMode = function(entityType, key, mode){
    const filter = readFilter(entityType, key)
    const options = optionsFromString(filter.value)
    const newValue = optionsToString(options, mode)
    upsertFilter(entityType, key, newValue)
}


const isGroupBy = function () {
    return !!router.currentRoute.query.group_by
}

const updateOrDeleteFilter = function (entityType, filterKey, filterValue) {
    (filterValue === "" || filterValue === "-") ?
        deleteFilter(entityType, filterKey) :
        updateFilter(entityType, filterKey, filterValue)
}

const upsertFilter = function (entityType, filterKey, filterValue) {
    return isFilterApplied(entityType, filterKey) ?
        updateOrDeleteFilter(entityType, filterKey, filterValue) :
        createFilter(entityType, filterKey, filterValue)
}



const deleteFilter = async function (entityType, key) {
    console.log("url.deleteFilter")
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)

    // add the new filter
    const newFilters = oldFilters.filter(oldFilter => {
        return oldFilter.key !== key
    })

    return await pushNewFilters(newFilters)
}

const deleteAllFilters = async function(){
    return await pushNewFilters([])
}

const makeFilterRoute = function(entityType, key, value){
    const newFilter = createSimpleFilter(entityType, key, value)
    return {
        name: "Serp",
        params: {entityType},
        query: {
            page: 1,
            sort:   router.currentRoute.query.sort,
            search:  router.currentRoute.query.search,
            filter: filtersAsUrlStr([newFilter]),
            is_list_view: router.currentRoute.query.is_list_view,
        }
    }
}

const newQueryFromFilter = function (entityType, key, value) {
    const newRoute = makeFilterRoute()
    pushToRoute(router, newRoute)
}


const setSearch = function (entityType, searchString) {
    const newRoute = {
        name: "Serp",
        params: {entityType},
        query: {
            search: searchString,
        }
    }
    pushToRoute(router, newRoute)
}


const setDefaultActions = function () {

    console.log("setDefaultActions")
    pushToRoute(router, {
        name: "Serp",
        query: {
            sort: getActionDefaultsStr("sort", router.currentRoute.query),
            column: getActionDefaultsStr("column", router.currentRoute.query),
        }
    })
}

const getActionValues = function (action) {
    const val = router.currentRoute.query[action]
    if (!val) return []

    return val?.split(",").filter(x => !!x)
}


const getActionValueKeys = function (currentRoute, action) {
    const val = currentRoute.query[action]
    if (!val) return []

    return val?.split(",").filter(x => !!x).map(val => {
        const hasColon = val.indexOf(":") > -1
        return hasColon ? val.split(":")[0] : val
    })
}

const setSort = function (filterKey) {
    if (!filterKey) {
        filterKey = getActionDefaultValues("sort", router.currentRoute.query).shift()
    }
    filterKey = filterKey + ":desc"
    pushQueryParam("sort", filterKey)
}
const getSort = function (route) {
    return route.query.sort.replace(":desc", "")
}

const toggleSort = function (filterKey) {
    const currentSort = getSort(router.currentRoute)
    if (currentSort === filterKey) {
        setSort(undefined)
    }
    else {
        setSort(filterKey)
    }
}






const setColumn = function (filterKeys) {
    pushQueryParam("column", filterKeys.join(","))
}
const addColumn = function (filterKey) {
    const extantKeys = getColumn(router.currentRoute)
    const newKeys = [...extantKeys, filterKey]
    pushQueryParam("column", newKeys.join(","))
}
const toggleColumn = function (filterKey) {
    const extantKeys = getColumn(router.currentRoute)
    let newKeys
    if (extantKeys.includes(filterKey)) {
        newKeys = extantKeys.filter(k => k !== filterKey)
    }
    else {
        newKeys = [...extantKeys, filterKey]
    }
    pushQueryParam("column", newKeys.join(","))
}
const getColumn = function (route) {
    return route.query.column.split(",")
}






const getGroupBy = function (route) {
    return route.query.group_by.split(",")
}
const setGroupBy = function (filterKeys) {
    pushQueryParam("group_by", filterKeys.join(","))
}
const addGroupBy = function (filterKey) {
    const extantKeys = getGroupBy(router.currentRoute)
    const newKeys = [...extantKeys, filterKey]
    pushQueryParam("group_by", newKeys.join(","))
}
const toggleGroupBy = function (filterKey) {
    const extantKeys = getGroupBy(router.currentRoute)
    let newKeys
    if (extantKeys.includes(filterKey)) {
        newKeys = extantKeys.filter(k => k !== filterKey)
    }
    else {
        newKeys = [...extantKeys, filterKey]
    }
    pushQueryParam("group_by", newKeys.join(","))
}










const setActionValueKeys = function (actionName, keys) {
    console.log("url.setActionValueKeys", actionName, keys)
    const actionConfig = getActionConfig(actionName)

    const keysArray = (!Array.isArray(keys)) ?
        [keys] :
        keys

    let newValues = keysArray.map(k => k + actionConfig.appendToValues)
    if (actionName === "sort" && newValues.length === 0) {
        newValues = getActionDefaultValues(actionName, router.currentRoute.query).map(v => v + actionConfig.appendToValues)
    }

    const query = {
        ...router.currentRoute.query,
        [actionName]: newValues.join(",")
    }
    console.log("url.setActionValueKeys query", query)

    pushToRoute(router, {
        name: "Serp",
        query,
    })
}

const addActionKey = function (actionName, actionKey) {
    const current = getActionValueKeys(router.currentRoute, actionName)
    console.log("addActionKey", current)
    setActionValueKeys(actionName, [...current, actionKey])

}

const deleteActionKey = function (actionName, actionKey) {
    const current = getActionValueKeys(router.currentRoute, actionName)
    console.log("deleteActionKey", actionName, actionKey)
    const newKeys = current.filter(k => k !== actionKey)
    setActionValueKeys(actionName, newKeys)

}


const setSidebar = function (id) {
    const shortId = shortenOpenAlexId(id)
    console.log("setSidebar", shortId)
    pushToRoute(router, {
        name: "Serp",
        query: {
            ...router.currentRoute.query,
            sidebar: shortId
        }
    })
}


const makeAutocompleteUrl = function (entityType, searchString) {
    const url = new URL(`https://api.openalex.org`)

    url.pathname = (entityType === null) ?
        "autocomplete" :
        `autocomplete/${entityType}`

    // url.pathname = `autocomplete/${entityType}`
    url.searchParams.set("q", searchString)
    url.searchParams.set("mailto", "team@ourresearch.org")
    return url.toString()
}

const makeApiUrl = function (currentRoute, formatCsv, groupBy) {

    const entityType = currentRoute.params.entityType
    const filtersFromUrl = filtersFromUrlStr(entityType, currentRoute.query.filter)
    const filterString = filtersAsUrlStr(filtersFromUrl)


    const query = {
        filter: filterString,
    }

    if (formatCsv) {
        query.format = "csv"
    }
    if (groupBy) {
        query.group_by = groupBy
    } else {
        query.page = currentRoute.query.page
        query.sort = currentRoute.query.sort
        query.per_page = 10
    }

    const apiUrl = new URL("https://api.openalex.org")
    apiUrl.pathname = entityType

    // list of legal keys: https://api.openalex.org/works?page=1&foo=bar
    const validQueryKeys = [
        "page",
        "filter",
        "group_by",
        "sort",
        "format",
        "per_page",
    ]
    const searchParams = new URLSearchParams()
    validQueryKeys.forEach(k => {
        if (query[k] !== undefined && query[k] !== "") {
            searchParams.set(k, query[k])
        }
    })

    apiUrl.search = decodeURIComponent(searchParams.toString())
    return apiUrl.toString()

}


const makeGroupByUrl = function (entityType, groupByKey, options) {

    // set options from defaults and args
    const defaults = {
        searchString: null,
        perPage: 200,
        formatCsv: false,
        includeEmail: true,
        filters: [],
    }
    options = Object.assign({}, defaults, options);

    // gather state from the current URL
    // const filters = filtersFromUrlStr(
    //     entityType,
    //     router.currentRoute.query.filter
    // )

    // set required params
    const url = new URL(`https://api.openalex.org`)
    url.pathname = entityType
    url.searchParams.set("group_by", groupByKey)

    // set optional params
    url.searchParams.set("per_page", String(options.perPage))
    if (options.searchString) url.searchParams.set("q", options.searchString)
    if (options.formatCsv) url.searchParams.set("format", "csv");
    if (options.includeEmail) url.searchParams.set("mailto", "team@ourresearch.org")

    // we have to do it hacky like this because searchParams.set() will urlencode
    // special within-filter symbols like + and !
    if (options.filters.length > 0) {
        url.search = url.search + "&filter=" + filtersAsUrlStr(options.filters)
    }


    // all done
    return url.toString()
}


const url = {
    pushToRoute,
    addToQuery,

    createFilter,
    readFilter,
    readFiltersLength,
    isSearchFilterApplied,
    readFilterValue,
    readFilterOptions,
    readFilterMatchMode,

    isFilterApplied,
    updateFilter,
    deleteFilter,
    deleteAllFilters,
    upsertFilter,
    setFilterMatchMode,
    makeFilterRoute,


    deleteFilterOption,
    addFilterOption,
    toggleFilterOptionIsNegated,

    setDefaultActions,
    getActionValues,
    getActionValueKeys,
    setActionValueKeys,
    addActionKey,
    deleteActionKey,

    setSort,
    setGroupBy,
    toggleGroupBy,
    setColumn,
    addColumn,
    toggleColumn,

    getSort,
    toggleSort,
    getGroupBy,
    getColumn,
    addGroupBy,


    setSidebar,


    setSearch,
    setPage,

    isGroupBy,


    makeGroupByUrl,
    makeAutocompleteUrl,

    makeApiUrl,
    setShowApi,

    pushQueryParam,
}


export {
    url,
}