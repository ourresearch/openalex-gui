import { createApp } from 'vue';
import { createHead } from '@unhead/vue';
import VScrollLock from 'v-scroll-lock';
import router from './router';
import store from './store';

// Tailwind CSS
import './assets/css/tailwind.css'

import * as Sentry from "@sentry/vue";

import { navigation } from './navigation';
import tracking from './tracking';

import App from './App.vue';

// Suppress ResizeObserver error - this is a benign browser timing issue
// that occurs when menus open/close while layout is changing
const resizeObserverErr = window.console.error;
window.console.error = (...args) => {
  if (args[0]?.toString().includes('ResizeObserver loop')) {
    return;
  }
  resizeObserverErr(...args);
};

// Patch ResizeObserver to catch the error at source
const OriginalResizeObserver = window.ResizeObserver;
window.ResizeObserver = class extends OriginalResizeObserver {
  constructor(callback) {
    super((entries, observer) => {
      try {
        callback(entries, observer);
      } catch (e) {
        if (e.message?.includes('ResizeObserver loop')) {
          // Suppress this specific error
          return;
        }
        throw e;
      }
    });
  }
};

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
const head = createHead();
app.use(head);
app.use(VScrollLock);

// Provide config if needed (Vue 3 provides/injects or globalProperties)
app.config.globalProperties.config = {};

// Expose the app to the window for debugging
window.OpenAlex = app;

app.mount('#app');
