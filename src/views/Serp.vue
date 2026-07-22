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
import { createFetchSequencer } from '@/serpFetchSeq';
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

// Drop-stale guard for the async fetch watcher (oxjob #464 pillar A — Phase 1). Each
// run of the watcher below claims a sequence number via `beginFetch()`; after every
// `await` it checks `isStale()` and bails (writing nothing) if a newer run has since
// started. So a slow / superseded fetch can never write its stale results — or, via
// the components that derive the URL from `resultsObject`, a stale URL — over a newer
// navigation. This is the structural fix for the #369 "random-query dice landed on
// the PREVIOUS query" race; it stands alone, independent of the full
// OQO-as-source-of-truth re-architecture (Phase 2). See @/serpFetchSeq.
const beginFetch = createFetchSequencer();

// Tracks the previous fullPath so the inbound watcher can tell a real navigation
// (a route change) apart from a page-size store change. Used by the Phase-2a
// self-projection skip-guard below. (oxjob #464)
let prevFullPath = null;

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

// #492: `view` (list/table + the `api` overlay), `mode` (basic/advanced), and
// `group_by` (sidebar widget layout) are recipient-local SERP chrome that no longer
// lives in the URL (charter decision 33). A LEGACY inbound URL is handled in ONE
// combined watcher + ONE router.replace (replace → no history entry), which strips
// all three params at once (separate watchers RACE — each rebuilds its replace from a
// stale route.query snapshot and re-adds the others' params). The query + page/
// per_page survive untouched. Two DIFFERENT inbound policies:
//   • `?view=` / `?mode=` are SEEDED into session state then stripped (a bookmark's
//     view/mode is a recipient-local pref worth honoring for the visit; #480 pattern).
//     Session-only — we set the override/store, NOT the durable `serpMode`/
//     `oax.resultsView`, so a shared link can't rewrite a recipient's saved pref.
//   • `?group_by=` is NOT honored — just stripped (decision 33: an ad-hoc widget
//     layout isn't shareable query state, so a link must not reproduce the sender's
//     widgets; widgets revert to the entity defaults / the recipient's session store).
// `?mode=` is only meaningful on the flag-on OQL SERP; the flag-off ExpertSerp ignores
// serpModeOverride, so stripping it there is harmless.
const LEGACY_MODE_ALIASES = { simple: 'basic', old: 'basic', builder: 'advanced', oql: 'advanced' };
watch(
  () => [route.query.view, route.query.mode, route.query.group_by],
  ([view, mode, groupBy]) => {
    if (!view && !mode && !groupBy) return;
    if (view) {
      const flags = String(view).split(',');
      if (flags.includes('table')) store.commit('setSerpResultsView', { value: 'table', persist: false });
      else if (flags.includes('list')) store.commit('setSerpResultsView', { value: 'list', persist: false });
      if (flags.includes('api')) store.commit('setSerpShowApi', true);
    }
    if (mode) {
      store.commit('setSerpModeOverride', LEGACY_MODE_ALIASES[mode] || mode);
    }
    // group_by: stripped but deliberately NOT seeded (decision 33 — not honored inbound).
    const query = { ...route.query };
    delete query.view;
    delete query.mode;
    delete query.group_by;
    router.replace({ name: route.name, params: route.params, query });
  },
  { immediate: true }
);

watch(
  // Also key on the page sizes (list + table are independent): changing the page
  // size on page 1 leaves the URL unchanged (per_page only rides the URL on deep
  // pages), so fullPath alone wouldn't fire — the results would never reload. Vue
  // coalesces multiple source changes in one tick into a single callback, so
  // deep-page navigations (where both change) still fetch only once.
  // #492 Phase 4: also key on the money group-by signature (apc_sum /
  // cited_by_count_sum) — those feed makeApiUrl, so toggling one must re-fetch even
  // though the group-by list no longer rides the URL (the store change alone wouldn't
  // move route.fullPath). Regular group-bys self-fetch per widget, so they're not here.
  [() => route.fullPath, () => store.state.serpPageSize, () => store.state.serpTablePageSize,
   () => url.groupByMoneySignature(route)],
  async () => {
    // Phase 2a self-projection skip-guard (#464): a store-driven OQL edit executes
    // via POST-OQO (the executionOqo watcher below), then projects the canonical
    // `?oql=` to the address bar with router.replace. That projection fires THIS
    // watcher — but the results are already current, so re-fetching would be
    // wasteful (and could race). Recognise our own projection: a real route change
    // (pathChanged) whose `oql` equals the one we just executed → skip. Scoped to
    // pathChanged so a page-size store change (which doesn't move the path) still
    // fetches. Self-correcting (value comparison, no sticky flag).
    const pathChanged = route.fullPath !== prevFullPath;
    prevFullPath = route.fullPath;
    if (
      oqlFlag.value &&
      pathChanged &&
      route.query.oql &&
      route.query.oql === store.state.query.lastExecutedOql
    ) {
      // The query is unchanged, but this echo CAN carry a new saved-search id:
      // createSearch (Save search / Create alert on an unsaved query) appends
      // ?id=… after the results are already live, then relies on this watcher to
      // reflect it. Since we're about to skip the refetch below, sync the active
      // id here or the toolbar star wouldn't fill until a manual refresh (#611 r4).
      if (userId.value) {
        store.commit('user/setActiveSearchId', route.query.id);
      }
      // A true projection echo has this instance's results already live — skip.
      if (resultsObject.value) return;
      // Fresh mount into an already-executed query (the browser back button from
      // an entity page): lastExecutedOql survives in Vuex but this component's
      // resultsObject ref was reborn null, so skipping outright rendered a dead
      // SERP (oxjob #562). The store mirror is written only by this view, in the
      // same breath as lastExecutedOql — when its canonical OQL matches the URL's
      // it IS the settled response for exactly this query, so restore it instantly
      // (no refetch, no scroll reset). No match → fall through to a normal fetch.
      const mirrored = store.state.resultsObject;
      if (mirrored?.meta?.x_query?.oql === route.query.oql) {
        resultsObject.value = mirrored;
        resultsFilters.value = [];
        searchError.value = null;
        return;
      }
    }

    // Claim this run's sequence; isStale() turns true once a newer run begins, so
    // our post-await guards drop this run's writes if it has been superseded.
    const isStale = beginFetch();

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
        // Superseded by a newer navigation while awaiting → drop this stale result
        // (don't touch resultsObject / isLoading; the newer run owns them).
        if (isStale()) return;
        resultsObject.value = resp;
        store.state.resultsObject = resp;
        // Pillar A Phase 0 (#464): mirror the settled response into the canonical
        // query store (shadow only — drives nothing yet) + dev-only POST-OQO
        // round-trip de-risk. Fire-and-forget so it never blocks the SERP.
        store.dispatch('query/syncFromResponse', resp);
        store.commit('setOqlSubmitError', null);
        searchError.value = null;
      } catch (e) {
        // A superseded run may reject (e.g. an aborted/!==latest request) — bail
        // before writing a stale error over the newer run's results.
        if (isStale()) return;
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
      // Superseded by a newer navigation while awaiting → drop this stale result.
      if (isStale()) return;
      resultsObject.value = resp;
      store.state.resultsObject = resp;
      // Pillar A Phase 0 (#464): mirror the settled response into the canonical
      // query store (shadow only) + dev-only POST-OQO round-trip de-risk. The
      // legacy GET path materializes per_page + default sort into x_query.oqo, so
      // syncFromResponse splits those into viewState before reconstructing.
      store.dispatch('query/syncFromResponse', resp);
      searchError.value = null;
    } catch (e) {
      // Superseded run rejected → bail before clobbering the newer run's state.
      if (isStale()) return;
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

// Phase 2a (#464): the canonical query store drives the fetch for OQL-mode queries.
// A migrated edit surface (e.g. the sort menu) dispatches a `query/…` action that
// mutates `queryOqo`/`viewState` and bumps `editEpoch`; this watcher fires on that,
// POSTs the merged `executionOqo` via POST-OQO (no URL round-trip), then projects
// the SERVER-canonical OQL back to the address bar so the link stays shareable.
// Because edits set the canonical state synchronously and there is a single writer,
// there is no late translation to lag and no second writer to race — the structural
// dissolution of the #369 dice / multi-representation bug class. Shares `beginFetch`
// with the inbound watcher so a store fetch and a navigation fetch can never clobber
// each other's results. Only OQL mode is migrated; basic/chip (OXURL) mode still
// uses the legacy URL path, so this no-ops unless an `?oql=` query is in play.
watch(
  () => store.state.query.editEpoch,
  async () => {
    if (!oqlFlag.value || !store.state.query.authoritative) return;
    const oqo = store.getters['query/executionOqo'];
    if (!oqo) return;

    const isStale = beginFetch();
    store.state.isLoading = true;
    try {
      // #661 query/view split: the OQO is pure "which rows"; sort + paging ride
      // as sibling params (classic wire syntax) built by executionParams.
      const resp = await api.executeOqo(oqo, store.getters['query/executionParams']);
      if (isStale()) return;
      resultsObject.value = resp;
      store.state.resultsObject = resp;
      // Adopt the server-canonical OQO + record lastExecutedOql (no edit bump → no
      // loop). This is what lets the projection below be recognised as our own.
      store.dispatch('query/syncFromResponse', resp);
      store.commit('setOqlSubmitError', null);
      searchError.value = null;
    } catch (e) {
      if (isStale()) return;
      const validation = e?.response?.data?.validation || null;
      store.commit('setOqlSubmitError', validation);
      searchError.value =
        validation?.errors?.[0]?.message ||
        e?.response?.data?.message ||
        e?.message ||
        'OQL query failed.';
    }
    resultsFilters.value = [];
    store.state.isLoading = false;

    // Project the canonical OQL to the URL WITHOUT re-fetching: lastExecutedOql is
    // now set (via syncFromResponse), so the inbound watcher's skip-guard treats
    // this router.replace as our own projection and bails. Keep the current mode.
    // Match the projected string to lastExecutedOql exactly (no oqlForUrl reshaping)
    // so the skip-guard comparison holds. (oxjob #464 Phase 2a)
    const canonicalOql = resultsObject.value?.meta?.x_query?.oql;
    if (canonicalOql && canonicalOql !== route.query.oql) {
      // Back-button policy (#464 Phase 2b): the edit action tagged its nav intent
      // (`lastEditNav`) by SEMANTICS — push for a back-worthy NEW query (add/remove
      // a filter or search term, change entity, dice), replace for tuning (sort
      // flip, paging, group-by). Honoring it HERE, in the single projector, makes
      // the back button correct + consistent in one place — impossible when six
      // surfaces each made their own push/replace call. View-only edits (paging)
      // don't change the OQL, so this block is skipped and they never touch history.
      const navTo = store.state.query.lastEditNav === 'push'
        ? url.pushToRoute
        : url.replaceToRoute;
      navTo(router, {
        name: 'OqlQuery',
        query: { oql: canonicalOql },
      });
    }
    window.scroll(0, 0);
  }
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
