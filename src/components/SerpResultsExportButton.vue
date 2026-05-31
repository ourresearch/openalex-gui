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
            <div class="mb-4 text-body-2" v-if="rateLimitData && !hasInsufficientTokens">
              Exporting these {{ resultsCount.toLocaleString() }} rows will cost approximately
              {{ formatUsd(costUsd) }} of your remaining
              {{ formatUsd(totalAvailableUsd) }} budget.
            </div>
            <div class="mb-4 text-body-2 text-error" v-else-if="rateLimitData && hasInsufficientTokens">
              This export costs approximately {{ formatUsd(costUsd) }},
              but you only have {{ formatUsd(totalAvailableUsd) }} remaining.
            </div>
            <div class="mb-4 text-body-2" v-else>
              Exporting {{ resultsCount.toLocaleString() }} rows.
            </div>

            <v-select
              v-model="exportFormat"
              label="Select format"
              :items="formatOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
            />

            <v-checkbox
              v-if="entityType === 'works'"
              v-model="includeAbstracts"
              label="Include abstracts (increases download size)"
              density="compact"
              hide-details
              class="mt-4"
            />

            <!-- Inline column editor (CSV only) — the full three-column picker,
                 the SAME component table view uses (job #304). Edits are
                 EPHEMERAL: the draft seeds from the user's current column set
                 but only shapes THIS export; it is never written back to the
                 shared `column=` / localStorage state. The chip rail IS the CSV
                 header row (no separate preview). Hidden for RIS/WoS. -->
            <template v-if="isCsvFormat">
              <v-divider class="mt-4" />
              <div class="d-flex align-center mt-3 mb-1">
                <span class="text-subtitle-2">Columns</span>
                <v-spacer />
                <v-btn variant="text" size="small" class="text-none" @click="openInTableView">
                  Open in table view
                  <v-icon end size="16">mdi-table-arrow-right</v-icon>
                </v-btn>
              </div>
              <div class="text-caption text-medium-emphasis mb-1">
                These become the CSV's columns, in this order. Editing here affects only this export.
              </div>
              <column-editor-panel
                v-model="exportColumnKeys"
                :entity-type="entityType"
                height="46vh"
              />
            </template>
          </v-card-text>
          <v-card-actions class="pa-4 pt-2">
            <v-spacer />
            <v-btn variant="text" @click="closeExportDialog">Cancel</v-btn>
            <v-btn
              color="primary"
              rounded
              :disabled="!exportFormat || hasInsufficientTokens"
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
import ColumnEditorPanel from '@/components/Results/Table/ColumnEditorPanel.vue';

const store = useStore();
const route = useRoute();
const router = useRouter();

// Dialog state
const showSignInDialog = ref(false);
const showExportDialog = ref(false);
const exportState = ref('initial'); // 'initial' or 'submitted'
const exportFormat = ref(null);
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
  { label: 'CSV (Excel-optimized)', value: 'csv-excel' },
  { label: 'CSV (standard)', value: 'csv' },
  { label: 'Endnote', value: 'ris' },
  { label: 'Text', value: 'wos-plaintext' },
];
const csvOnlyFormatOptions = [
  { label: 'CSV (Excel-optimized)', value: 'csv-excel' },
  { label: 'CSV (standard)', value: 'csv' },
];

// Computed
const resultsCount = computed(() => store.state?.resultsObject?.meta?.count ?? 0);
const userId = computed(() => store.getters['user/userId']);
const userApiKey = computed(() => store.getters['user/apiKey']);
const isLoggedIn = computed(() => !!userId.value);
const entityType = computed(() => store.getters.entityType);
const formatOptions = computed(() => entityType.value === 'works' ? allFormatOptions : csvOnlyFormatOptions);
const isCsvFormat = computed(() => exportFormat.value === 'csv' || exportFormat.value === 'csv-excel');
// Widen the dialog only when the inline column editor is showing (CSV formats).
const dialogMaxWidth = computed(() => isCsvFormat.value ? 960 : 420);
const perPage = computed(() => entityType.value === 'works' ? 100 : 200);
const queriesNeeded = computed(() => Math.ceil(resultsCount.value / perPage.value));

// Live source of truth for the user's column selection (URL > localStorage >
// per-entity defaults). Shared with the table-view picker so CSV export is a
// faithful snapshot of what the user sees / would see (job #304).
const { columnKeys } = useColumnsState(entityType);

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
  // Check top-level search params
  const topLevelSearchKeys = [
    'search', 'search.exact', 'search.semantic',
    'search.title', 'search.title.exact',
    'search.title_and_abstract', 'search.title_and_abstract.exact',
  ];
  if (topLevelSearchKeys.some(k => route.query[k])) {
    return true;
  }
  // Check for search-type filters in the filter= param
  const filterStr = route.query.filter;
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
  exportFormat.value = null;
  submittedExport.value = null;
  includeAbstracts.value = false;
  // Seed the ephemeral export-column draft from the live shared selection so the
  // dialog opens WYSIWYG (whatever table view would show).
  exportColumnKeys.value = [...columnKeys.value];
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

// "Open in table view" — an explicit nav that PROMOTES the current ephemeral
// draft to the shared column state (writing `column=` + switching to table view)
// so the user can inspect the actual cell values. Distinct from in-dialog
// editing, which stays ephemeral.
function openInTableView() {
  url.setColumn([...exportColumnKeys.value]);
  url.setResultsView('table');
  closeExportDialog();
}

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
  if (filterStr) {
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
  
  // Pass search params so the backend includes them in query_url
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
    const msg = error.response?.status === 403 && error.response?.data?.message
      ? error.response.data.message
      : 'Export failed. Please try again.';
    store.commit('snackbar', msg);
    closeExportDialog();
  }
}

defineExpose({ openExportDialog });
</script>
