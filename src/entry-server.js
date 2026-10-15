// oxjob #1689 SSR spike: server entry. Renders the existing App + router + store
// for one URL to an HTML string. Record data is fetched outside Vue and seeded
// into api.js's cache, so the render itself does no network I/O.
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createServerHead } from '@unhead/vue';
import { renderSSRHead } from '@unhead/ssr';

import App from './App.vue';
import { createMemoryHistory } from 'vue-router';
import { createAppRouter } from './router';
import { createAppStore } from './store';
import { makeVuetify } from './plugins/vuetify';
import { api } from './api';

export async function render(url, { seed = {}, collectComponents = null } = {}) {
  for (const [apiUrl, data] of Object.entries(seed)) api.seedCache(apiUrl, data);

  // One store and one router per request: module singletons would leak state
  // between visitors and race when two requests render at once.
  const store = createAppStore();
  const router = createAppRouter({ store, history: createMemoryHistory() });
  const app = createSSRApp(App);
  app.use(router);
  app.use(store);
  // Head BEFORE Vuetify: Vuetify's theme pushes its CSS variables into the head
  // only if a head manager is already installed (else the SSR page has no theme CSS).
  const head = createServerHead();
  app.use(head);
  app.use(makeVuetify({ ssr: true }));
  app.config.globalProperties.config = {};
  // Spike diagnostics: record every component instance created during the render.
  if (collectComponents) {
    app.mixin({ beforeCreate() { const o = this.$options; collectComponents.push(o.__file || o.name || o.__name || '(anonymous)'); } });
  }

  await router.push(url);
  await router.isReady();

  const ctx = {};
  const html = await renderToString(app, ctx);
  const headTags = await renderSSRHead(head);
  return { html, headTags, state: JSON.parse(JSON.stringify(store.state)), seed };
}

export { api };

// The api.js cache as plain JSON (spike: everything cached so far).
export const apiCacheSnapshot = () => api.cacheSnapshot();
