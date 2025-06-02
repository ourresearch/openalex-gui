import Vue from 'vue'
import _ from 'lodash'
import VueMeta from "vue-meta";
import VScrollLock from "v-scroll-lock";
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'

import { navigation } from './navigation';
import tracking from "./tracking";

import App from './App.vue'


Vue.config.productionTip = false;

// we have to globally register this or it throws errors.
// https://stackoverflow.com/a/58875919
Vue.use(VueMeta, {
    refreshOnceOnNavigation: true
});
Vue.use(VScrollLock);

import AsyncComputed from 'vue-async-computed';
Vue.use(AsyncComputed);


Vue.use(vuetify);

tracking.setupJavaScriptErrorTracking();

navigation.setRouter(router);

const vm = new Vue({
    router,
    store,
    vuetify,
    render: h => h(App),
    data: {
        config: {}
    }
});

// Expose the app to the window for debugging
window.OpenAlex = vm;

vm.$mount('#app');
