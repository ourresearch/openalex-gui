import Vue from 'vue'
import Vuex from 'vuex'
import router from "../router";

import {api} from "../api";

Vue.use(Vuex)

const allEntityTypes = function (hideThese) {
    const types = ["works", "authors", "institutions", "venues", "concepts"]
    if (hideThese) {
        if (!Array.isArray(hideThese)) hideThese = [hideThese]
        return types.filter(e => {
            return hideThese.indexOf(e) > -1
        })
    } else {
        return types
    }
}

const deepClone = function (obj) {
    return JSON.parse(JSON.stringify(obj))
}

const filterConfigsList = function () {
    const ret = [
        {
            key: "display_name.search",
            entityTypes: allEntityTypes(),
            displayName: "Name",
        },
        {
            key: "x-concepts.id",
            entityTypes: ["authors", "institutions", "venues"],
            displayName: "Concepts",
        },
        {
            key: "concept.id",
            entityTypes: ["works"],
            displayName: "Concepts",
        },
        {
            key: "host_venue.id",
            entityTypes: ["works"],
            displayName: "Venues",
        },
    ]
    return ret.map(config => {
        return {
            ...config,
            count: null,
            value: null,
            isApplied: null,
        }
    })
}

const createFilter = function ({key, value, count, isApplied}) {
    const ret = filterConfigsList().find(f => f.key === key)
    console.log("createFilter ret", ret, key, value)
    ret.value = value
    ret.count = count
    ret.isApplied = isApplied
    return ret
}

const sortConfigs = [
    {
        key: "cited_by_count",
        displayName: "Citations",
    },
    {
        // only for non-work entities
        key: "works_count",
        displayName: "Works",
    },
    {
        // only for works
        key: "publication_date",
        displayName: "Date",
    },
    {
        // only if there's a text search on
        key: "relevance_score",
        displayName: "Relevance",
    },
]


const stateDefaults = function () {
    const filterValues = {}
    filterConfigsList().forEach(config => {
        filterValues[config.key] = undefined
    })

    const ret = {
        entityType: null,
        filters: filterValues,
        filtersList: [],
        groupBys: [],
        page: 1,
        results: [],
        sort: null,
        responseTime: 0,
        resultsCount: 0,
        isLoading: false,
    }

    return ret
}


export default new Vuex.Store({
    // state: stateDefaults(),
    state: stateDefaults(),
    mutations: {
        // eslint-disable-next-line no-unused-vars
        resetSearch(state) {
            const defaults = stateDefaults()
            Object.keys(defaults).forEach(k => {
                state[k] = defaults[k]
            })
        },
        setEntityType(state, entityType) {
            state.entityType = entityType;
        },
        setPage(state, page) {
            const pageInt = parseInt(page)
            state.page = (isNaN(pageInt)) ? 1 : pageInt
        },
        setSort(state, sortKey) {
            // if we don't recognize this key, set it to the default
            if (!sortConfigs.some(c => c.key === sortKey)) {
                sortKey = "cited_by_count"
            }
            state.sort = sortKey
        },
        addFilters(state, newFilters) {
            Object.assign(state.filters, newFilters)
        },
        addFilter(state, {key, value, count, isApplied}) {
            // first, check: is there another filter loaded that has this exact same key and value?
            const filterAlreadyLoaded = state.filtersList.some(f => {
                    return f.key === key && f.value === value
                })
            if (filterAlreadyLoaded) return

            const newFilter = createFilter({key, value, count, isApplied})

            console.log("addFilter, pushing this new filter", newFilter, key, value)
            state.filtersList.push(newFilter)
        },
        setFiltersFromString(state, filtersString) {
            if (!filtersString) return
            if (filtersString.indexOf(":") === -1) return
            filtersString.split(",").forEach(filterString => {
                const [key, value] = filterString.split(":");
                state.filters[key] = value
            })
        },

    },
    actions: {
        // this is an sync functino, even though it's in actions, because it needs to call mutations
        // eslint-disable-next-line no-unused-vars
        applyFiltersFromString({commit, getters, dispatch, state}, filtersString) {
            if (!filtersString) return
            if (filtersString.indexOf(":") === -1) return
            filtersString.split(",").forEach(filterString => {
                const [key, value] = filterString.split(":");

                commit("addFilter", {key, value, isApplied: true})
            })
        },

        // eslint-disable-next-line no-unused-vars
        async doTextSearch({commit, getters, dispatch, state}, {entityType, searchString}) {
            commit("setPage", 1)
            state.entityType = entityType
            commit("addFilters", {"display_name.search": searchString});
            await dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async setSort({commit, getters, dispatch, state}, newSortValue) {
            state.sort = newSortValue
            commit("setPage", 1)
            await dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async setPage({commit, getters, dispatch, state}, newPage) {
            commit("setPage", newPage)
            await dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async addFilter({commit, getters, dispatch, state}, newFilter) {
            commit("setFilters", newFilter)
            await dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async doSearch({commit, getters, dispatch, state}, loadFromRoute) {
            state.isLoading = true
            if (loadFromRoute) {
                state.entityType = router.currentRoute.params.entityType
                commit("setPage", router.currentRoute.query.page)
                commit("setSort", router.currentRoute.query.sort)
                commit("setFiltersFromString", router.currentRoute.query.filter)
                dispatch("applyFiltersFromString", router.currentRoute.query.filter)
            }

            const routerPushTo = {
                query: getters.searchQuery,
                name: "Serp",
                params: {entityType: state.entityType},
            };
            router.push(routerPushTo)
                .catch((e) => {
                    if (e.name !== "NavigationDuplicated") {
                        throw e
                    }
                })

            try {
                const resp = await api.get(state.entityType, getters.searchQuery)
                state.results = resp.results
                state.responseTime = resp.meta.db_response_time_ms
                state.resultsCount = resp.meta.count

            } finally {
                state.isLoading = false
            }


            state.groupBys = []
            const filtersToGroupBy = filterConfigsList()
                .filter(config => {
                    return config.entityTypes.indexOf(state.entityType) > -1
                })
                .filter(config => {
                    return config.key.indexOf(".search") === -1
                })

            for (let i = 0; i < filtersToGroupBy.length; i++) {
                const config = filtersToGroupBy[i]
                console.log("doing groupby query", config)
                const resp = await api.get(state.entityType, getters.groupByQuery(config.key))
                state.groupBys.push({
                    dimensionKey: config.key,
                    dimensionDisplayName: config.displayName,
                    groups: [],
                    // groups: await Promise.all(resp.group_by.slice(0, 5).map(async group => {
                    //     const resp = await api.get(group.key)
                    //     const display_name = resp.display_name
                    //
                    //     return {
                    //         ...group,
                    //         display_name
                    //     }
                    // })),
                })

            }
        }
    },
    getters: {
        sortObjectOptions(state, getters) {
            if (!state.results.length) return
            return sortConfigs.filter(sortOption => {
                return sortOption.key in state.results[0]
            })
        },
        sortObject(state, getters) {
            return sortConfigs.find(sortOption => {
                return sortOption.key === state.sort
            })
        },
        searchQuery(state, getters) {
            const query = {
                page: state.page
            }
            if (getters.filtersAsString) query.filter = getters.filtersAsString
            if (state.sort) query["sort"] = state.sort + ":desc"
            return query
        },
        groupByQuery: (state, getters) => (key) => {
            const query = {}
            if (getters.filtersAsString) query.filter = getters.filtersAsString
            query.group_by = key
            console.log("groupBy query", query)
            return query
        },
        searchApiUrl(state, getters) {
            return api.getUrl(state.entityType, getters.searchQuery)
        },

        searchTerm(state) {
            state.filters.find(f => f.id === "display_name").value
        },
        entityTypeAsPath(state) {
            return `/${state.entityType}`
        },


        // todo this should work differently and have a better name
        filtersAsArray(state) {
            const filtersAsArray = Object.entries(state.filters)
                .map(([k, v]) => {
                    return {key: k, value: v}
                })

            filtersAsArray.sort((a, b) => {
                return a.key > b.key
            })

            return filtersAsArray
                .filter(f => {
                    return typeof f.value !== "undefined"
                })
        },

        filtersAsString(state, getters) {
            return getters.filtersAsArray
                .map(f => {
                    return `${f.key}:${f.value}`
                })
                .join(",")
        },

        filterObjects(state) {
            return filterConfigsList()
                .filter(config => {
                    return config.entityTypes.indexOf(state.entityType)
                })
                .map(config => {
                    console.log("filterObjects.map()", state.filters, config.key)
                    return {
                        ...config,
                        value: state.filters[config.key]
                    }
                })
        },

    },
    modules: {}
})
