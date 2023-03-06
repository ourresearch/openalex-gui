import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import VueMeta from "vue-meta";
import VScrollLock from "v-scroll-lock";
import millify from "millify";
import {idsAreEqual, setOrDelete} from "./util";
import {url} from "./url"
import SearchBox from "./components/SearchBox";
import sanitizeHtml from 'sanitize-html';
import {prettyTitle, toPrecision} from "./util";

import _ from 'lodash'

import {
    filtersFromUrlStr,
    filtersAsUrlStr,
} from "./filterConfigs";

Vue.config.productionTip = false
Vue.prototype.$prettyTitle = prettyTitle

// we have to globally register this or it throws errors.
// https://stackoverflow.com/a/58875919
Vue.component("SearchBox", SearchBox)
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
        "S": "sources",
        "A": "authors",
        "C": "concepts",
    };
    const myEntityType = entityTypes[shortIdFirstLetter]
    return `/${myEntityType}/${shortId}`
})


Vue.filter("entityZoomLink", function (id) {
    if (!id) return
    const shortId = id.replace("https://openalex.org/", "")
    return {
        name: "entity-zoom",
        params: {
            entityType: router.currentRoute.params.entityType,
            id: shortId,
        },
        query: {...router.currentRoute.query},
    }

});


Vue.filter("zoomLink", function (fullId) {
    if (!fullId) return
    const shortId = fullId.replace("https://openalex.org/", "")

    const zoomIds = router.currentRoute.query.zoom?.split(",") ?? []
    zoomIds.push(shortId)

    const newQuery = url.addToQuery(router.currentRoute.query, "zoom", zoomIds.join())

    return {
        name: "Serp",
        query: newQuery,
    }

});





Vue.filter("toPrecision", function (number, precision = 5) {
    return toPrecision(number, precision)
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
            lowercase: true,
        }
    )
})

new Vue({
    router,
    store,
    vuetify,
    render: h => h(App)
}).$mount('#app')
