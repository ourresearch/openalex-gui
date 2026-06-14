<template>
  <div style="min-height: 80vh">
    <oql-serp v-if="oqlFlag" :results-object="resultsObject" :search-error="searchError" />
    <expert-serp v-else :results-object="resultsObject" :search-error="searchError" />
  </div>
</template>

<script setup>
import _ from 'lodash';
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

import { url } from '@/url';
import { api } from '@/api';
import { entityConfigs } from '@/entityConfigs';
import { filtersFromUrlStr } from '@/filterConfigs';

import ExpertSerp from '@/components/ExpertSerp.vue';
import OqlSerp from '@/components/OqlSerp.vue';

defineOptions({ name: 'Serp' });

const store = useStore();
const route = useRoute();
const router = useRouter();

// Data
const resultsFilters = ref([]);
const resultsObject = ref(null);
const searchError = ref(null);

// On the entity-typed `/:entityType` route the entity comes from the path. On the
// entity-less `/q` OQL route there is no path entity — the OQL declares it — so we
// derive it from the executed response (`meta.x_query.oqo.get_rows`, authoritative),
// falling back to the OQL's leading token for first paint (before the response
// lands), then 'works'. This is the single source feeding `store.state.entityType`,
// which every SERP/OQL component reads via the `entityType` getter. (oxjob #373 Phase 2)
const entityFromOql = (oql) => {
  const first = String(oql || '').trim().split(/[\s(]/)[0];
  return entityConfigs[first] ? first : null;
};
const effectiveEntityType = computed(() => {
  if (route.params.entityType) return route.params.entityType;
  const fromResponse = resultsObject.value?.meta?.x_query?.oqo?.get_rows;
  if (fromResponse && entityConfigs[fromResponse]) return fromResponse;
  return entityFromOql(route.query.oql) || 'works';
});
const selectedEntityType = effectiveEntityType;
const selectedEntityTypeConfig = computed(() => entityConfigs[selectedEntityType.value]);

useHead({
  title: computed(() => _.capitalize(selectedEntityTypeConfig.value.displayName) + ' search'),
});

const userId = computed(() => store.getters['user/userId']);
const userSavedSearches = computed(() => store.getters['user/userSavedSearches']);
const oqlFlag = computed(() => !!store.getters.featureFlags['oql']);

// Opaque short URL (oxjob #464). After a long-form query renders we mint a short
// id in the background and `replaceState` the address bar to `/q/:id`. That
// replace re-fires the fetch watcher onto the `/q/:shortid` branch; this ref lets
// that branch recognize the id it JUST minted and skip a redundant resolve+execute
// (the results are already in hand).
const lastMintedShortId = ref(null);

// Background-mint the just-executed query to an opaque `/q/:id` and swap the URL.
// Best-effort: any failure leaves the long URL untouched (degrade prettiness, not
// correctness). Never minted when we're already on a `/q/:shortid` route.
const maybeMintShortQuery = async (resp, fromRoute) => {
  if (!oqlFlag.value) return;            // gated to the OQL cohort during rollout
  if (fromRoute.params.shortid) return;  // already opaque — nothing to upgrade
  const rawOqo = resp?.meta?.x_query?.oqo;
  if (!rawOqo || !Object.keys(rawOqo).length) return;  // non-OQO-expressible
  // The minted id is the QUERY's identity — strip VIEW-layer state so paging
  // never fragments dedup (oxjob #464: page/per_page/cursor/seed are view chrome,
  // not the query). The legacy GET path materializes per_page into x_query.oqo;
  // the OQL execute path omits it — stripping converges them. `select` (columns)
  // and `sort_by` are query identity and stay (charter: sort+columns in OQL).
  const oqo = { ...rawOqo };
  delete oqo.page;
  delete oqo.per_page;
  delete oqo.cursor;
  delete oqo.seed;
  let id;
  try {
    id = await api.mintShortQuery(oqo, fromRoute.fullPath);
  } catch (e) {
    return;  // store/minter down → keep the long URL, results already rendered
  }
  if (!id) return;
  // A later navigation may have superseded this query before the mint returned —
  // don't clobber the newer URL with a stale short id.
  if (route.fullPath !== fromRoute.fullPath) return;
  lastMintedShortId.value = id;
  // Carry only VIEW-layer params (paging) onto the opaque URL; the query itself
  // now lives in the short id, so drop oql/filter/sort/search/etc. (oxjob #464:
  // OQL/query state is in the id; paging is view chrome.)
  const viewQuery = {};
  if (fromRoute.query.page) viewQuery.page = fromRoute.query.page;
  if (fromRoute.query.per_page) viewQuery.per_page = fromRoute.query.per_page;
  url.replaceToRoute(router, {
    name: 'OqlShortQuery',
    params: { shortid: id },
    query: viewQuery,
  });
};

watch(
  effectiveEntityType,
  (to) => {
    store.state.entityType = to;
  },
  { immediate: true }
);

// Adopt a deep-link `per_page` into the page-size store (session override) as
// soon as it appears in the URL, BEFORE the fetch watcher below runs (registration
// order is preserved for immediate watchers), so the first request uses the linked
// size. Kept separate from the fetch watcher so the store commit it makes can't
// re-trigger that watcher into a double fetch.
watch(
  () => route.query.per_page,
  () => url.adoptPerPageFromUrl(route),
  { immediate: true }
);

watch(
  // Also key on the page sizes (list + table are independent): changing the page
  // size on page 1 leaves the URL unchanged (per_page only rides the URL on deep
  // pages), so fullPath alone wouldn't fire — the results would never reload. Vue
  // coalesces multiple source changes in one tick into a single callback, so
  // deep-page navigations (where both change) still fetch only once.
  [() => route.fullPath, () => store.state.serpPageSize, () => store.state.serpTablePageSize],
  async () => {
    // Opaque short URL (oxjob #464): `/q/:shortid` → resolve to the stored
    // canonical OQO → execute, keeping the clean address bar. Handled first so
    // the entity-less guard below doesn't bail on it.
    if (route.params.shortid) {
      // We just minted this id from results already in hand — don't re-fetch.
      if (route.params.shortid === lastMintedShortId.value && resultsObject.value) {
        store.state.isLoading = false;
        return;
      }
      if (!oqlFlag.value) {
        resultsObject.value = null;
        store.state.resultsObject = null;
        resultsFilters.value = [];
        store.state.isLoading = false;
        return;
      }
      store.state.isLoading = true;
      try {
        const oqo = await api.resolveShortQuery(route.params.shortid);
        const resp = await api.executeOqo(oqo);
        resultsObject.value = resp;
        store.state.resultsObject = resp;
        store.commit('setOqlSubmitError', null);
        searchError.value = null;
      } catch (e) {
        resultsObject.value = null;
        store.state.resultsObject = null;
        searchError.value =
          e?.response?.status === 404
            ? 'Sorry, this short link could not be found.'
            : e?.response?.data?.message || e?.message || 'Could not open this short link.';
      }
      resultsFilters.value = [];
      store.state.isLoading = false;
      window.scroll(0, 0);
      return;
    }

    if (
      route.query.id &&
      !userSavedSearches.value.find((s) => s.id === route.query.id)
    ) {
      url.pushToRoute(router, {
        name: 'Serp',
        query: { ...route.query, id: undefined },
      });
      return;
    }

    if (userId.value) {
      store.commit('user/setActiveSearchId', route.query.id);
    }

    store.state.isLoading = true;

    // The entity-less `/q` route has no path entity and only makes sense with an
    // executable `?oql=` (oql flag on). Without that there's nothing to run and the
    // oxurl path below (makeApiUrl) has no entity — bail cleanly. No GUI path
    // produces such a URL; this just guards a direct hit / flag-off. (oxjob #373 Phase 2)
    if (!route.params.entityType && !(oqlFlag.value && route.query.oql)) {
      resultsObject.value = null;
      store.state.resultsObject = null;
      resultsFilters.value = [];
      store.state.isLoading = false;
      return;
    }

    // OQL submit (#373, Option B): when `?oql=` is present, run it via the
    // execute endpoint instead of the URL-driven /works?filter=… path — OXURL is
    // a lossy subset of OQL, so the URL can't carry nested boolean trees.
    //
    // With the `oql` flag on, the query STAYS on `?oql=` and always runs through
    // the OQL endpoint — we do NOT downgrade it to the legacy `?filter=`/`?search.*=`
    // oxurl, even when the server reports a URL-expressible form (oxjob #428/#440,
    // Jason 2026-06-13). The old "upgrade to oxurl so chips render" path could emit
    // a URL the legacy executor can't actually run — e.g. a negated search renders
    // to `search.title_and_abstract=!frogs`, which the search param rejects
    // ("does not support the ! operator") even though the OQL itself is valid.
    // Routing everything through OQL sidesteps that whole lossy-subset class of
    // bug; chips (Basic mode) still hydrate from the response's `meta.x_query.url`.
    if (oqlFlag.value && route.query.oql) {
      try {
        const resp = await api.executeOql(route.query.oql);
        resultsObject.value = resp;
        store.state.resultsObject = resp;
        store.commit('setOqlSubmitError', null);
        searchError.value = null;
        maybeMintShortQuery(resp, route);  // fire-and-forget: upgrade URL to /q/:id
      } catch (e) {
        resultsObject.value = null;
        store.state.resultsObject = null;
        const validation = e?.response?.data?.validation || null;
        store.commit('setOqlSubmitError', validation);
        searchError.value =
          validation?.errors?.[0]?.message || e?.message || 'OQL query failed.';
      }
      resultsFilters.value = [];
      store.state.isLoading = false;
      window.scroll(0, 0);
      return;
    }

    try {
      // makeApiUrl is INSIDE the try block so a synchronous throw — e.g.
      // filtersFromUrlStr → createSimpleFilter on a URL filter whose key has
      // no facetConfig for this entity type (`?filter=is_oa:true` on /works,
      // since is_oa is registered for /sources and /locations only) —
      // surfaces inline via searchError instead of silently killing the
      // watcher. Caught during oxjob #228 QA-051: combined
      // `?filter=collection:X,is_oa:true` rendered a completely empty SERP
      // with no chips, facets, or error message because the throw bypassed
      // the request flow entirely. Same shape would break any URL containing
      // an unknown filter key (typo, doc copy-paste, old saved search).
      const apiQuery = url.makeApiUrl(route);
      const resp = await api.getResultsList(apiQuery);
      resultsObject.value = resp;
      store.state.resultsObject = resp;
      searchError.value = null;
      maybeMintShortQuery(resp, route);  // fire-and-forget: upgrade URL to /q/:id
    } catch (e) {
      resultsObject.value = null;
      store.state.resultsObject = null;
      // Surface the API's message field (e.g. wrong-entity-type collection
      // filter, malformed boolean search) instead of silently rendering an
      // empty SERP. Falls back to generic copy if the body is missing.
      searchError.value =
        e?.response?.data?.message ||
        e?.message ||
        'Search failed.';
    }
    store.state.isLoading = false;

    // filtersFromUrlStr can throw on an unknown filter key — same shape as
    // makeApiUrl above. Guard so the chip strip doesn't crash the watcher.
    try {
      resultsFilters.value = filtersFromUrlStr(
        selectedEntityType.value,
        route.query.filter
      );
    } catch (e) {
      resultsFilters.value = [];
    }

    window.scroll(0, 0);
  },
  { immediate: true }
);
</script>


<style lang="scss">
.v-pagination__item, .v-pagination__navigation {
  box-shadow: none;
}
table.serp-results-table {
  border-collapse: collapse;

  tr {
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, .05)
    }
  }

  td {
    border: none;
    margin: 0;
    padding: 5px 10px;

    &.range {
      text-align: right;
    }

    &.boolean {
      text-align: center;
    }
  }

}
</style>
