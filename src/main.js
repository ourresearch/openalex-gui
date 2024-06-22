import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import VueMeta from "vue-meta";
import VScrollLock from "v-scroll-lock";
import millify from "millify";
import {idsAreEqual, setOrDelete, shortenOpenAlexId} from "./util";
import {url} from "./url"
import sanitizeHtml from 'sanitize-html';
import {prettyTitle, toPrecision, entityTypeFromId} from "./util";
import {createSimpleFilter} from "./filterConfigs";

import _ from 'lodash'


import {
    filtersAsUrlStr,
} from "./filterConfigs";

Vue.config.productionTip = false
Vue.prototype.$prettyTitle = prettyTitle

// we have to globally register this or it throws errors.
// https://stackoverflow.com/a/58875919
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

import VueShortkey from 'vue-shortkey'

Vue.use(VueShortkey)

import AsyncComputed from 'vue-async-computed'
import {entityConfigs, urlPartsFromId} from "@/entityConfigs";

Vue.use(AsyncComputed)


Vue.filter("entityWorksLink", function (id) {
    const entityType = entityTypeFromId(id)
    if (!id || !entityType) return
    const idForFilter = shortenOpenAlexId(id)


    const filter = createSimpleFilter(
        "works",
        entityConfigs[entityType].filterKey,
        idForFilter,
    )
    return {
        name: "Serp",
        params: {entityType: "works"},
        query: {filter: filter.asStr},
    }

})


Vue.filter("entityZoomLink", function (id) {
    if (!id) return
    const shortId = shortenOpenAlexId(id)
    const idEntityType = entityTypeFromId(id)
    const newQuery = url.addToQuery(router.currentRoute.query, "zoom", shortId)
    const params = {...router.currentRoute.params}
    // console.log("entityZoomLink", params)

    if (router.currentRoute.name === "Serp" && idEntityType === "works") {
        return {
            name: "Serp",
            params,
            query: newQuery,
        }
    }
    else {
        return {
        name: "EntityPage",
        params: urlPartsFromId(id)
    }
    }
});


Vue.filter("zoomLink", function (fullId) {
    if (!fullId) return

    const zoomIds = router.currentRoute.query.zoom?.split(",") ?? []
    zoomIds.push(shortId)

    const newQuery = url.addToQuery(router.currentRoute.query, "zoom", zoomIds.join())

    return {
        name: "Serp",
        query: newQuery,
    }

});


Vue.filter("toPrecision", function (number, precision = 4) {
    return toPrecision(number, precision)
});


Vue.filter("capitalize", function (str) {
    if (typeof str !== "string") return str
    const firstLetter = str[0]
    return firstLetter.toUpperCase() + str.substring(1)
});


Vue.filter("prettyName", function (name) {
    let ret = name
        .replace("ieee", "IEEE")
        .replace("United States of America", "United States")
        .replace("United Kingdom of Great Britain and Northern Ireland", "United Kingdom")

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
            lowercase: false,
        }
    )
})

Vue.use(vuetify)

new Vue({
    router,
    store,
    vuetify,
    render: h => h(App)
}).$mount('#app')
