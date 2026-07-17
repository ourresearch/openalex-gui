<template>
  <div class="serp-input-container" :class="`serp-input-container--${mode}`">
    <!-- Header row: left-aligned pill tabs (Basic / Advanced) + the admin dice and
         the page-top search-level actions (share menu + save/alert star, #611 —
         formerly one ⋮ kebab, #440 r5) on the right. The search equipment ALWAYS
         lives below this row, never inside it — consistent across modes (oxjob
         #440 round 2). -->
    <div class="serp-input-header d-flex align-center">
      <serp-mode-tabs
        :model-value="mode"
        :basic-disabled="!canUseBasic"
        :advanced-disabled="!builderRepresentable"
        @update:model-value="onModeSelect"
      /><!-- modes: basic | advanced | oql (OQL is its own top-level tab, #441) -->
      <v-spacer />
      <serp-dice-button size="small" />
      <serp-header-actions class="ml-1" />
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
         auto-runs as the user edits (#428); the toolbar's "edit code" button jumps
         to the OQL tab (which replaced the old view-code dialog, #441).
         #603 round 10 (Jason): Advanced IS the V2 outline builder now — the V1 grid
         builder (oql-query-builder) is unmounted and its "Advanced v2" twin tab is
         gone. Same host contract as before. -->
    <template v-else-if="mode === 'advanced'">
      <oql-query-builder-v2
        :key="oqlComponentKey"
        :oql="seedOql"
        :entity="entityType"
        :show-header="false"
        :show-foot="false"
        :inline-run="false"
        show-toolbar
        embedded
        @update:oqo="onBuilderOqo"
      />
      <search-error-alert v-if="searchError" :message="searchError" class="mb-4 mt-4" />
    </template>

    <!-- OQL: the raw query-language view, promoted from the old "view code" dialog
         (#441) to a top-level tab. A self-contained text editor (highlighting + live
         validation) seeded with the current query. Explicit submit (#600, à la
         Scopus/WoS advanced search — reverses #530's auto-run and #587's live
         rewrite, both of which mutated things while the user typed): nothing runs
         and the TEXT IS NEVER TOUCHED until the user hits Search / ⌘Enter, at which
         point the buffer is replaced with the server's canonical formatting AND the
         query runs — "format on save". -->
    <template v-else-if="mode === 'oql'">
      <v-card variant="outlined" class="search-card bg-white mb-4">
        <div class="search-card-body">
          <!-- One quiet, non-blocking line when a builder edit overflowed the grid
               and relocated here (#523 Test 10). The query is never lost — only moved. -->
          <div
            v-if="gridOverflowNote"
            class="grid-overflow-note text-body-2 mb-2"
          >Moved to OQL — too complex for the grid.</div>
          <!-- ⌘/Ctrl+Enter arrives as @submit: the editor must own that binding
               (CodeMirror's defaultKeymap binds Mod-Enter to insert-blank-line, so a
               host keydown listener never gets a clean shot at it). -->
          <!-- #611: real toolbar strip (builder-style) instead of floating icons; the
               validity state moved OUT of the editor into the footer chip below. -->
          <oql-editor
            v-model="oqlTabText"
            min-height="200px"
            max-height="60vh"
            :status="oqlTabStatus"
            :placeholder="OQL_TAB_PLACEHOLDER"
            toolbar
            :show-badge="false"
            @validation="onOqlTabValidation"
            @submit="submitOqlTab"
          />
          <!-- Card footer (#611): status chip far LEFT (chip-style, balancing the
               Search button on the right). Search is never disabled (#600 r2, Jason):
               tying enabled-ness to per-keystroke validity made the button strobe
               while typing. Clicking with invalid text is a quiet no-op — the red
               chip already tells that story. -->
          <div class="d-flex align-center mt-3">
            <oql-status-chip :status="oqlTabStatus" :validation="oqlTabValidation" />
            <v-spacer />
            <v-btn
              color="primary"
              variant="flat"
              :loading="oqlTabStatus === 'querying'"
              title="Run this query (⌘⏎)"
              @click="submitOqlTab"
            >Search</v-btn>
          </div>
        </div>
      </v-card>
      <search-error-alert v-if="searchError" :message="searchError" class="mb-4" />
    </template>

    <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6" />

    <!-- Results region. Width follows the mode (#440 r5): Basic = narrow,
         readable column (like the search card above it); Advanced = full width. -->
    <div v-if="!searchError" class="serp-results-region">
      <selection-banner v-if="mode !== 'basic'" class="mb-2" />

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
          <!-- #598 r5: Basic mode has NO selection affordances — no master checkbox,
               no per-row checkboxes, no collection action. Selection lives in the
               power modes (the Advanced/OQL table). -->
          <v-checkbox-btn
            v-if="mode !== 'basic'"
            class="results-header-checkbox mr-1"
            density="compact"
            :model-value="masterChecked"
            :indeterminate="masterIndeterminate"
            @update:model-value="onMasterClick"
          />
          <span class="text-body-2 text-medium-emphasis">{{ resultsCountLabel }}</span>
          <v-spacer />
          <!-- Icon-only actions (#440 r12 — no icon+word hybrids), right-to-left:
               kebab, columns, download, collection (collection only with a
               selection). Each carries a Linear-styled tooltip. Sorting lives in
               the column header menus (#601), not here. -->
          <collection-action-menu
            v-if="mode !== 'basic' && selectedCount > 0"
            :entity-type="entityType"
            :selected-ids="effectiveSelectedIds"
            :enumeration-blocked="enumerationBlocked"
            tooltip-class="linear-tooltip"
            class="ml-1"
            @applied="onCollectionsApplied"
          />
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
            :selectable="mode !== 'basic'"
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
import SerpApiEditor from '@/components/SerpApiEditor.vue';
import SearchBox from '@/components/SearchBox.vue';
import SearchErrorAlert from '@/components/SearchErrorAlert.vue';
import SerpDiceButton from '@/components/SerpDiceButton.vue';
import SerpModeTabs from '@/components/Serp/SerpModeTabs.vue';
import SerpResultsKebab from '@/components/Serp/SerpResultsKebab.vue';
import SerpHeaderActions from '@/components/Serp/SerpHeaderActions.vue';
import SerpDownloadButton from '@/components/Serp/SerpDownloadButton.vue';
// (#603 round 10: the V1 grid builder import is gone — Advanced mounts the V2
// outline builder. OqlQueryBuilder.vue stays on disk for reference/playground.)
import OqlQueryBuilderV2 from '@/components/Oql/OqlQueryBuilderV2.vue';
import OqlEditor from '@/components/OqlPlayground/OqlEditor.vue';
import OqlStatusChip from '@/components/OqlPlayground/OqlStatusChip.vue';
import { validateOql } from '@/components/OqlPlayground/oqlEditorApi';
import { api } from '@/api';
import { treeRepresentable } from '@/components/Oql/representableShape';

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
// View is COUPLED to the mode (#440 r5): Basic = list, Advanced = table — and
// OQL = table too (#611 r5, Jason: the power modes share the table). The old
// view-as-table/list toggle is gone. List/table is recipient-local chrome
// kept off the URL (#492): the `mode` watcher below mirrors it into the reactive
// store so per-page + the API fetch key (url.isTableView) agree with the mode.
const isTableView = computed(() => mode.value !== 'basic');

// ---- mode ('basic' | 'advanced') ------------------------------------------
// mode is recipient-local CHROME, no longer on the URL (#492, charter decision 33).
// It resolves from (in order): a local representability force-bump → the session
// override (the user's active choice this visit, in store.state.serpModeOverride,
// seeded from a legacy ?mode= link in Serp.vue) → the durable per-device `serpMode`
// pref → Basic. Nothing here writes ?mode=, so a shared link never forces a mode.
const MODES = ['basic', 'advanced', 'oql'];
// #603 round 10: 'advanced2' is retired — the V2 outline builder IS Advanced now. A
// stored pref / session override / legacy ?mode= link that still says 'advanced2'
// (every device that used the experiment tab) folds into 'advanced'.
const normalizeMode = (m) => (m === 'advanced2' ? 'advanced' : m);
// The durable per-device sticky default (oxjob #440 round 4). Written ONLY on an
// explicit mode switch (applyMode) — never seeded from an inbound link, so a shared
// ?mode= can't silently rewrite a recipient's preference.
const STORED_MODE_KEY = 'serpMode';
function loadStoredMode() {
  try {
    const m = normalizeMode(localStorage.getItem(STORED_MODE_KEY));
    return MODES.includes(m) ? m : null;
  } catch (e) {
    return null;
  }
}
// Mode precedence:
// 1. a query too complex for basic chips → Advanced LOCALLY (the force-bump — kept
//    ABOVE the pref so a stored 'basic' never strands an unrepresentable query, and
//    NEVER written to the URL so a shared link can't push a basic-preferring recipient
//    into advanced). Representability is computed from the CANONICAL query (#492
//    Phase 3) — so a basic-representable `?oql=` query opens in the recipient's pref,
//    not force-bumped; the chips hydrate from x_query.url (chipFilterStr) and edits
//    re-run as OQL via the /query translate (url.pushNewFilters), keeping the URL
//    canonical. A non-representable `?oql=` (nested boolean) stays Advanced.
// 2. the session override (a legacy ?mode= seed / the last explicit switch) — the
//    reactive store flag, so a switch re-renders with NO navigation;
// 3. the durable sticky preference (localStorage `serpMode`);
// 4. Basic.
// The legacy `?mode=` seed (into serpModeOverride) + strip happens in Serp.vue,
// combined with the `?view=` strip so the two don't race on router.replace.
const mode = computed(() => {
  const override = normalizeMode(store.state.serpModeOverride) || loadStoredMode();
  // #523: the builder (Advanced) can only show a restricted query shape. When the
  // current query is too complex for it, Advanced is unavailable — the user edits
  // in OQL instead. (OQL can represent anything.)
  const canBuilder = builderRepresentable.value;
  // A query too complex for basic chips can't render as basic. Honor an explicit
  // non-basic choice (Advanced or OQL), else fall to Advanced — UNLESS the builder
  // can't show it, in which case fall to OQL. This is the force-bump that keeps a
  // stored 'basic' from stranding an unrepresentable query.
  if (!basicRepresentable.value) {
    if (!canBuilder) return 'oql';
    return override && override !== 'basic' ? override : 'advanced';
  }
  // Basic-representable: honor the override, but if the user prefers the builder tab
  // and it can't show this query, that tab is disabled → fall to OQL. (#603 round 7:
  // Jason capped the supported query landscape at AND-of-(filter | flat filter-OR);
  // no "all of", no 3rd nesting level — exactly the canRepresentAsGrid shape.)
  if (override === 'advanced' && !canBuilder) return 'oql';
  return override || 'basic';
});
// Basic is available only when the query can be shown as basic chips: not a
// complex (non-URL-expressible) ?oql= query, AND the flat filters are
// chip-representable. A complex ?oql= query keeps the filter param empty, so the
// filter-only check alone would wrongly report it representable (#440).
const canUseBasic = computed(() => !isComplexQuery.value && basicRepresentable.value);

function onModeSelect(newMode) {
  if (newMode === mode.value) return;
  // The builder tabs are disabled when the query is too complex for the builder
  // shape (#523; the V2 builder joined the same gate in #603 round 7) — ignore a
  // click on it (the tab is also visually disabled).
  if (newMode === 'advanced' && !builderRepresentable.value) return;
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
  // mode is pure display chrome now (#492): switching it is a local state change, NOT
  // a navigation. Update the durable per-device pref AND the reactive session pick (the
  // latter is what re-renders the card with no URL write). List/table presentation
  // follows mode via the `mode` watcher → the reactive results-view store, so per-page
  // + the API fetch key stay consistent without any ?view=/?mode= param.
  try {
    localStorage.setItem(STORED_MODE_KEY, newMode);
  } catch (e) { /* private mode / quota — ignore */ }
  store.commit('setSerpModeOverride', newMode);
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

// ---- OQL tab (#441) -------------------------------------------------------
// The OQL text editor, promoted from the old side-by-side "view code" dialog to a
// top-level tab. It seeds from the current query and follows external query changes
// UNTIL the user starts typing their own OQL (tracked via oqlSeedBaseline), so an
// async seed / a post-submit URL collapse can populate it but never clobbers in-
// progress edits. Explicit submit (#600, Jason — reversing #530's auto-run and
// #587's live rewrite: both mutated things under the user's fingers, too jarring):
// while typing, the editor only validates (squiggles + badge); the Search button /
// ⌘Ctrl+Enter submits via onOqlRun — the same /q?oql= path the builder uses — and
// in the same gesture replaces the buffer with the server canonical ("format on
// save"). Half-formed (invalid) text can never submit (runnable gating below).
// Switching tabs discards the in-progress OQL (it reseeds from the live query on
// re-entry — no warning; nobody should do that on purpose).
const oqlTabText = ref('');
const oqlTabValidation = ref(null);
const oqlSeedBaseline = ref('');
// #611 r5 (Jason): teach by example — the empty-state hint shows real, runnable
// queries (each one prod-validated; note the author-name field is `display_name`,
// not `name`). Multi-line: OqlEditor renders a \n-bearing placeholder as a block.
const OQL_TAB_PLACEHOLDER = [
  'Type or paste OQL. Examples:',
  '',
  '•  works where title/abstract has (open and science)',
  '•  works where year > (2020) and type is (article)',
  '•  authors where display_name has (einstein)',
].join('\n');
// dirty = the text has diverged from what we last seeded in.
const oqlTabDirty = computed(() => oqlTabText.value !== oqlSeedBaseline.value);
// Activity status shown in the editor's badge slot: "querying" while a SERP fetch
// is in flight (isLoading brackets both the OQL execute and the legacy path in
// Serp.vue), else null — the editor's own valid/invalid badge takes the slot.
// #530's "typing" state died with auto-run (#600): an edit no longer has a run on
// the way, so there is nothing to foreshadow; validity is the whole story.
const oqlTabStatus = computed(() =>
  store.state.isLoading ? 'querying' : null
);
function onOqlTabValidation(v) {
  oqlTabValidation.value = v;
  // Pretty-print on seed: the query arrives URL-collapsed (single line). Once the
  // editor validates an UN-EDITED seed, adopt the server's canonical (pretty) form
  // so the tab opens tidied — no manual broom click. Updating text + baseline together
  // keeps it not-dirty; idempotent (canonical-of-canonical == canonical) so no loop.
  // Skipped once the user has diverged, so we never reformat text mid-edit.
  if (v?.valid && v.oql && !oqlTabDirty.value && v.oql !== oqlTabText.value) {
    seedOqlTab(v.oql);
  }
}
// Every edit invalidates the last /validate result until the editor re-validates the
// NEW text (the @validation round-trip is debounced). Without this, the keystroke→
// validation window leaves a stale-but-valid payload in place and Search would run
// the PREVIOUS query, not what's on screen. Cleared here, repopulated by @validation.
watch(oqlTabText, () => { oqlTabValidation.value = null; });
// Search / ⌘Ctrl+Enter (#600): the ONE moment we touch the user's text. Adopt the
// server canonical (parens + width-aware linebreaks/indent — the tidy string) via
// seedOqlTab (whose echo guard keeps the buffer byte-stable through the post-run URL
// reseed), then run. Submit doesn't lean on the linter's timing: if its result isn't
// in yet (it clears on every keystroke — type-then-immediately-⌘Enter), we /validate
// directly rather than dropping the gesture. Invalid text is a quiet no-op — the red
// badge tells that story.
async function submitOqlTab() {
  const text = (oqlTabText.value || '').trim();
  if (!text) return;
  let canonical =
    oqlTabValidation.value?.valid && oqlTabValidation.value.oql
      ? oqlTabValidation.value.oql
      : null;
  if (!canonical) {
    let res;
    try { res = await validateOql(text); } catch (e) { return; }
    if (text !== (oqlTabText.value || '').trim()) return; // kept typing — stale gesture
    if (!res?.valid || !res.oql) return;
    canonical = res.oql;
  }
  seedOqlTab(canonical);
  onOqlRun(canonical);
}
// Pretty form, pre-fetched in the BACKGROUND so the OQL tab opens already-tidied
// instead of flashing the URL-collapsed single line → pretty after the editor's own
// validate round-trip. `validateOql` is the very call the editor's linter makes, so
// the cached `oql` is byte-identical to what the editor would flip to → zero flash.
// Keyed to the raw seed it came from; runs on every seedOql change in ANY mode, so
// it's usually ready before the user clicks into OQL.
const prettySeed = ref({ raw: null, oql: null });
async function prefetchPrettySeed(raw) {
  const r = (raw || '').trim();
  if (!r) { prettySeed.value = { raw: '', oql: null }; return; }
  try {
    const res = await validateOql(r);
    if ((seedOql.value || '').trim() !== r) return; // seed moved on while fetching
    if (res?.valid && res.oql) prettySeed.value = { raw: r, oql: res.oql };
  } catch (e) { /* fall back to the editor's own in-place prettify on validate */ }
}
watch(seedOql, (s) => prefetchPrettySeed(s), { immediate: true });

function seedOqlTab(s) {
  const raw = (s || '').trim();
  // Echo guard (#600 r2): if the buffer ALREADY displays this exact query (submit just
  // wrote the pretty canonical in, and the post-run URL reseed echoes it back collapsed
  // to one line), keep the text byte-stable and only re-baseline. Without this the
  // buffer flashed pretty → collapsed → pretty while the results loaded.
  // #611: the guard is DIRECTIONAL. It exists to stop pretty→collapsed downgrades; it
  // must not ALSO swallow collapsed→pretty upgrades — on a direct boot into OQL mode
  // the initial seed races ahead of the pretty prefetch, the buffer starts collapsed,
  // and every later prettify attempt (the editor's own @validation pass, the prefetch
  // landing) arrives canonical-equal and was kept out by this guard: the tab stayed
  // one giant wrapped line forever. Same-query AND the incoming form isn't prettier
  // than what's shown → keep; same-query but incoming is multi-line while the buffer
  // is the collapsed single line → fall through and adopt the pretty form.
  if (raw && url.oqlForUrl((oqlTabText.value || '').trim()) === url.oqlForUrl(raw)) {
    const incomingPretty = raw !== url.oqlForUrl(raw);
    const shownText = (oqlTabText.value || '').trim();
    const shownCollapsed = shownText === url.oqlForUrl(shownText);
    if (!(incomingPretty && shownCollapsed)) {
      oqlSeedBaseline.value = oqlTabText.value;
      return;
    }
  }
  // prefer the pre-fetched pretty form when it matches this exact seed; else seed raw
  // and let onOqlTabValidation prettify in place once the editor validates (fallback).
  oqlTabText.value = (prettySeed.value.raw === raw && prettySeed.value.oql) || (s || '');
  oqlSeedBaseline.value = oqlTabText.value;
}
// NB: the OQL-tab watchers that read `mode` are registered LOWER in this file
// (after `basicRepresentable` is declared) — registering them here would evaluate
// the `mode` computed before `basicRepresentable` exists (TDZ) and crash setup.

// Returns true when it actually navigated (the callers drive the "querying" status
// off this — a no-op run must not claim to be querying).
function onOqlRun(oql, nav = 'push') {
  const trimmed = (oql || '').trim();
  if (!trimmed) return false;
  const next = url.oqlForUrl(trimmed);
  // Already the live query → nothing to run. (Keeps the auto-run from re-submitting
  // when an edit round-trips back to the current query.)
  if (next === (route.query.oql || '')) return false;
  store.commit('setOqlSubmitError', null);
  // Run via the entity-less `/q?oql=` submit path (OQL carries its own entity);
  // keep the current mode so the user stays in Builder/OQL. oqlForUrl collapses the
  // pretty-print layout so the URL stays single-line. (oxjob #373 Phase 2)
  const go = nav === 'replace' ? url.replaceToRoute : url.pushToRoute;
  go(router, {
    name: 'OqlQuery',
    query: { oql: next },
  });
  return true;
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
    query: { oql: next },
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
onBeforeUnmount(() => { autoRun.cancel(); });
// Drop any pending bootstrap mint the moment the route changes for any other
// reason (the dice, a shared link, back/forward) so a debounced run armed just
// before a navigation can't overwrite the new query with the old one.
// (oxjob #428 dice bug; the OQL-tab auto-run itself was removed in #600)
watch(() => route.fullPath, () => { autoRun.cancel(); });

// ---- filters / representability -------------------------------------------
const hasFiltersAvailable = computed(() =>
  facetConfigs(entityType.value).some((c) => c.actions?.includes('filter'))
);
const isComplexQuery = computed(() => {
  const xq = props.resultsObject?.meta?.x_query;
  return !!route.query.oql && !!xq && xq.url == null;
});
const basicRepresentable = computed(() => {
  // #492 Phase 3: source the active filters from the server-CANONICAL x_query (via
  // url.chipFilterStr), NOT route.query.filter — for an `?oql=` query the URL filter
  // param is empty, so representability can only be known from the canonical form.
  // This is what lets a basic-representable `?oql=` link open in the recipient's
  // preferred (basic) mode instead of being force-bumped to advanced. Guard the oql
  // case: a complex query (x_query.url == null) is never representable, and until THIS
  // query's response has settled we stay advanced rather than flash basic
  // (chipFilterStr falls back to the empty URL filter mid-flight → [] → would
  // otherwise read as trivially representable).
  if (route.query.oql) {
    const xq = props.resultsObject?.meta?.x_query;
    if (store.state.isLoading || !xq || xq.url == null) return false;
  }
  const filters = filtersFromUrlStr(entityType.value, url.chipFilterStr(route));
  // The basic bar has a FIXED number of chip slots (#440 r10 — no second-row
  // wrap, ever). More active filters than slots → force advanced, disable
  // Basic. (basicCanRepresent already rejects duplicate keys, so filters.length
  // is the active-chip count whenever it returns true.)
  return basicCanRepresent(entityType.value, filters)
    && filters.length <= chipSlotCount(entityType.value, isSemanticSearch.value);
});

// ---- grid representability (#523: builder ⇄ OQL gate) ----------------------
// The 2D grid builder (Advanced) renders only a restricted query shape (an AND of
// OR-groups, with one extra explicit-paren level per column). Anything outside →
// the Advanced tab is DISABLED and the user edits in OQL. Representability is a
// property of the server-computed render tree (`oql_render_v2.where`), so we probe
// it async — cached per canonical OQL — and surface a boolean. The gate is a property
// of the COMMITTED query the builder actually renders (`seedOql`), NOT in-progress
// OQL-tab text: probing the editor's live text flips the gate true on an UNSUBMITTED
// simplification and auto-switches to Advanced while the builder still holds the
// complex committed query — it then renders out of gate (found in browser verification,
// #523). So all gate moments flow through seedOql: a LOADED query/saved search; an
// OQL-tab edit that the user SUBMITS (→ seedOql updates → Advanced re-enables, a client
// route change with no reload, Test 4); a builder edit that overflows (→ mints a new
// ?oql= → seedOql updates → relocates to OQL, Test 10).
const gridProbe = ref({ oql: null, ok: true });
const _gridCache = new Map(); // canonical OQL -> bool (representable?)
async function probeGrid(oql) {
  const q = (oql || '').trim();
  if (!q) { gridProbe.value = { oql: '', ok: true }; return; } // empty query = empty grid
  if (_gridCache.has(q)) { gridProbe.value = { oql: q, ok: _gridCache.get(q) }; return; }
  try {
    const data = await api.getQuery({ oql: q });
    const ok = treeRepresentable(data?.oql_render_v2).ok;
    _gridCache.set(q, ok);
    gridProbe.value = { oql: q, ok };
  } catch (e) {
    // A parse/transport failure → can't safely show in the grid; fall to OQL.
    gridProbe.value = { oql: q, ok: false };
  }
}
// Probe the COMMITTED seed (load, OQL-tab submit, and the builder's post-edit ?oql=
// mint all flow through seedOql). Immediate so the gate is known as soon as a query
// is present. Deliberately NOT wired to the OQL editor's in-progress text — see above.
watch(seedOql, (s) => probeGrid(s), { immediate: true });
// True unless the probe has CONFIRMED the current query is non-representable. We stay
// optimistic while a probe is in flight (the common query IS representable — don't
// pre-disable Advanced and flash); the probe flips it false only for genuinely
// too-complex trees. Reads only `gridProbe` (a ref) → no cycle with `mode`.
const builderRepresentable = computed(() => gridProbe.value.ok !== false);

// One quiet, non-blocking note when a builder edit overflowed the grid and got
// relocated to the OQL tab (Test 10). Shown until the user leaves OQL or simplifies.
const gridOverflowNote = ref(false);
watch(mode, (now, was) => {
  if (was === 'advanced' && now === 'oql' && !builderRepresentable.value) {
    gridOverflowNote.value = true;
  } else if (now !== 'oql' || builderRepresentable.value) {
    gridOverflowNote.value = false;
  }
});

// List/table presentation is derived from the mode (#440 r5) and is recipient-
// local CHROME kept off the URL (#492). Mirror mode → the reactive results-view
// store WITHOUT persisting, so getPerPage / the API fetch key (url.isTableView)
// agree with the shown mode. persist:false leaves the durable list/table pref
// (oax.resultsView, written only by the flag-off toggle) untouched. Registered
// after basicRepresentable because `mode` reads it, and this fires immediately.
watch(mode, (m) => {
  store.commit('setSerpResultsView', {
    value: m === 'basic' ? 'list' : 'table',
    persist: false,
  });
}, { immediate: true });

// ---- OQL-tab seeding watchers (must live BELOW basicRepresentable) ----------
// These read `mode`, so they can only be registered after `basicRepresentable` is
// initialized — registering them up by the OQL-tab state would evaluate the `mode`
// computed during the TDZ of `basicRepresentable` and crash setup. (See the note
// up there.) Entering the OQL tab seeds the editor from the current query.
watch(mode, (m, prev) => {
  if (m === 'oql' && prev !== 'oql') seedOqlTab(seedOql.value);
});
// While in the tab, follow external query changes (async translate, post-submit URL
// collapse) only as long as the user hasn't diverged from the last seed.
watch(seedOql, (s) => {
  if (mode.value === 'oql' && !oqlTabDirty.value) seedOqlTab(s);
});
// #611: when the pretty prefetch lands AFTER the tab was already seeded (the direct-
// boot-into-OQL race: onMounted seeds the collapsed ?oql= before validateOql returns),
// re-seed with the pretty form. seedOqlTab's directional echo guard makes this a no-op
// unless the buffer is still the un-edited collapsed seed, and oqlTabDirty protects
// in-progress edits — so this can never reformat under the user's fingers.
watch(prettySeed, (p) => {
  if (
    mode.value === 'oql' && !oqlTabDirty.value && p.oql
    && p.raw === (seedOql.value || '').trim()
  ) seedOqlTab(p.oql);
});
onMounted(() => {
  if (mode.value === 'oql') seedOqlTab(seedOql.value);
});

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
  if (selectedCount.value > 0 && mode.value !== 'basic') {
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
   across the full viewport width. OQL (#611 r5): the editor card keeps the
   narrow measure (a viewport-wide code editor reads poorly) but the results
   region is full-width — it's the same table as Advanced now. */
.serp-input-container--basic .search-card,
.serp-input-container--basic .serp-results-region,
.serp-input-container--oql .search-card {
  max-width: 970px; /* r10: 720px felt cramped — ~35% wider */
  min-width: 480px;
}
/* The embedded query builder caps itself at 900px (its playground default) —
   in Advanced mode it must span the full column, same as the results table
   (#440 r8). Overridden here rather than editing OqlQueryBuilder (concurrent
   #428 work lives there). */
.serp-input-container--advanced :deep(.builder),
.serp-input-container--advanced2 :deep(.builder) {
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
.serp-input-container--advanced :deep(th.results-table-header),
.serp-input-container--advanced2 :deep(th.results-table-header),
.serp-input-container--oql :deep(th.results-table-header) {
  font-size: 12px !important;
  font-weight: 500 !important;
  color: rgba(0, 0, 0, 0.48) !important;
}

/* r11 WWLD: the column row is PURE labels — its select-all + AddColumn (+) are
   hidden here (both actions live in the results header above). The flag-off
   table keeps them (scoped CSS, shared component untouched). */
.serp-input-container--advanced :deep(th.checkbox-cell .v-selection-control),
.serp-input-container--advanced2 :deep(th.checkbox-cell .v-selection-control),
.serp-input-container--oql :deep(th.checkbox-cell .v-selection-control) {
  display: none;
}
.serp-input-container--advanced :deep(th.add-column-cell .v-btn),
.serp-input-container--advanced2 :deep(th.add-column-cell .v-btn),
.serp-input-container--oql :deep(th.add-column-cell .v-btn) {
  display: none;
}
/* Whole-cell header click target (Linear): the hover bg fills the entire th,
   not a small rounded box inside it. The th's padding moves onto the trigger. */
.serp-input-container--advanced :deep(th.results-table-header),
.serp-input-container--advanced2 :deep(th.results-table-header),
.serp-input-container--oql :deep(th.results-table-header) {
  padding: 0;
}
.serp-input-container--advanced :deep(th.results-table-header.checkbox-cell),
.serp-input-container--advanced2 :deep(th.results-table-header.checkbox-cell),
.serp-input-container--oql :deep(th.results-table-header.checkbox-cell),
.serp-input-container--advanced :deep(th.results-table-header.add-column-cell),
.serp-input-container--advanced2 :deep(th.results-table-header.add-column-cell),
.serp-input-container--oql :deep(th.results-table-header.add-column-cell) {
  padding: 8px 10px;
}
.serp-input-container--advanced :deep(th.results-table-header .column-header-trigger),
.serp-input-container--advanced2 :deep(th.results-table-header .column-header-trigger),
.serp-input-container--oql :deep(th.results-table-header .column-header-trigger) {
  margin: 0;
  padding: 8px 10px;
  border-radius: 0;
}
.serp-input-container--advanced :deep(th.results-table-header .column-header-trigger:hover),
.serp-input-container--advanced2 :deep(th.results-table-header .column-header-trigger:hover),
.serp-input-container--oql :deep(th.results-table-header .column-header-trigger:hover) {
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
