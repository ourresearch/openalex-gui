<template>
  <span>
    <v-tooltip location="top" aria-label="Export results">
      <template v-slot:activator="{props}">
          <v-btn v-bind="props" icon aria-label="Export results" @click="openExportDialog">
            <v-icon color="grey-darken-1">mdi-tray-arrow-down</v-icon>
          </v-btn>
      </template>
      <div v-if="!isLoggedIn">
        Log in to export results
      </div>
      <div v-else>Export results</div>
    </v-tooltip>

    <!-- Sign in required dialog -->
    <v-dialog v-model="showSignInDialog" max-width="400">
      <v-card>
        <div class="d-flex align-center pa-4 pb-0">
          <span class="text-h6">Sign in required</span>
          <v-spacer />
          <v-btn icon variant="text" size="small" @click="showSignInDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider class="mt-3" />
        <v-card-text class="pt-4">
          You need a user account in order to export results. Sign up is free and takes less than one minute.
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            color="primary"
            rounded
            @click="goToSignUp"
          >
            Sign up for free
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Export dialog for logged-in users. Widens when a CSV format is picked so
         the inline column editor (job #304) fits; stays narrow otherwise. -->
    <v-dialog v-model="showExportDialog" :max-width="dialogMaxWidth" :persistent="exportState === 'submitted'">
      <v-card>
        <!-- Header -->
        <div class="d-flex align-center pa-4 pb-0">
          <span class="text-h6">
            {{ exportState === 'submitted' ? 'Export submitted' : 'Export results' }}
          </span>
          <v-spacer />
          <v-btn icon variant="text" size="small" @click="closeExportDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider class="mt-3" />

        <!-- Pre-submission state -->
        <template v-if="exportState === 'initial'">
          <v-card-text class="pt-4">
            <!-- Cost / scope summary, set off in a soft info box rather than
                 left hanging loose at the top of the dialog. -->
            <div class="export-info-box d-flex align-start" :class="{ 'export-info-box--warn': hasInsufficientTokens || isOqlExportBlocked }">
              <v-icon size="18" class="export-info-box__icon">
                {{ (hasInsufficientTokens || isOqlExportBlocked) ? 'mdi-alert-circle-outline' : 'mdi-information-outline' }}
              </v-icon>
              <div class="text-body-2">
                <template v-if="isOqlExportBlocked">
                  The query hasn't finished loading yet — close this dialog and
                  try again in a moment.
                </template>
                <template v-else-if="rateLimitData && !hasInsufficientTokens">
                  Exporting these {{ resultsCount.toLocaleString() }} {{ rowsNoun }} will cost approximately
                  {{ formatUsd(costUsd) }} of your remaining {{ formatUsd(totalAvailableUsd) }} budget.
                </template>
                <template v-else-if="rateLimitData && hasInsufficientTokens">
                  This export costs approximately {{ formatUsd(costUsd) }}, but you only have
                  {{ formatUsd(totalAvailableUsd) }} remaining.
                </template>
                <template v-else>
                  Exporting {{ resultsCount.toLocaleString() }} {{ rowsNoun }}.
                </template>
              </div>
            </div>

            <!-- Settings group (Format + Include abstracts), Linear-style rows:
                 stacked label + muted description left, control pinned right,
                 hairline divider between rows (trailing divider removed). -->
            <div class="export-settings-group">
              <div class="export-setting-row d-flex align-center">
                <div class="export-setting-row__text pr-4">
                  <div class="export-setting-row__label">Format</div>
                  <div class="export-setting-row__desc">
                    How would you like results presented?
                  </div>
                </div>
                <v-spacer />
                <v-select
                  v-model="exportFormat"
                  :items="formatOptions"
                  item-title="label"
                  item-value="value"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="export-setting-row__control"
                />
              </div>

              <div v-if="entityType === 'works'" class="export-setting-row d-flex align-center">
                <div class="export-setting-row__text pr-4">
                  <div class="export-setting-row__label">Include abstracts?</div>
                  <div class="export-setting-row__desc">
                    Dramatically increases export file size.
                  </div>
                </div>
                <v-spacer />
                <v-switch
                  v-model="includeAbstracts"
                  color="grey-darken-4"
                  density="compact"
                  hide-details
                  inset
                  class="export-setting-row__switch"
                />
              </div>
            </div>

            <!-- Inline column editor (CSV only) — the full three-column picker,
                 the SAME component table view uses (job #304). Edits are
                 EPHEMERAL: the draft seeds from the user's current column set
                 but only shapes THIS export; it is never written back to the
                 shared `column=` / localStorage state. The chip rail IS the CSV
                 header row (no separate preview). Hidden for RIS/WoS. -->
            <div v-if="isCsvFormat || isPresetFormat" class="export-columns-section">
              <div class="d-flex align-center mb-2">
                <span class="export-section-title">
                  {{ isPresetFormat ? 'Columns to export (preset)' : 'Select columns to export' }}
                </span>
                <v-spacer />
                <!-- "Open in table view" disabled (Jason, 2026-06-01): an
                     out-of-band way to edit the table is idiosyncratic; nobody
                     else does this. Kept commented (+ handler below) in case we
                     want it back.
                <v-btn v-if="isCsvFormat" variant="text" size="small" class="text-none" @click="openInTableView">
                  Open in table view
                  <v-icon end size="16">mdi-table-arrow-right</v-icon>
                </v-btn>
                -->
              </div>
              <column-editor-panel
                v-model="exportColumnKeys"
                :entity-type="entityType"
                height="46vh"
                :disabled="isPresetFormat"
                :preset-labels="presetColumns"
              />
            </div>
          </v-card-text>
          <v-card-actions class="pa-4 pt-2">
            <v-spacer />
            <v-btn variant="text" @click="closeExportDialog">Cancel</v-btn>
            <v-btn
              color="primary"
              rounded
              :disabled="!exportFormat || hasInsufficientTokens || isOqlExportBlocked"
              @click="startExport"
            >
              Start export
            </v-btn>
          </v-card-actions>
        </template>

        <!-- Post-submission state -->
        <template v-else-if="exportState === 'submitted'">
          <v-card-text class="pt-4">
            <div class="mb-3">
              <template v-if="submittedExport?.queue_position === 1 || submittedExport?.status === 'running'">
                Your export is running now.
              </template>
              <template v-else-if="submittedExport?.queue_position">
                You are position <strong>{{ submittedExport.queue_position }}</strong> of 
                <strong>{{ submittedExport.queue_total }}</strong> in the queue.
              </template>
              <template v-else>
                Your export has been queued.
              </template>
            </div>
            <div>
              You can track your export's progress in 
              <router-link :to="{ name: 'settings-exports' }">Settings → Exports</router-link>.
            </div>
          </v-card-text>
          <v-card-actions class="pa-4 pt-2">
            <v-spacer />
            <v-btn color="primary" rounded @click="closeExportDialog">
              Done
            </v-btn>
          </v-card-actions>
        </template>
      </v-card>
    </v-dialog>
  </span>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { formatUsd, creditsToUsd } from '@/store';
import { url } from '@/url';
import { useColumnsState } from '@/composables/useColumnsState';
import { getColumnExportSpecs } from '@/components/Results/Table/columnConfig';
import { resolveExportSelection, idsOpenAlexFilter } from '@/utils/selectionExport';
import ColumnEditorPanel from '@/components/Results/Table/ColumnEditorPanel.vue';

const store = useStore();
const route = useRoute();
const router = useRouter();

// Dialog state
const showSignInDialog = ref(false);
const showExportDialog = ref(false);
const exportState = ref('initial'); // 'initial' or 'submitted'
// Default to CSV (Excel-optimized) so the inline column editor is visible
// immediately on open — column selection is the headline of the dialog (job #304).
const exportFormat = ref('csv-excel');
const rateLimitData = ref(null);
const submittedExport = ref(null);
const includeAbstracts = ref(false);

// Ephemeral column draft for THIS export only (job #304). Seeded from the shared
// column state on dialog open, edited via the inline ColumnEditorPanel, and read
// at export time — but deliberately NEVER written back to useColumnsState (no URL
// / localStorage mutation), so editing export columns doesn't disturb table view.
const exportColumnKeys = ref([]);

// All format options (works gets all, non-works gets CSV only)
const allFormatOptions = [
  { label: 'CSV (Excel)', value: 'csv-excel' },
  { label: 'CSV', value: 'csv' },
  { label: 'Endnote', value: 'ris' },
  { label: 'Text', value: 'wos-plaintext' },
];
const csvOnlyFormatOptions = [
  { label: 'CSV (Excel)', value: 'csv-excel' },
  { label: 'CSV', value: 'csv' },
];

// Computed
// When the user has ticked specific rows, the export is scoped to just those
// (ZD #8373 / #388): resolve the selection here, and let resultsCount / the
// cost line / the export request all key off it. Falls back to the full set in
// select-all mode or when the selection is empty / too large to inline.
const exportSelection = computed(() => resolveExportSelection(store.state.selection));

// OQL-mode export scoping: on /q the query lives only in `?oql=`, never in
// `filter=`/`search=` route params, so the classic param-copying below would
// send an UNFILTERED request — which the backend treats as "export the entire
// corpus" (bit us with 319M-row export attempts). Instead, send the server's
// canonical OQL echo as `oql=`; the users-api export endpoint stores a root
// `/?oql=` query_url and the worker cursor-paginates it like any classic URL.
// This covers every OQL shape, including ones with no classic-URL equivalent
// (nested boolean trees, corpus selector).
const isOqlMode = computed(() => !!route.query.oql);
const canonicalOql = computed(() => store.state.resultsObject?.meta?.x_query?.oql ?? null);
// Defensive: the dialog only opens once results (and their x_query echo) have
// landed, so a missing canonical OQL should be unreachable — but if it ever
// happens we must block rather than fall through to an unfiltered request.
const isOqlExportBlocked = computed(
  () => isOqlMode.value && !exportSelection.value.scoped && !canonicalOql.value
);
const resultsCount = computed(() =>
  exportSelection.value.scoped
    ? exportSelection.value.count
    : (store.state?.resultsObject?.meta?.count ?? 0)
);
const rowsNoun = computed(() => exportSelection.value.scoped ? 'selected rows' : 'rows');
const userId = computed(() => store.getters['user/userId']);
const userApiKey = computed(() => store.getters['user/apiKey']);
const isLoggedIn = computed(() => !!userId.value);
const entityType = computed(() => store.getters.entityType);
const formatOptions = computed(() => entityType.value === 'works' ? allFormatOptions : csvOnlyFormatOptions);
const isCsvFormat = computed(() => exportFormat.value === 'csv' || exportFormat.value === 'csv-excel');

// RIS (Endnote) and WoS-plaintext (Text) are fixed-shape, works-only presets —
// the user can't pick columns. We still show the column picker for continuity,
// but disabled, with the preset's fields listed as static chips. These lists
// mirror the server serializers in openalex-users-api (formats/ris.py and
// formats/wos_plaintext.py), in emitted order, as human-readable labels.
const PRESET_COLUMNS = {
  ris: [
    'Type', 'Title', 'Publication year', 'Publisher', 'ISSN', 'Source', 'DOI',
    'DOI URL', 'Publication date', 'Authors', 'Affiliations', 'Language',
    'Keywords', 'Volume', 'Issue', 'First page', 'Last page', 'Abstract',
  ],
  'wos-plaintext': [
    'Publication type', 'Authors', 'Author full names', 'Title', 'Source',
    'Language', 'Document type', 'Author addresses', 'Organizations',
    'Corresponding author', 'ResearcherIDs', 'ORCIDs', 'Funding',
    'Citation count', 'Reference count', 'Publisher', 'ISSN', 'eISSN',
    'Publication month', 'Publication year', 'Volume', 'Issue', 'First page',
    'Last page', 'DOI', 'Page count', 'PubMed ID', 'Open access status',
    'Export date',
  ],
};
const isPresetFormat = computed(() => exportFormat.value in PRESET_COLUMNS);
const presetColumns = computed(() => PRESET_COLUMNS[exportFormat.value] ?? []);
// Fixed dialog width across all formats — switching to Endnote/Text no longer
// resizes the dialog (the jarring shrink). 760 fits the 50/50 column editor.
const dialogMaxWidth = 760;
const perPage = computed(() => entityType.value === 'works' ? 100 : 200);
const queriesNeeded = computed(() => Math.ceil(resultsCount.value / perPage.value));

// Live source of truth for the user's column selection (URL > localStorage >
// per-entity defaults). Shared with the table-view picker so CSV export is a
// faithful snapshot of what the user sees / would see (job #304).
const { columnKeys, defaultColumnKeys } = useColumnsState(entityType);

// Search-type filters that trigger 10x pricing (mirrors endpointClassifier.ts)
const SEARCH_FILTERS = [
  'abstract.search',
  'default.search',
  'display_name.search',
  'fulltext.search',
  'keyword.search',
  'raw_affiliation_strings.search',
  'raw_author_name.search',
  'title.search',
  'title_and_abstract.search',
];

const isSearchQuery = computed(() => {
  // OQL exports page the root /?oql= endpoint, which the api proxy prices at
  // the 1-credit list rate regardless of search content — mirror that here
  // (the users-api credit pre-check applies the same rule).
  if (isOqlMode.value) return false;
  const effectiveQuery = route.query;
  // Check top-level search params
  const topLevelSearchKeys = [
    'search', 'search.exact', 'search.semantic',
    'search.title', 'search.title.exact',
    'search.title_and_abstract', 'search.title_and_abstract.exact',
  ];
  if (topLevelSearchKeys.some(k => effectiveQuery[k])) {
    return true;
  }
  // Check for search-type filters in the filter= param
  const filterStr = effectiveQuery.filter;
  if (filterStr && SEARCH_FILTERS.some(f => filterStr.includes(f))) {
    return true;
  }
  return false;
});

const creditCostPerPage = computed(() => {
  if (isSearchQuery.value) return 10;
  return 1;
});

const creditsNeeded = computed(() => queriesNeeded.value * creditCostPerPage.value);
const costUsd = computed(() => creditsToUsd(creditsNeeded.value));

const totalAvailableUsd = computed(() => {
  if (!rateLimitData.value) return 0;
  return (rateLimitData.value.daily_remaining_usd || 0) + (rateLimitData.value.prepaid_remaining_usd || 0);
});

const hasInsufficientTokens = computed(() => {
  if (!rateLimitData.value) return false;
  return costUsd.value > totalAvailableUsd.value;
});

// Methods
function openExportDialog() {
  if (!isLoggedIn.value) {
    showSignInDialog.value = true;
    return;
  }
  
  // Reset state
  exportState.value = 'initial';
  exportFormat.value = 'csv-excel';
  submittedExport.value = null;
  includeAbstracts.value = false;
  // Seed the ephemeral export-column draft from EXACTLY what's on screen (job
  // #304): in table view that's the table's current columns; in list view it's
  // the entity's default columns (what the list item represents). List view
  // deliberately does NOT use columnKeys — that would inherit a stale localStorage
  // table customization, so a fresh page load would show last time's selection
  // instead of the on-screen data.
  exportColumnKeys.value = url.isTableView(route)
    ? [...columnKeys.value]
    : [...defaultColumnKeys.value];
  showExportDialog.value = true;
  
  // Fetch rate limit data
  fetchRateLimit();
}

function closeExportDialog() {
  showExportDialog.value = false;
  exportState.value = 'initial';
  exportFormat.value = null;
  submittedExport.value = null;
}

function goToSignUp() {
  showSignInDialog.value = false;
  router.push({ name: 'Signup', query: { redirect: route.fullPath } });
}

// "Open in table view" — DISABLED (Jason, 2026-06-01): editing the table
// out-of-band from the export dialog is idiosyncratic. Kept (with the button in
// the template) in case we want it back. It PROMOTES the ephemeral draft to the
// shared column state (writes `column=` + switches to table view) in ONE
// navigation — two separate setColumn/setResultsView calls race (router.push is
// async; the second reads the stale query and drops `column=`). See url.js.
// function openInTableView() {
//   url.setColumnsAndResultsView([...exportColumnKeys.value], 'table');
//   closeExportDialog();
// }

async function fetchRateLimit() {
  if (!userApiKey.value) return;
  
  try {
    const resp = await axios.get(
      `https://api.openalex.org/rate-limit?api_key=${userApiKey.value}`
    );
    rateLimitData.value = resp.data.rate_limit;
  } catch (err) {
    console.error('Failed to fetch rate limit:', err);
    rateLimitData.value = null;
  }
}

async function startExport() {
  const filterStr = route.query.filter;
  // If specific rows are ticked, export ONLY those by re-querying with an
  // `ids.openalex:` filter; the selected ids fully determine the set, so we
  // drop the page's own filter/search params below (ZD #8373 / #388).
  const selection = exportSelection.value;

  // Determine actual format and truncate setting
  let actualFormat = exportFormat.value;
  let truncate = false;

  if (exportFormat.value === 'csv-excel') {
    actualFormat = 'csv';
    truncate = true;
  }

  const params = new URLSearchParams({
    format: actualFormat,
    truncate: truncate,
  });
  if (selection.scoped) {
    params.set('filter', idsOpenAlexFilter(selection.ids));
  } else if (isOqlMode.value) {
    // OQL mode: send the canonical OQL echo. Bail if it's somehow missing —
    // NEVER fall through to an unfiltered request, which the backend would
    // run as a whole-corpus export.
    if (!canonicalOql.value) {
      store.commit('snackbar', 'The query is still loading — please try again.');
      closeExportDialog();
      return;
    }
    params.set('oql', canonicalOql.value);
  } else if (filterStr) {
    params.set('filter', filterStr);
  }

  // CSV export is a snapshot of the user's current column selection (#304
  // C-lite). Read the live `column=` keys via useColumnsState, translate
  // each to its server export spec via getColumnExportSpec, and send as
  // URL-encoded JSON `columns_v2`. Non-CSV formats (RIS, WoS) are fixed
  // shape and don't take a column list.
  const isCsv = actualFormat === 'csv';
  if (isCsv) {
    // Build the manifest from the ephemeral export draft (job #304), NOT the
    // shared columnKeys — so any in-dialog edits are honored without having
    // mutated the table-view state.
    const keys = [...exportColumnKeys.value];
    if (entityType.value === 'works' && includeAbstracts.value && !keys.includes('abstract')) {
      keys.push('abstract');
    }
    const specs = getColumnExportSpecs(entityType.value, keys);
    if (specs.length) {
      params.set('columns_v2', JSON.stringify(specs));
    }
  }
  
  // Pass search params so the backend includes them in query_url. Skipped for a
  // scoped (ids.openalex) export — the id list already pins the exact rows, and
  // ANDing a `search=` clause would only risk dropping a selected row. Skipped
  // in OQL mode too: search params (if any) already arrived via the derived
  // x_query.url params above, and route.query has none on /q.
  if (!selection.scoped && !isOqlMode.value) {
    const searchParamKeys = [
      'search', 'search.exact', 'search.semantic',
      'search.title', 'search.title.exact',
      'search.title_and_abstract', 'search.title_and_abstract.exact',
    ];
    for (const key of searchParamKeys) {
      if (route.query[key]) {
        params.set(key, route.query[key]);
      }
    }
  }

  // Include XPAC works if the parameter is set in the URL
  if (route.query.include_xpac === 'true') {
    params.set('include_xpac', 'true');
  }

  try {
    const resp = await axios.get(
      `${urlBase.userApi}/export/${entityType.value}?${params.toString()}`,
      axiosConfig({ userAuth: true })
    );
    console.log('startExport resp:', resp);
    submittedExport.value = resp.data;
    exportState.value = 'submitted';
  } catch (error) {
    console.error('Export failed:', error);
    const msg = [400, 403].includes(error.response?.status) && error.response?.data?.message
      ? error.response.data.message
      : 'Export failed. Please try again.';
    store.commit('snackbar', msg);
    closeExportDialog();
  }
}

defineExpose({ openExportDialog });
</script>

<style scoped>
/* Soft info box for the cost/scope line — keeps it from floating loose at the
   top of the dialog. Warn variant when the budget is insufficient. */
.export-info-box {
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.035);
  color: #3A3A3A;
}
.export-info-box__icon {
  color: rgba(0, 0, 0, 0.45);
  margin-top: 1px;
}
.export-info-box--warn {
  background: rgba(211, 47, 47, 0.08);
  color: #B3261E;
}
.export-info-box--warn .export-info-box__icon {
  color: #B3261E;
}

/* Even rhythm between the three main sections (info → settings → columns). */
.export-settings-group {
  margin-top: 24px;
}
.export-columns-section {
  margin-top: 36px;
}

/* Linear-style settings row, mirroring src/components/Settings/SettingsRow.vue:
   stacked label + muted description on the left, control pinned right, hairline
   divider between rows. Inlined (not the shared component) so the row padding
   aligns with the dialog's own v-card-text padding rather than a settings card. */
.export-setting-row {
  padding: 14px 0;
  border-bottom: 1px solid #F0F0F0;
  gap: 24px;
}
/* No dangling divider under the last row before the whitespace gap. */
.export-settings-group .export-setting-row:last-child {
  border-bottom: none;
}
.export-setting-row__text {
  flex: 1 1 auto;
  min-width: 0;
}
.export-setting-row__label {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A1A;
  line-height: 1.4;
}
.export-setting-row__desc {
  font-size: 13px;
  font-weight: 400;
  color: #6B6B6B;
  line-height: 1.4;
  margin-top: 2px;
}
/* Keep the format dropdown compact and right-aligned — no longer full-width. */
.export-setting-row__control {
  flex: 0 0 auto;
  width: 200px;
}

/* Section title above the column editor — dominant weight, distinct from the
   muted setting descriptions. */
.export-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A1A;
}

/* Make the toggle read clearly (Linear-style): dark when on (color prop), and a
   visibly grey track when off — the default inset track was nearly invisible. */
.export-setting-row__switch :deep(.v-selection-control:not(.v-selection-control--dirty) .v-switch__track) {
  background-color: rgba(0, 0, 0, 0.25);
  opacity: 1;
}
</style>
