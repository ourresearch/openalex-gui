<template>
  <div class="serp-input-container" :class="`serp-input-container--${mode}`">
    <!-- Header row: left-aligned pill tabs (Basic / Advanced) + the admin dice and
         the page-top ⋮ (search-level actions: save/alert/copy-API/QR, #440 r5) on
         the right. The search equipment ALWAYS lives below this row, never inside
         it — consistent across modes (oxjob #440 round 2). -->
    <div class="serp-input-header d-flex align-center">
      <serp-mode-tabs
        :model-value="mode"
        :basic-disabled="!canUseBasic"
        @update:model-value="onModeSelect"
      /><!-- modes: basic | advanced (the OQL pane now lives inside Advanced, #441) -->
      <v-spacer />
      <serp-dice-button size="small" />
      <serp-header-kebab class="ml-1" />
    </div>

    <!-- The search card. Each mode presents exactly ONE self-contained card: a white
         body on top + a clearly-separated white footer (full-width top border). -->
    <!-- BASIC: the search box IS the card body (borderless); the filter chips are
         the card footer — rhyming with Advanced/OQL (body + footer). -->
    <v-card v-if="mode === 'basic'" variant="outlined" class="search-card bg-white mb-4">
      <div class="search-card-body">
        <search-box single-row borderless />
        <search-error-alert v-if="searchError" :message="searchError" class="mt-3" />
      </div>
      <div class="search-card-foot">
        <complex-query-card v-if="isComplexQuery" @view-oql="onModeSelect('advanced')" />
        <div
          v-else-if="!hasFiltersAvailable"
          class="d-flex align-center"
          style="min-height: 32px;"
        >
          <span class="text-body-2" style="color: rgba(0,0,0,0.38);">No filters available</span>
        </div>
        <novice-filter-chips v-else cap-to-slots />
      </div>
    </v-card>

    <!-- ADVANCED: the builder's own card IS the card. No Run button — the query
         auto-runs as the user edits (#428); "edit raw" opens the view-code dialog. -->
    <template v-else-if="mode === 'advanced'">
      <oql-query-builder
        :key="oqlComponentKey"
        :oql="seedOql"
        :entity="entityType"
        :show-header="false"
        :show-foot="false"
        :inline-run="false"
        show-toolbar
        embedded
        @update:oqo="onBuilderOqo"
        @edit-raw="openViewCode"
      />
      <oql-view-code-dialog
        v-model="viewCodeOpen"
        :seed-oql="viewCodeSeed"
        :entity="entityType"
        @apply="onOqlRun"
      />
      <search-error-alert v-if="searchError" :message="searchError" class="mb-4 mt-4" />
    </template>

    <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6" />

    <!-- Results region. Width follows the mode (#440 r5): Basic = narrow,
         readable column (like the search card above it); Advanced = full width. -->
    <div v-if="!searchError" class="serp-results-region">
      <selection-banner class="mb-2" />

      <v-card variant="outlined" class="bg-white">
        <!-- Results header lives INSIDE the card (#440 r8): count +
             collection/sort/download/⋮ (page size only; download is its own
             icon). In table mode the column-header row directly below gets a
             darker bg to keep the hierarchy legible (two stacked headers). -->
        <!-- r11 WWLD: ONE action row — select-all lives here in BOTH modes (the
             table's column row is pure labels), the collection action appears
             only when a selection exists (Gmail labels), the column editor is a
             labeled button here instead of a + hidden in the column row, and the
             count reads Gmail-style ("1–100 of about …"). -->
        <div class="results-card-head d-flex align-center">
          <v-checkbox-btn
            class="results-header-checkbox mr-1"
            density="compact"
            :model-value="masterChecked"
            :indeterminate="masterIndeterminate"
            @update:model-value="onMasterClick"
          />
          <span class="text-body-2 text-medium-emphasis">{{ resultsCountLabel }}</span>
          <v-spacer />
          <!-- Icon-only actions (#440 r12 — no icon+word hybrids), right-to-left:
               kebab, columns, download, sort, collection (collection only with a
               selection). Each carries a Linear-styled tooltip. -->
          <collection-action-menu
            v-if="selectedCount > 0"
            :entity-type="entityType"
            :selected-ids="effectiveSelectedIds"
            :enumeration-blocked="enumerationBlocked"
            tooltip-class="linear-tooltip"
            class="ml-1"
            @applied="onCollectionsApplied"
          />
          <novice-sort-button class="ml-1" show-label />
          <serp-download-button :results-object="resultsObject" class="ml-1" />
          <add-column v-if="isTableView" :entity-type="entityType">
            <template #activator="{ props: colBtnProps }">
              <v-btn
                v-bind="colBtnProps"
                icon
                variant="text"
                size="small"
                class="ml-1"
                aria-label="Edit columns"
              >
                <v-icon size="20" color="grey-darken-1">mdi-view-column-outline</v-icon>
                <v-tooltip activator="parent" location="bottom" content-class="linear-tooltip">
                  Edit columns
                </v-tooltip>
              </v-btn>
            </template>
          </add-column>
          <serp-results-kebab class="ml-1" />
        </div>
        <v-divider />

        <results-table
          v-if="resultsObject?.results && isTableView"
          :results-object="resultsObject"
          :entity-type="entityType"
          @filter-column="onColumnFilter"
        />

        <div v-else-if="resultsObject?.results" class="results-container">
          <serp-results-list-item
            v-for="result in resultsObject.results"
            :key="result.id"
            :result="result"
            selectable
          />
        </div>

        <div
          v-if="resultsObject?.meta?.count === 0"
          class="text-medium-emphasis text-center py-8"
        >
          Try adjusting your search or filters.
        </div>

        <sliding-pagination
          v-if="showPagination"
          class="pb-8 pt-4"
          v-model="page"
          :count="resultsObject?.meta?.count || 0"
          :per-page="url.getPerPage()"
        />
      </v-card>
    </div>

    <add-filter v-if="isTableView" ref="columnFilterRef" headless />

    <!-- Lossy mode-switch warning -->
    <v-dialog v-model="lossyDialog.open" max-width="440">
      <v-card rounded>
        <v-card-title>Switch to {{ lossyDialog.label }}?</v-card-title>
        <v-card-text>
          This query uses advanced logic that {{ lossyDialog.label }} mode can't fully
          represent. Switching may drop part of your query.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="lossyDialog.open = false">Cancel</v-btn>
          <v-btn variant="flat" rounded color="primary" @click="confirmLossySwitch">Switch anyway</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { debounce } from 'lodash';

import { url } from '@/url';
import filters from '@/filters';
import { filtersFromUrlStr } from '@/filterConfigs';
import { basicCanRepresent, chipSlotCount } from '@/components/Filter/basicFilterMode';
import { entityConfigs } from '@/entityConfigs';
import { facetConfigs } from '@/facetConfigs';

import SerpResultsListItem from '@/components/SerpResultsListItem.vue';
import ResultsTable from '@/components/Results/ResultsTable.vue';
import SlidingPagination from '@/components/SlidingPagination.vue';
import SelectionBanner from '@/components/SelectionBanner.vue';
import CollectionActionMenu from '@/components/Collection/CollectionActionMenu.vue';
import { useSelectionContext } from '@/composables/useSelectionContext';
import { useMasterSelection } from '@/composables/useMasterSelection';
import AddFilter from '@/components/Filter/AddFilter.vue';
import AddColumn from '@/components/Results/Table/AddColumn.vue';
import NoviceFilterChips from '@/components/NoviceFilterChips.vue';
import ComplexQueryCard from '@/components/ComplexQueryCard.vue';
import NoviceSortButton from '@/components/NoviceSortButton.vue';
import SerpApiEditor from '@/components/SerpApiEditor.vue';
import SearchBox from '@/components/SearchBox.vue';
import SearchErrorAlert from '@/components/SearchErrorAlert.vue';
import SerpDiceButton from '@/components/SerpDiceButton.vue';
import SerpModeTabs from '@/components/Serp/SerpModeTabs.vue';
import SerpResultsKebab from '@/components/Serp/SerpResultsKebab.vue';
import SerpHeaderKebab from '@/components/Serp/SerpHeaderKebab.vue';
import SerpDownloadButton from '@/components/Serp/SerpDownloadButton.vue';
import OqlQueryBuilder from '@/components/Oql/OqlQueryBuilder.vue';
import OqlViewCodeDialog from '@/components/Oql/OqlViewCodeDialog.vue';

defineOptions({ name: 'SerpInputContainer' });

const props = defineProps({
  resultsObject: Object,
  searchError: String,
});

const store = useStore();
const route = useRoute();
const router = useRouter();

const entityType = computed(() => store.getters.entityType);
// OQL mode (#464 Phase 2b): when an `?oql=` query is in play under the oql flag,
// edits (sort, paging) drive the canonical query store → POST-OQO, not the URL.
// Basic/chip (OXURL) mode is unchanged. Mirrors NoviceSortButton's gate.
const inOqlMode = computed(
  () => !!store.getters.featureFlags['oql'] && !!route.query.oql
);
const isSemanticSearch = computed(() => !!route.query['search.semantic']);
// View is COUPLED to the mode (#440 r5): Basic = list, Advanced = table. The
// old view-as-table/list toggle is gone. List/table is recipient-local chrome
// kept off the URL (#492): the `mode` watcher below mirrors it into the reactive
// store so per-page + the API fetch key (url.isTableView) agree with the mode.
const isTableView = computed(() => mode.value === 'advanced');

// ---- mode ('basic' | 'advanced') ------------------------------------------
const MODES = ['basic', 'advanced'];
// Back-compat for older ?mode= links. The standalone OQL mode was folded into
// Advanced (#441), so ?mode=oql now lands in the builder.
const LEGACY_MODE_ALIASES = { simple: 'basic', old: 'basic', builder: 'advanced', oql: 'advanced' };
const explicitMode = computed(() => {
  const m = LEGACY_MODE_ALIASES[route.query.mode] || route.query.mode;
  return MODES.includes(m) ? m : null;
});
// The last mode the user explicitly switched to — a per-device sticky default so
// a bare /works (no ?mode=) reopens in it (oxjob #440 round 4). Sticky-only: we
// render from the stored pref WITHOUT pushing ?mode= into the URL; ?mode= is only
// written when the user actually switches modes.
const STORED_MODE_KEY = 'serpMode';
function loadStoredMode() {
  try {
    const m = localStorage.getItem(STORED_MODE_KEY);
    return MODES.includes(m) ? m : null;
  } catch (e) {
    return null;
  }
}
// Mode precedence (explicit always wins):
// 1. explicit ?mode= (incl. legacy aliases);
// 2. ?oql= / a query too complex for basic filters → Advanced (kept ABOVE the
//    stored pref so a stored 'basic' never strands an unrepresentable query);
// 3. the stored sticky preference;
// 4. Basic.
const mode = computed(() => {
  if (explicitMode.value) return explicitMode.value;
  if (route.query.oql || !basicRepresentable.value) return 'advanced';
  return loadStoredMode() || 'basic';
});
// Basic is available only when the query can be shown as basic chips: not a
// complex (non-URL-expressible) ?oql= query, AND the flat filters are
// chip-representable. A complex ?oql= query keeps the filter param empty, so the
// filter-only check alone would wrongly report it representable (#440).
const canUseBasic = computed(() => !isComplexQuery.value && basicRepresentable.value);

function onModeSelect(newMode) {
  if (newMode === mode.value) return;
  // Warn before a lossy switch: leaving an advanced (?oql=, non-URL-expressible)
  // query for Basic, which can't represent it.
  const lossy = newMode === 'basic'
    && !!route.query.oql
    && props.resultsObject?.meta?.x_query
    && props.resultsObject.meta.x_query.url == null;
  if (lossy) {
    lossyDialog.open = true;
    lossyDialog.target = newMode;
    lossyDialog.label = 'Basic';
    return;
  }
  applyMode(newMode);
}

const lossyDialog = reactive({ open: false, target: null, label: '' });
function confirmLossySwitch() {
  lossyDialog.open = false;
  if (lossyDialog.target) applyMode(lossyDialog.target);
}

function applyMode(newMode) {
  try {
    localStorage.setItem(STORED_MODE_KEY, newMode);
  } catch (e) { /* private mode / quota — ignore */ }
  // List/table presentation follows the mode (#440 r5) but is recipient-local
  // CHROME now (#492) — it lives in the reactive store (mirrored by the `mode`
  // watcher below), NOT the URL. So we no longer write `?view=`; in fact we strip
  // any residual legacy `?view=` from the carried query here.
  // Stay on the entity-less `/q` route while an OQL query is in play (its entity
  // lives in the OQL, not the path); only chip/OXURL queries use `/:entityType`.
  // (oxjob #373 Phase 2)
  const target = route.query.oql
    ? { name: 'OqlQuery' }
    : { name: 'Serp', params: { entityType: entityType.value } };
  const query = { ...route.query, mode: newMode, page: undefined };
  delete query.view;
  url.pushToRoute(router, { ...target, query });
}

// ---- OQL seeding for Builder / OQL modes ----------------------------------
const QUERY_KEYS = [
  'filter', 'sort',
  'search', 'search.exact', 'search.semantic',
  'search.title', 'search.title.exact',
  'search.title_and_abstract', 'search.title_and_abstract.exact',
];
const queryParams = computed(() => {
  const q = {};
  for (const k of QUERY_KEYS) if (route.query[k]) q[k] = route.query[k];
  return q;
});
const queryObject = computed(() => store.getters.queryObject);
// The OQL to hand the builder/editor: the live ?oql= if present, else the
// server-translated OQL of the current chip/URL query.
const seedOql = computed(() => route.query.oql || queryObject.value?.oql || '');
// Remount only on a mode switch. The builder now takes `:oql` reactively and
// re-seeds itself on external query changes, and it auto-runs its own edits — so
// keying on the seed would remount it mid-edit on every keystroke. (oxjob #428.)
const oqlComponentKey = computed(() => `builder:${mode.value}`);

function refreshQueryObject() {
  // Builder/editor seed straight from ?oql= when present; otherwise translate the
  // live URL query so seedOql is ready when the user switches into those modes.
  if (route.query.oql) return;
  store.dispatch('fetchQueryObject', {
    entityType: entityType.value,
    query: queryParams.value,
  });
}
watch([entityType, () => JSON.stringify(queryParams.value)], refreshQueryObject);
onMounted(refreshQueryObject);

// ---- "view code" dialog (#463) --------------------------------------------
// Opens a side-by-side builder/OQL teaching modal seeded with the builder's
// current OQL. The builder hands us its OQL via the foot-actions slot prop; the
// dialog's "Use this query" emits @apply -> onOqlRun (same path as Run).
const viewCodeOpen = ref(false);
const viewCodeSeed = ref('');
function openViewCode(oql) {
  viewCodeSeed.value = (oql || seedOql.value || '').trim();
  viewCodeOpen.value = true;
}

function onOqlRun(oql) {
  const trimmed = (oql || '').trim();
  if (!trimmed) return;
  store.commit('setOqlSubmitError', null);
  // Run via the entity-less `/q?oql=` submit path (OQL carries its own entity);
  // keep the current mode so the user stays in Builder/OQL. oqlForUrl collapses the
  // pretty-print layout so the URL stays single-line. (oxjob #373 Phase 2)
  url.pushToRoute(router, {
    name: 'OqlQuery',
    query: { oql: url.oqlForUrl(trimmed), mode: mode.value },
  });
}

// BOOTSTRAP mint (#428/#464): a brand-new query built in advanced mode has no `?oql=`
// yet, so the first committed edit mints one by writing the URL; the inbound watcher
// then runs it and we land in OQL mode (every subsequent commit is store-driven). This
// fires only from `onBuilderOqo`, which the builder now calls ONLY on a submit gesture
// (see below) — so there's no keystroke storm to debounce; the small debounce just
// coalesces the rare back-to-back commit.
const autoRun = debounce((oql) => {
  const trimmed = (oql || '').trim();
  if (!trimmed) return;
  const next = url.oqlForUrl(trimmed);
  if (next === route.query.oql) return;
  store.commit('setOqlSubmitError', null);
  url.replaceToRoute(router, {
    name: 'OqlQuery',
    query: { oql: next, mode: mode.value },
  });
}, 400);

// #464 Phase 2c: the builder hands us its structured OQO ONLY on a positive SUBMIT
// gesture (Enter / blur-to-finish / add-or-remove a chip or filter / drop a dragged
// chip / column or entity change) — NEVER on a keystroke, and never for a transient
// mid-edit state. (Jason 2026-06-18: typing "armadillo" into a chip must not change app
// state until the user submits.) The builder gates the `update:oqo` emit on a commit, so
// we run EVERY emit we receive — no debounce, no keystroke filtering needed here.
//   - OQL mode (we already have `?oql=`): drive the canonical store → POST-OQO; the
//     execution watcher bumps editEpoch → Serp.vue POSTs executionOqo + projects `?oql=`
//     honoring `nav` for the back button.
//   - bootstrap (no `?oql=` yet): mint the URL via autoRun → inbound run → OQL mode.
// The skip-guard (collapsed OQL equal both sides) drops our own projection echo so the
// builder's post-projection reseed never re-dispatches.
function onBuilderOqo({ oqo, oql, nav } = {}) {
  if (!oqo) return;
  if (url.oqlForUrl(oql || '') === url.oqlForUrl(route.query.oql || '')) return;
  store.commit('setOqlSubmitError', null);
  if (inOqlMode.value) {
    store.dispatch('query/setQueryFromOqo', { oqo, nav: nav === 'replace' ? 'replace' : 'push' });
  } else {
    autoRun(oql);
  }
}
onBeforeUnmount(() => autoRun.cancel());
// Drop any pending bootstrap mint the moment the route changes for any other reason
// (the dice, a shared link, back/forward) so a debounced mint armed just before a
// navigation can't overwrite the new query with the old one. (oxjob #428 dice bug)
watch(() => route.fullPath, () => autoRun.cancel());

// ---- filters / representability -------------------------------------------
const hasFiltersAvailable = computed(() =>
  facetConfigs(entityType.value).some((c) => c.actions?.includes('filter'))
);
const isComplexQuery = computed(() => {
  const xq = props.resultsObject?.meta?.x_query;
  return !!route.query.oql && !!xq && xq.url == null;
});
const basicRepresentable = computed(() => {
  const filters = filtersFromUrlStr(entityType.value, route.query.filter);
  // The basic bar has a FIXED number of chip slots (#440 r10 — no second-row
  // wrap, ever). More active filters than slots → force advanced, disable
  // Basic. (basicCanRepresent already rejects duplicate keys, so filters.length
  // is the active-chip count whenever it returns true.)
  return basicCanRepresent(entityType.value, filters)
    && filters.length <= chipSlotCount(entityType.value, isSemanticSearch.value);
});

// List/table presentation is derived from the mode (#440 r5) and is recipient-
// local CHROME kept off the URL (#492). Mirror mode → the reactive results-view
// store WITHOUT persisting, so getPerPage / the API fetch key (url.isTableView)
// agree with the shown mode. persist:false leaves the durable list/table pref
// (oax.resultsView, written only by the flag-off toggle) untouched. Registered
// after basicRepresentable because `mode` reads it, and this fires immediately.
watch(mode, (m) => {
  store.commit('setSerpResultsView', {
    value: m === 'advanced' ? 'table' : 'list',
    persist: false,
  });
}, { immediate: true });

// ---- results header / counts ----------------------------------------------
const { masterChecked, masterIndeterminate, onMasterClick } = useMasterSelection();
const columnFilterRef = ref(null);
function onColumnFilter(baseKey) {
  columnFilterRef.value?.openForKey(baseKey);
}

const entityDisplayName = computed(
  () => entityConfigs[entityType.value]?.displayName || entityType.value
);
const selectedCount = computed(() => store.getters['selection/selectedCount']);
const resultsCountLabel = computed(() => {
  if (!props.resultsObject?.meta) return '';
  if (isSemanticSearch.value) return '50 most semantically similar works';
  const count = props.resultsObject.meta.count;
  if (count === 0) return 'There are no results for this search.';
  const formatted = filters.toPrecision(count);
  const isRounded = Number(formatted.replace(/,/g, '')) !== count;
  const prefix = isRounded ? 'about ' : '';
  const base = `${prefix}${formatted} ${entityDisplayName.value}`;
  if (selectedCount.value > 0) {
    return `${selectedCount.value.toLocaleString()} selected of ${base}`;
  }
  // Works count FIRST (#440 r12 — the count is a primary outcome of the
  // search), page range in parens: "about 316,600,000 works (1–100)".
  const perPage = url.getPerPage();
  const page = props.resultsObject.meta.page ?? 1;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, count);
  return `${base} (${from.toLocaleString()}–${to.toLocaleString()})`;
});

// ---- pagination -----------------------------------------------------------
const showPagination = computed(
  () => (props.resultsObject?.meta?.count || 0) > url.getPerPage()
);
const page = computed({
  get() {
    return props.resultsObject?.meta?.page ?? 1;
  },
  set(val) {
    // OQL mode (#464 Phase 2b): drive the canonical store → POST-OQO. The inbound
    // executeOql channel ignores URL `?page=`, so URL-only paging was dead in OQL
    // mode; routing through the store carries page inline in the OQO. Pass the
    // current per_page so the executed size matches the displayed one. Replace
    // intent (paging is tuning, not a new query → no history entry).
    if (inOqlMode.value) {
      store.dispatch('query/setPage', { page: val, perPage: url.getPerPage() });
      return;
    }
    url.setPage(val === 1 ? undefined : val);
  },
});

useSelectionContext(() => props.resultsObject);

// ---- collections wiring ----------------------------------------------------
const selection = computed(() => store.state.selection);
const effectiveSelectedIds = computed(() => {
  const s = selection.value;
  if (s.selectAllMode) {
    const excluded = new Set(s.excludedIds);
    return s.loadedIds.filter((id) => !excluded.has(id));
  }
  return [...s.selectedIds];
});
const enumerationBlocked = computed(() => {
  const s = selection.value;
  return s.selectAllMode && s.totalCount > s.loadedIds.length;
});
function onCollectionsApplied() {
  store.commit('selection/deselectAll');
}
watch(
  () => props.resultsObject?.results,
  () => {
    store.commit('collections/clearPageCollections');
  }
);
</script>

<style scoped>
.results-header-checkbox {
  flex: 0 0 auto;
  width: auto;
}
/* Header row matched to the sidebar's "Stats" head (40px, flush) so the search
   card's top border lines up with the first stats widget card on the left. */
.serp-input-header {
  height: 40px;
  margin-bottom: 0;
}

/* Width regime (#440 r5): Basic reads like a document — search box + results in
   a narrow, Scholar-ish measure; Advanced spreads the builder + results table
   across the full viewport width. */
.serp-input-container--basic .search-card,
.serp-input-container--basic .serp-results-region {
  max-width: 970px; /* r10: 720px felt cramped — ~35% wider */
  min-width: 480px;
}
/* The embedded query builder caps itself at 900px (its playground default) —
   in Advanced mode it must span the full column, same as the results table
   (#440 r8). Overridden here rather than editing OqlQueryBuilder (concurrent
   #428 work lives there). */
.serp-input-container--advanced :deep(.builder) {
  max-width: none;
}

/* Results region: space below the search card (was an inline margin on the old
   outside-the-card header row). */
.serp-results-region {
  margin-top: 32px;
}
/* Results header, now a card head (#440 r8). */
.results-card-head {
  padding: 6px 12px 6px 10px;
  min-height: 44px;
}
/* Table mode stacks two headers (results head + column head). r8 tried a gray
   fill on the column row; r9 goes the Linear way instead — NO fill, hierarchy
   from typography: column labels drop to small/medium/muted so the (darker,
   larger) results head above clearly owns the card. Scoped to the flag-on
   container; the flag-off table is untouched. */
.serp-input-container--advanced :deep(th.results-table-header) {
  font-size: 12px !important;
  font-weight: 500 !important;
  color: rgba(0, 0, 0, 0.48) !important;
}

/* r11 WWLD: the column row is PURE labels — its select-all + AddColumn (+) are
   hidden here (both actions live in the results header above). The flag-off
   table keeps them (scoped CSS, shared component untouched). */
.serp-input-container--advanced :deep(th.checkbox-cell .v-selection-control) {
  display: none;
}
.serp-input-container--advanced :deep(th.add-column-cell .v-btn) {
  display: none;
}
/* Whole-cell header click target (Linear): the hover bg fills the entire th,
   not a small rounded box inside it. The th's padding moves onto the trigger. */
.serp-input-container--advanced :deep(th.results-table-header) {
  padding: 0;
}
.serp-input-container--advanced :deep(th.results-table-header.checkbox-cell),
.serp-input-container--advanced :deep(th.results-table-header.add-column-cell) {
  padding: 8px 10px;
}
.serp-input-container--advanced :deep(th.results-table-header .column-header-trigger) {
  margin: 0;
  padding: 8px 10px;
  border-radius: 0;
}
.serp-input-container--advanced :deep(th.results-table-header .column-header-trigger:hover) {
  background: rgba(0, 0, 0, 0.05);
}

/* Basic-mode search card: white body (the search box) + a clearly-separated white
   footer (the filter chips), full-width top border so it reads as a real footer. */
.search-card {
  overflow: hidden;
}
.search-card-body {
  padding: 6px 10px;
}
.search-card-foot {
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  background: white;
}
</style>

<style>
/* Linear-style tooltips (#440 r12, corrected r12.1): Linear's LIGHT theme uses
   white tooltips with near-black text, a hairline border and a soft drop
   shadow (the dark version is their dark theme only — wrong for our light
   app). This matches the app's global white-tooltip house rule but with
   Linear's compact typography. Unscoped (tooltips teleport to the overlay
   container); applied via content-class="linear-tooltip". */
.v-tooltip > .v-overlay__content.linear-tooltip {
  background-color: #fff !important;
  color: rgba(0, 0, 0, 0.85) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  padding: 4px 8px;
  border-radius: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
}
</style>
