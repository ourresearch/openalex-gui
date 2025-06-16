import { createApp } from 'vue';
import { createHead } from '@unhead/vue';
import VScrollLock from 'v-scroll-lock';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import 'vuetify/styles'

import * as Sentry from "@sentry/vue";

import { navigation } from './navigation';
import tracking from './tracking';

import App from './App.vue';

// Setup error tracking before app creation
tracking.setupJavaScriptErrorTracking();

// Set router for navigation helpers
navigation.setRouter(router);

const app = createApp(App);

Sentry.init({
  app,
  dsn: "https://fb8a98f98b30ac77643b286fc1842ba9@o4505840077701120.ingest.us.sentry.io/4509509908299776",
  sendDefaultPii: true
});

// Register plugins
app.use(router);
app.use(store);
app.use(vuetify);
const head = createHead();
app.use(head);
app.use(VScrollLock);

// Provide config if needed (Vue 3 provides/injects or globalProperties)
app.config.globalProperties.config = {};

// Expose the app to the window for debugging
window.OpenAlex = app;

app.mount('#app');
