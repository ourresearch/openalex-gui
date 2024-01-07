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
import {createFilterId, createSimpleFilterFromPid} from "./filterConfigs";

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
import {getEntityConfig} from "@/entityConfigs";

Vue.use(AsyncComputed)


Vue.filter("idLink", function (fullId) {
    if (!fullId) return
    const shortId = fullId.replace("https://openalex.org/", "")
    const myEntityType = entityTypeFromId(shortId)
    return `/${myEntityType}/${shortId}`
})

Vue.filter("entityWorksLink", function (id) {
    if (!id) return
    const myEntityType = entityTypeFromId(id)
    const shortId = shortenOpenAlexId(id)
    const filterKey = getEntityConfig(myEntityType)?.filterKey

    return {
        name: "Serp",
        params: {
            entityType: "works",
        },
        query: {
            filter: createFilterId(filterKey, shortId)
        }
    }
})



Vue.filter("entityZoomLink", function (id) {
    if (!id) return
    const entityId = shortenOpenAlexId(id)
    const entityType = entityTypeFromId(entityId)
    return {
        name: "EntityPage",
        params: {
            entityType,
            entityId,
        },
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
    return _.capitalize(str)
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
