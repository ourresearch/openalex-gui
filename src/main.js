import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import VueMeta from "vue-meta";
import VScrollLock from "v-scroll-lock";
import millify from "millify";
import {idsAreEqual, setOrDelete} from "./util";
import _ from 'lodash'

import {
    filtersFromUrlStr,
    filtersAsUrlStr,
    removeFilterFromUrlStr,
} from "./filterConfigs";

Vue.config.productionTip = false

Vue.use(VueMeta, {
    refreshOnceOnNavigation: true
})
Vue.use(VScrollLock)

const VueTruncate = require('vue-truncate-filter')
Vue.use(VueTruncate)

import FlagIcon from 'vue-flag-icon'
Vue.use(FlagIcon);

import VuePluralize from 'vue-pluralize'
Vue.use(VuePluralize)



Vue.filter("idLink", function (fullId) {
    if (!fullId) return
    const shortId = fullId.replace("https://openalex.org/", "")
    const shortIdFirstLetter = shortId.substr(0, 1).toUpperCase()
    const entityTypes = {
        "W": "works",
        "I": "institutions",
        "V": "venues",
        "A": "authors",
        "C": "concepts",
    };
    const myEntityType = entityTypes[shortIdFirstLetter]
    return `/${myEntityType}/${shortId}`
})



Vue.filter("zoomLink", function (fullId) {
    if (!fullId) return
    const shortId = fullId.replace("https://openalex.org/", "")



    const url = new URL(window.location.href)
    const paramsDict = Object.fromEntries(new URLSearchParams(location.search))
    const zoomIds = paramsDict.zoom?.split(",") ?? []

    // const firstInstanceIndex = zoomIds.findIndex(id => idsAreEqual(id, shortId))
    // if (firstInstanceIndex > -1) {
    //     zoomIds.splice(firstInstanceIndex, 9999999999)
    // }
    zoomIds.push(shortId)
    paramsDict.zoom = zoomIds.join(",")
    const queryString = Object.entries(paramsDict).map(([k, v]) => `${k}=${v}`).join("&")
    url.search = "?" + queryString
    return [url.path, queryString].join("?")
});


Vue.filter("linkRemoveFilter", function (filterObject) {
    if (!filterObject) return
    const newFiltersStr = removeFilterFromUrlStr(router.currentRoute.query.filter, filterObject)
    const newQuery = {...router.currentRoute.query}
    setOrDelete(newQuery, "filter", newFiltersStr)
    delete newQuery.page
    const ret = {
        name: "Serp",
        query: newQuery,
    }
    return ret
});


Vue.filter("addFilterLink", function (newFilter) {
    console.log("addFilterLink", newFilter)
    if (!newFilter.key) return

    const query = {...router.currentRoute.query}
    const filters = filtersFromUrlStr(query.filter)
    filters.push(newFilter)
    query.filter = filtersAsUrlStr(filters)
    delete query.zoom

    return {
        name: "Serp",
        query,
    }

});





Vue.filter("prettyName", function (name) {
    let ret = name
        .replace("ieee", "IEEE")
        .replace("United States of America", "USA")
        .replace("United Kingdom of Great Britain and Northern Ireland", "UK")

    // make "journal-article" into Journal Article
    const typeRe = /[a-z]+-[a-z]+/
    if (typeRe.test(ret)) ret = ret.replace("-", " ")

    return ret
})


Vue.filter("idApiUrl", function (fullId) {
    if (!fullId) return
    const shortId = fullId.replace("https://openalex.org/", "")
    return `https://api.openalex.org/${shortId}`
})
Vue.filter("millify", function (number) {
    return millify(
        number,
        {
            precision: 0,
        }
    )
})

new Vue({
    router,
    store,
    vuetify,
    render: h => h(App)
}).$mount('#app')
