import { createApp } from 'vue';
import { createHead } from '@unhead/vue';
import VScrollLock from 'v-scroll-lock';
import { createAppRouter } from './router';
import { getAppStore } from './store';
const store = getAppStore();
const router = createAppRouter();
import vuetify from './plugins/vuetify';
import 'vuetify/styles'
import './styles/tokens.css'  // OpenAlex design tokens (oxjob #249) — load after Vuetify base styles


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

// Sentry (oxjob #860, bundle diet): ~29 KB gz that nothing on the first paint
// needs. Initialised from its own chunk right after mount — the Vue
// integration attaches to app.config.errorHandler late just as well; errors in
// the first few hundred ms fall back to tracking.setupJavaScriptErrorTracking().
// Scheduled after window `load` + a 1.5 s breather: on a cold load the 119 KB
// Sentry chunk otherwise downloads right after mount, competing for bandwidth
// with /users/me and the page's own first query (measured #860 bench-pw).
// No personal data by default (no visitor IPs), and API keys filtered out of recorded URLs (oxjob #1479).
const initSentry = () => Promise.all([import("@sentry/vue"), import("@/sentryScrub")]).then(([Sentry, scrub]) => {
  Sentry.init({
    app,
    // Project openalex-gui in the openalex-u3 org (oxjob #1685). A browser DSN is public by design.
    dsn: "https://db1c393aec6e9b2a1632747abe5900f5@o4512257233649664.ingest.us.sentry.io/4512257301807104",
    environment: location.hostname === "openalex.org" ? "production" : "development",
    sendDefaultPii: false,
    beforeBreadcrumb: scrub.scrubBreadcrumb,
    beforeSend: scrub.scrubEvent,
  });
});
const scheduleSentry = () => setTimeout(initSentry, 1500);
if (document.readyState === "complete") scheduleSentry();
else window.addEventListener("load", scheduleSentry, { once: true });

// UI-provenance token (oxjob #338 Phase 5a): mint an unforgeable "real GUI"
// marker for OpenAlex API calls, replacing the spoofable mailto. Fire-and-
// forget — never blocks startup; absence just means requests are tagged
// untrusted server-side (the API never gates on it).
import('@/uiProvenance').then(({ initUiProvenance }) => initUiProvenance());

// Live entity counts for the search placeholder (#598 r5). Fire-and-forget.
import('@/entityCounts').then(({ fetchEntityCounts }) => fetchEntityCounts());

// Live refresh of the /meta catalog that entity/facet labels derive from
// (oxjob #424). Fire-and-forget — the committed snapshot already seeded it.
import('@/metaCatalog').then(({ fetchMetaCatalog }) => fetchMetaCatalog());
