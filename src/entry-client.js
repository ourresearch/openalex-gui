// oxjob #1689 SSR spike: client entry that HYDRATES the server HTML instead of
// mounting fresh (main.js, unchanged, still does createApp + mount for prod).
import { createSSRApp } from 'vue';
import { createHead } from '@unhead/vue';
import VScrollLock from 'v-scroll-lock';
import 'vuetify/styles';
import './styles/tokens.css';

import App from './App.vue';
import router from './router';
import store from './store';
import { makeVuetify } from './plugins/vuetify';
import { api } from './api';
import { navigation } from './navigation';
import { isHydrating } from './ssrSafe';

// Seed api.js's cache with the responses the server rendered from, so the
// first client render (the hydration pass) sees the same data synchronously.
for (const [u, d] of Object.entries(window.__API_CACHE__ || {})) api.seedCache(u, d);

// Collect hydration warnings and report them to the spike server.
const report = { warnings: [], errors: [] };
const app = createSSRApp(App);
app.config.warnHandler = (msg, instance, trace) => {
  report.warnings.push({ msg, trace });
  console.warn('[Vue warn]', msg, trace);
};
app.config.errorHandler = (err, instance, info) => {
  report.errors.push({ msg: String(err?.message || err), info, stack: err?.stack });
  console.error(err);
};
window.addEventListener('error', (e) => report.errors.push({ msg: 'window.onerror: ' + e.message }));
const origConsoleError = console.error;
console.error = (...args) => { report.errors.push({ msg: 'console.error: ' + args.map(String).join(' ').slice(0, 500) }); origConsoleError(...args); };

navigation.setRouter(router);
app.use(router);
app.use(store);
app.use(createHead());
app.use(makeVuetify({ ssr: true }));
app.use(VScrollLock);
app.config.globalProperties.config = {};
window.OpenAlex = app;

const serverHtml = document.getElementById('app').innerHTML;
isHydrating.value = true;
const initialPath = location.pathname;
const initialLoggedIn = !!localStorage.getItem('token');
router.isReady().then(() => {
  const t0 = performance.now();
  app.mount('#app');
  const hydrateMs = performance.now() - t0;
  // Hydrated as logged out (like the server); now show the returning user.
  isHydrating.value = false;
  store.dispatch('user/restoreUserFromCache');
  // Interactivity check: after hydration, click the "Locations" tab (works) and
  // see whether the app reacts (the tab writes ?tab=locations to the URL).
  const tab = [...document.querySelectorAll('.v-tab')].find((b) => b.textContent.trim() === 'Locations');
  let clickResult = null;
  if (tab) setTimeout(() => { tab.click(); setTimeout(() => { clickResult = location.search; }, 300); }, 800);
  setTimeout(() => {
    const el = document.getElementById('app');
    report.locationsTabClickedUrlSearch = clickResult;
    report.loggedInSim = initialLoggedIn;
    report.groupByText = [...el.querySelectorAll('.entity-metrics-block ~ *')].map((n) => n.innerText.slice(0, 120));
    fetch('/__hydration-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: initialPath + (initialLoggedIn ? '-loggedin' : ''),
        pathAfter: location.pathname,
        hydrateMs,
        serverHtmlBytes: serverHtml.length,
        clientHtmlBytesAfter2s: el.innerHTML.length,
        titleAfter: document.title,
        h1ish: el.querySelector('.entity-page')?.innerText?.slice(0, 300) || null,
        ...report,
      }),
    });
  }, 2000);
});
