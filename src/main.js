import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import VueMeta from "vue-meta";

Vue.config.productionTip = false

Vue.use(VueMeta, {
    refreshOnceOnNavigation: true
})


Vue.filter("idLink", function (fullId) {
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

new Vue({
    router,
    store,
    vuetify,
    render: h => h(App)
}).$mount('#app')
