// main.ts

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Plugins
import { createHead } from '@unhead/vue'; // Replacement for vue-meta in Vue 3
import VScrollLock from 'v-scroll-lock';
import millify from 'millify';
import FlagIcon from 'vue-flag-icon';
import VuePluralize from 'vue-pluralize';

import pluralize from 'pluralize';


import VueShortkey from 'vue-shortkey';
import AsyncComputed from 'vue-async-computed';

// Utilities
import { shortenOpenAlexId } from './util';
import { url } from './url';
import { prettyTitle, toPrecision, entityTypeFromId } from './util';
import { createSimpleFilter, } from './filterConfigs';
import { entityConfigs, urlPartsFromId } from '@/entityConfigs';
import _ from 'lodash';

// Vuetify instance
const vuetify = createVuetify({
  components,
  directives,
});

// Vue app instance
const app = createApp(App);

// Set up plugins
const head = createHead();
app.use(head);
app.use(router);
app.use(store);
app.use(vuetify);
app.use(VScrollLock);
app.use(FlagIcon);
// app.use(VuePluralize);
app.use(VueShortkey);
app.use(AsyncComputed);

// Add global properties (previously filters and prototype properties)
app.config.globalProperties.$prettyTitle = prettyTitle;

// Define functions to replace the removed filter functionality
app.config.globalProperties.$entityWorksLink = function (id: string) {
  const entityType = entityTypeFromId(id);
  if (!id || !entityType) return;
  const idForFilter = shortenOpenAlexId(id);

  const filter = createSimpleFilter(
    'works',
    entityConfigs[entityType].filterKey,
    idForFilter,
  );
  return {
    name: 'Serp',
    params: { entityType: 'works' },
    query: { filter: filter.asStr },
  };
};

app.config.globalProperties.$entityZoomLink = function (id: string) {
  if (!id) return;
  const shortId = shortenOpenAlexId(id);
  const idEntityType = entityTypeFromId(id);
  const newQuery = url.addToQuery(router.currentRoute.value.query, 'zoom', shortId);
  const params = { ...router.currentRoute.value.params };

  if (router.currentRoute.value.name === 'Serp' && idEntityType === 'works') {
    return {
      name: 'Serp',
      params,
      query: newQuery,
    };
  } else {
    return {
      name: 'EntityPage',
      params: urlPartsFromId(id),
    };
  }
};

app.config.globalProperties.$pluralize = pluralize;

app.config.globalProperties.$zoomLink = function (fullId: string) {
  if (!fullId) return;
  const shortId = shortenOpenAlexId(fullId);
  const zoomIds = router.currentRoute.value.query.zoom?.split(',') ?? [];
  zoomIds.push(shortId);

  const newQuery = url.addToQuery(router.currentRoute.value.query, 'zoom', zoomIds.join());

  return {
    name: 'Serp',
    query: newQuery,
  };
};

app.config.globalProperties.$toPrecision = function (number: number, precision = 4): string {
  return toPrecision(number, precision);
};

app.config.globalProperties.$capitalize = function (str: string): string {
  if (typeof str !== 'string') return str;
  const firstLetter = str[0];
  return firstLetter.toUpperCase() + str.substring(1);
};

app.config.globalProperties.$prettyName = function (name: string): string {
  let ret = name
    .replace('ieee', 'IEEE')
    .replace('United States of America', 'United States')
    .replace('United Kingdom of Great Britain and Northern Ireland', 'United Kingdom');

  const typeRe = /[a-z]+-[a-z]+/;
  if (typeRe.test(ret)) ret = ret.replace('-', ' ');

  return ret;
};

app.config.globalProperties.$idApiUrl = function (fullId: string): string | void {
  if (!fullId) return;
  const shortId = fullId.replace('https://openalex.org/', '');
  return `https://api.openalex.org/${shortId}`;
};

app.config.globalProperties.$millify = function (number: number): string {
  return millify(number, {
    precision: 0,
    lowercase: false,
  });
};

// Mount the app
app.mount('#app');
