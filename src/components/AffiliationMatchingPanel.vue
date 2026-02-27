<template>
  <div>
    <v-card variant="outlined" class="pa-4 mb-10 mt-n2 bg-white">
      <!-- Search row -->
      <div class="d-flex align-center flex-wrap ga-2 mb-3">
        <span class="text-body-2 text-grey-darken-1">Show affiliations that contain</span>
        <v-text-field
          v-model="searchQuery"
          placeholder="anything"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          autocomplete="off"
          name="affiliation-search-nofill"
          class="search-field"
          @update:model-value="debouncedSearch"
        >
          <template #append-inner>
            <v-tooltip location="top">
              <template v-slot:activator="{ props: tooltipProps }">
                <v-icon
                  v-bind="tooltipProps"
                  size="20"
                  :disabled="!institutionId"
                  :class="{ 'text-disabled': !institutionId }"
                  style="cursor: pointer; opacity: 0.6;"
                  @click.stop="openSuggestionsDialog"
                >
                  mdi-auto-fix
                </v-icon>
              </template>
              Suggest names to search
            </v-tooltip>
          </template>
        </v-text-field>
      </div>

      <!-- Filter row -->
      <div class="d-flex align-center ga-2">
        <span class="text-body-2 text-grey-darken-1 text-no-wrap">and are</span>
        <v-select
          v-model="matchingFilter"
          :items="linkFilterOptions"
          variant="outlined"
          density="compact"
          hide-details
          class="link-filter-select"
        />
        <div class="flex-grow-1" style="min-width: 0;">
          <slot name="institution-selector" />
        </div>
      </div>
    </v-card>

    <!-- Results Info Row -->
    <div class="d-flex align-center mb-3">
      <!-- Results count or selection count -->
      <span v-if="selectedIds.size > 0" class="text-body-2 font-weight-bold">
        {{ selectedIds.size }} affiliation{{ selectedIds.size === 1 ? '' : 's' }} selected
      </span>
      <span v-else class="text-body-2 text-grey-darken-1">
        {{ resultsRangeText }}
      </span>

      <!-- Selection actions -->
      <template v-if="selectedIds.size > 0">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              size="small"
              class="ml-4"
              :loading="isCurating"
              :disabled="isCurating"
              @click="submitCurations('add')"
            >
              Link
            </v-btn>
          </template>
          Link to target institution
        </v-tooltip>

        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              size="small"
              class="ml-2"
              :loading="isCurating"
              :disabled="isCurating"
              @click="submitCurations('remove')"
            >
              Unlink
            </v-btn>
          </template>
          Unlink from target institution
        </v-tooltip>
      </template>

      <v-spacer />

      <!-- Export button -->
      <v-btn
        variant="text"
        size="small"
        @click="handleExport"
      >
        Export CSV
      </v-btn>
    </div>

    <!-- Results Table -->
    <v-card flat variant="outlined" class="bg-white">
      <!-- Loading progress bar (always reserve space to prevent layout shift) -->
      <div style="height: 2px;">
        <v-progress-linear
          v-if="isLoading"
          indeterminate
          color="primary"
          height="2"
        />
      </div>

      <v-card-text v-if="error && !affiliations.length" class="py-8">
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-text v-else-if="!affiliations.length && !isLoading" class="py-8 text-center text-grey">
        <template v-if="!institutionId">
          Select an institution to view affiliations.
        </template>
        <template v-else>
          No affiliations found.
        </template>
      </v-card-text>

      <v-table v-else :class="{ 'table-loading': isLoading }" hover class="affiliations-table">
        <thead>
          <tr>
            <th class="px-3">
              <v-checkbox
                :model-value="selectionState"
                :indeterminate="selectionState === 'indeterminate'"
                hide-details
                density="compact"
                @click="toggleSelectAll"
              />
            </th>
            <th>Affiliation statement</th>
            <th style="width: 120px;">Works count</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(affiliation, index) in affiliations"
            :key="affiliation.raw_affiliation_string || index"
            class="ras-row"
            @click="openWorksDialog(affiliation)"
          >
            <td style="vertical-align: top;" class="px-3 py-3" @click.stop>
              <v-checkbox
                :model-value="selectedIds.has(affiliation.raw_affiliation_string)"
                hide-details
                density="compact"
                @update:model-value="toggleSelection(affiliation.raw_affiliation_string, $event)"
              />
            </td>
            <td class="py-3">
              <div class="d-flex align-center flex-wrap" style="gap: 6px;">
                <span>{{ affiliation.raw_affiliation_string }}</span>
                <span
                  v-if="getPendingCuration(affiliation)"
                  class="curation-label"
                  @click.stop="goToCuration(getPendingCuration(affiliation).id)"
                >
                  <span class="curation-dot"></span>
                  Pending
                </span>
              </div>
            </td>
            <td class="py-3">
              {{ affiliation.works_count ? affiliation.works_count.toLocaleString() : '0' }}
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Pagination -->
      <div v-if="affiliations.length" class="d-flex align-center justify-center pa-3 border-t">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          density="compact"
        />
      </div>
    </v-card>

    <!-- Export Progress Dialog -->
    <v-dialog v-model="showExportDialog" max-width="400" persistent>
      <v-card>
        <v-card-title>Exporting CSV</v-card-title>
        <v-card-text>
          <div class="mb-4">
            {{ exportProgressText }}
          </div>
          <v-progress-linear
            :model-value="exportProgress"
            color="primary"
            height="8"
            rounded
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelExport">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Export Limit Warning Dialog -->
    <v-dialog v-model="showExportLimitDialog" max-width="400">
      <v-card>
        <v-card-title>Export Limit</v-card-title>
        <v-card-text>
          The maximum export size is 10,000 rows. Your current result set has {{ totalResults.toLocaleString() }} rows.
          Only the first 10,000 rows will be exported.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showExportLimitDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmExport">Export first 10k</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Works Detail Dialog -->
    <RasWorksDialog v-model="showWorksDialog" :ras-text="selectedRas" />

    <!-- Search Suggestions Dialog -->
    <v-dialog v-model="showSuggestionsDialog" max-width="480">
      <v-card>
        <v-card-title class="d-flex align-center pa-4">
          <span class="text-body-1 font-weight-medium">Name variations</span>
          <v-spacer />
          <v-btn icon variant="text" size="small" @click="showSuggestionsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />

        <div v-if="isFetchingSuggestions" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate size="24" />
        </div>
        <v-card-text v-else-if="suggestionsError" class="py-6">
          <v-alert type="error" variant="tonal">{{ suggestionsError }}</v-alert>
        </v-card-text>
        <v-card-text v-else-if="suggestions.length === 0" class="py-6 text-center text-grey">
          No alternate names found for this institution.
        </v-card-text>
        <v-list v-else density="compact" class="suggestions-list">
          <v-list-item
            v-for="(name, index) in suggestions"
            :key="index"
            @click="applySuggestion(name)"
          >
            <v-list-item-title class="text-body-2">{{ name }}</v-list-item-title>
          </v-list-item>
        </v-list>

        <v-divider v-if="suggestions.length > 0" />
        <v-card-actions class="px-4">
          <span class="text-caption text-grey-darken-1">
            {{ suggestions.length }} variation{{ suggestions.length === 1 ? '' : 's' }}
          </span>
          <v-spacer />
          <v-btn variant="text" size="small" @click="showSuggestionsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import RasWorksDialog from './RasWorksDialog.vue';

defineOptions({ name: 'AffiliationMatchingPanel' });

const props = defineProps({
  institutionId: {
    type: String,
    default: null,
  },
  isSiteWide: {
    type: Boolean,
    default: false,
  },
});

const store = useStore();
const route = useRoute();
const router = useRouter();

// URL status mapping
const statusToUrl = { matching: 'linked', not_matching: 'unlinked' };
const urlToStatus = { linked: 'matching', unlinked: 'not_matching' };

// State
const affiliations = ref([]);
const isLoading = ref(false);
const error = ref(null);
const searchQuery = ref(route.query.search || '');
const currentPage = ref(1);
const perPage = ref(100);
const totalResults = ref(0);
const selectedIds = ref(new Set());
const showExportLimitDialog = ref(false);
const showExportDialog = ref(false);
const exportProgress = ref(0);
const exportedCount = ref(0);
const exportTotalTarget = ref(0);
let exportAbortController = null;
const isCurating = ref(false);
const pendingCurations = ref(new Map()); // Map of entity_id -> { id, action }
const showWorksDialog = ref(false);
const selectedRas = ref('');
const showSuggestionsDialog = ref(false);
const suggestions = ref([]);
const isFetchingSuggestions = ref(false);
const suggestionsError = ref(null);
const suggestionsCache = ref(null);

// Fetch user's pending curations from API
async function fetchUserCurations() {
  try {
    let url = `${urlBase.userApi}/curations?per_page=1000&is_applied=false`;
    if (props.institutionId) {
      url += `&value=https://openalex.org/${props.institutionId}`;
    }
    const res = await axios.get(
      url,
      axiosConfig({ userAuth: true })
    );

    // Populate pendingCurations map
    const curations = res.data.results || [];
    curations.forEach(c => {
      if (c.entity === 'ras') {
        pendingCurations.value.set(c.entity_id, { id: c.id, action: c.action });
      }
    });
  } catch (err) {
    console.error('Error fetching user curations:', err);
  }
}

// fetchUserCurations is called via the institutionId watcher (immediate: true)

const exportProgressText = computed(() => {
  return `Exported ${exportedCount.value.toLocaleString()} of ${exportTotalTarget.value.toLocaleString()} rows...`;
});

// Filter state (initialize from URL if present)
const matchingFilter = ref(urlToStatus[route.query.status] || 'matching');

// Link filter options for inline select
const linkFilterOptions = [
  { title: 'linked to', value: 'matching' },
  { title: 'unlinked to', value: 'not_matching' },
];

const totalPages = computed(() => {
  return Math.ceil(totalResults.value / perPage.value) || 1;
});

const resultsRangeText = computed(() => {
  if (totalResults.value === 0) return '0 affiliations';
  const start = (currentPage.value - 1) * perPage.value + 1;
  const end = Math.min(currentPage.value * perPage.value, totalResults.value);
  return `${start}-${end} of ${totalResults.value.toLocaleString()} affiliations`;
});

const selectionState = computed(() => {
  if (selectedIds.value.size === 0) return false;
  if (selectedIds.value.size === affiliations.value.length) return true;
  return 'indeterminate';
});

// Methods
function normalizeInstitutionId(id) {
  if (!id) return null;
  let normalized = id;
  // Remove URL prefix
  if (normalized.startsWith('https://openalex.org/')) {
    normalized = normalized.replace('https://openalex.org/', '');
  }
  // Remove entity type prefix (e.g., "INSTITUTIONS/" or "institutions/")
  if (normalized.toUpperCase().startsWith('INSTITUTIONS/')) {
    normalized = normalized.substring('INSTITUTIONS/'.length);
  }
  // Ensure uppercase for consistency
  return normalized.toUpperCase();
}

function isMatchedToTargetInstitution(affiliation) {
  if (!props.institutionId) return false;
  const targetIdNormalized = normalizeInstitutionId(props.institutionId);
  return affiliation.institution_ids_final?.some(id =>
    normalizeInstitutionId(id) === targetIdNormalized
  ) || false;
}

function getPendingCuration(affiliation) {
  return pendingCurations.value.get(affiliation.raw_affiliation_string) || null;
}

function getWorksSearchUrl(rasText) {
  // Build URL to filter works by exact raw affiliation string match
  // Use quotes around the RAS to preserve commas in the filter value
  // Include is_xpac:true|false to show ALL works (the API defaults to
  // is_xpac:false, but our dashboard counts include xpac works)
  const encodedRas = encodeURIComponent(`"${rasText}"`);
  return `/works?filter=raw_affiliation_strings:${encodedRas},is_xpac:true|false`;
}

function goToCuration(curationId) {
  let basePath = '/settings';
  if (route.path.startsWith('/admin')) {
    basePath = '/admin';
  } else if (route.path.startsWith('/settings/site-')) {
    basePath = '/settings/site-';
  }
  router.push(`${basePath}curations/${curationId}`);
}

function openWorksDialog(affiliation) {
  selectedRas.value = affiliation.raw_affiliation_string;
  showWorksDialog.value = true;
}

function openSuggestionsDialog() {
  showSuggestionsDialog.value = true;
  fetchSuggestions();
}

async function fetchSuggestions() {
  if (!props.institutionId) return;
  if (suggestionsCache.value?.institutionId === props.institutionId) {
    suggestions.value = suggestionsCache.value.names;
    return;
  }
  isFetchingSuggestions.value = true;
  suggestionsError.value = null;
  suggestions.value = [];
  try {
    const res = await axios.get(
      `https://api.openalex.org/institutions/${props.institutionId}`,
      axiosConfig()
    );
    const displayName = res.data.display_name || '';
    const alternatives = res.data.display_name_alternatives || [];
    const seen = new Set([displayName.toLowerCase()]);
    const deduped = [];
    for (const name of alternatives) {
      const lower = name.toLowerCase();
      if (!seen.has(lower)) { seen.add(lower); deduped.push(name); }
    }
    deduped.sort((a, b) => a.localeCompare(b));
    suggestions.value = deduped;
    suggestionsCache.value = { institutionId: props.institutionId, names: deduped };
  } catch (err) {
    console.error('Error fetching institution suggestions:', err);
    suggestionsError.value = 'Failed to load name variations.';
  } finally {
    isFetchingSuggestions.value = false;
  }
}

function applySuggestion(name) {
  showSuggestionsDialog.value = false;
  searchQuery.value = name;
  currentPage.value = 1;
  fetchAffiliations();
  updateUrlParams();
}

function updateUrlParams() {
  const query = { ...route.query };
  if (searchQuery.value) {
    query.search = searchQuery.value;
  } else {
    delete query.search;
  }
  const urlStatus = statusToUrl[matchingFilter.value];
  if (urlStatus) {
    query.status = urlStatus;
  } else {
    delete query.status;
  }
  router.replace({ query }).catch(() => {});
}

function toggleSelectAll() {
  if (selectedIds.value.size === affiliations.value.length) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(affiliations.value.map(a => a.raw_affiliation_string));
  }
}

function toggleSelection(id, selected) {
  const newSet = new Set(selectedIds.value);
  if (selected) {
    newSet.add(id);
  } else {
    newSet.delete(id);
  }
  selectedIds.value = newSet;
}

let searchTimeout = null;
function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchAffiliations();
    updateUrlParams();
  }, 300);
}

async function fetchAffiliations() {
  if (!props.institutionId) {
    affiliations.value = [];
    totalResults.value = 0;
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();
    params.set('page', currentPage.value);

    if (searchQuery.value) {
      params.set('q', searchQuery.value);
    }

    if (matchingFilter.value === 'matching' && props.institutionId) {
      params.set('matched-institutions', props.institutionId);
    } else if (matchingFilter.value === 'not_matching' && props.institutionId) {
      params.set('unmatched-institutions', props.institutionId);
    }

    const response = await axios.get(
      `${urlBase.api}/raw-affiliation-strings?${params.toString()}`,
      axiosConfig()
    );

    affiliations.value = response.data.results || [];
    totalResults.value = response.data.meta?.count || 0;
    selectedIds.value = new Set();
  } catch (err) {
    console.error('Error fetching affiliations:', err);
    error.value = err?.response?.data?.message || err?.response?.data?.error || 'Failed to load affiliations.';
    affiliations.value = [];
    totalResults.value = 0;
  } finally {
    isLoading.value = false;
  }
}

function handleExport() {
  if (totalResults.value > 10000) {
    showExportLimitDialog.value = true;
  } else {
    startExport();
  }
}

function confirmExport() {
  showExportLimitDialog.value = false;
  startExport();
}

function startExport() {
  exportAbortController = new AbortController();
  exportProgress.value = 0;
  exportedCount.value = 0;
  exportTotalTarget.value = Math.min(totalResults.value, 10000);
  showExportDialog.value = true;
  exportToCsv();
}

function cancelExport() {
  if (exportAbortController) {
    exportAbortController.abort();
  }
  showExportDialog.value = false;
}

async function exportToCsv() {
  const maxExportRows = 10000;
  const exportPerPage = 100;
  const delayBetweenRequests = 100;
  const maxRetries = 3;
  let allResults = [];
  let page = 1;

  try {
    while (allResults.length < maxExportRows) {
      if (exportAbortController?.signal.aborted) {
        return;
      }

      const params = new URLSearchParams();
      params.set('page', page);
      
      if (searchQuery.value) {
        params.set('q', searchQuery.value);
      }
      if (matchingFilter.value === 'matching' && props.institutionId) {
        params.set('matched-institutions', props.institutionId);
      } else if (matchingFilter.value === 'not_matching' && props.institutionId) {
        params.set('unmatched-institutions', props.institutionId);
      }

      let response = null;
      let lastError = null;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const config = {
            ...axiosConfig(),
            signal: exportAbortController?.signal
          };
          
          response = await axios.get(
            `${urlBase.api}/raw-affiliation-strings?${params.toString()}`,
            config
          );
          break;
        } catch (err) {
          lastError = err;
          if (err.name === 'AbortError' || err.name === 'CanceledError') {
            throw err;
          }
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          }
        }
      }
      
      if (!response) {
        throw lastError || new Error('Failed to fetch after retries');
      }

      const results = response.data.results || [];
      if (results.length === 0) break;

      allResults = allResults.concat(results);
      
      exportedCount.value = Math.min(allResults.length, maxExportRows);
      exportProgress.value = (exportedCount.value / exportTotalTarget.value) * 100;
      
      page++;

      if (results.length < exportPerPage) break;
      
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
    }

    if (exportAbortController?.signal.aborted) {
      return;
    }

    allResults = allResults.slice(0, maxExportRows);

    const csvContent = convertToCsv(allResults);
    downloadCsv(csvContent, 'affiliations-export.csv');

    showExportDialog.value = false;
    store.commit('snackbar', `Exported ${allResults.length} affiliations`);
  } catch (err) {
    if (err.name === 'AbortError' || err.name === 'CanceledError') {
      return;
    }
    console.error('Error exporting:', err);
    showExportDialog.value = false;
    store.commit('snackbar', 'Failed to export affiliations');
  }
}

function convertToCsv(data) {
  if (data.length === 0) return '';

  const columns = [
    { key: 'raw_affiliation_string', header: 'Affiliation statement' },
    { key: 'works_count', header: 'Works Count' },
    { key: 'institution_ids_final', header: 'Institution IDs', transform: (val) => val?.join('|') || '' },
  ];

  const headers = columns.map(c => `"${c.header}"`).join(',');

  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];
      if (col.transform) {
        value = col.transform(value);
      }
      if (value === null || value === undefined) {
        value = '';
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function submitCurations(action) {
  if (selectedIds.value.size === 0) return;

  isCurating.value = true;

  try {
    // Build curations array from selected affiliations
    const curations = Array.from(selectedIds.value).map(rasText => ({
      entity: 'ras',
      entity_id: rasText,
      property: 'institution_ids',
      action: action,
      ...(props.institutionId ? { value: `https://openalex.org/${props.institutionId}` } : {}),
    }));

    const endpoint = `${urlBase.userApi}/curations`;

    const response = await axios.post(
      endpoint,
      curations,
      axiosConfig({ userAuth: true })
    );

    const actionLabel = action === 'add' ? 'link' : 'unlink';
    store.commit('snackbar', `Curation submitted: ${curations.length} ${actionLabel} request${curations.length === 1 ? '' : 's'} pending daily sync`);

    // Track pending curations for UI indicator
    const created = Array.isArray(response.data) ? response.data : [response.data];
    created.forEach(c => {
      pendingCurations.value.set(c.entity_id, { id: c.id, action: c.action });
    });

    // Clear selection after success
    selectedIds.value = new Set();
  } catch (err) {
    console.error('Error submitting curations:', err);
    const message = err?.response?.data?.message || 'Failed to submit curations';
    store.commit('snackbar', message);
  } finally {
    isCurating.value = false;
  }
}

// Watchers
let initialLoadDone = false;
watch(() => props.institutionId, (newId) => {
  currentPage.value = 1;
  if (initialLoadDone) {
    matchingFilter.value = 'matching';
  }
  // Only mark initial load done once we have a real institution ID.
  // Admin page starts with null then sets the ID after fetching from URL param —
  // we don't want that second call to reset the filter restored from URL.
  if (newId) {
    initialLoadDone = true;
  }
  pendingCurations.value.clear();
  suggestionsCache.value = null;
  fetchUserCurations();
  fetchAffiliations();
}, { immediate: true });

watch(matchingFilter, () => {
  currentPage.value = 1;
  fetchAffiliations();
  updateUrlParams();
});

watch(currentPage, () => {
  fetchAffiliations();
});
</script>

<style scoped>
.border-t {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.search-field {
  flex: 1;
  min-width: 200px;
}

.link-filter-select {
  max-width: 160px;
  flex-shrink: 0;
}

.table-loading {
  opacity: 0.5;
  pointer-events: none;
}

.affiliations-table :deep(.v-table__wrapper) {
  overflow-x: hidden;
}

.affiliations-table :deep(td),
.affiliations-table :deep(th) {
  white-space: normal;
  word-break: break-word;
}

.ras-row {
  cursor: pointer;
}

.curation-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #8B8B8B;
  cursor: pointer;
  padding: 2px 0;
}

.curation-label:hover {
  color: #6B6B6B;
}

.curation-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #D97706;
  flex-shrink: 0;
}

.suggestions-list {
  max-height: 50vh;
  overflow-y: auto;
}
</style>
