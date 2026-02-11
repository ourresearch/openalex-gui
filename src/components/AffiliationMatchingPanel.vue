<template>
  <div>
    <!-- Search and Filters Row -->
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <!-- Institution selector slot (for admin mode) -->
      <slot name="institution-selector" />

      <!-- Search bar -->
      <v-text-field
        v-model="searchQuery"
        placeholder="Search affiliations"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        autocomplete="off"
        name="affiliation-search-nofill"
        style="max-width: 300px;"
        @update:model-value="debouncedSearch"
      />

      <!-- Matching Institution Filter -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <button
            v-bind="props"
            class="filter-button"
            :class="{ 'filter-button--active': matchingFilter !== 'any' }"
          >
            <v-icon v-if="selectedFilterOption?.icon" :color="selectedFilterOption.color" size="16" class="mr-1">
              {{ selectedFilterOption.icon }}
            </v-icon>
            {{ matchingFilterLabel }}
            <v-icon size="16">mdi-chevron-down</v-icon>
          </button>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="option in matchingOptions"
            :key="option.value"
            :active="matchingFilter === option.value"
            @click="matchingFilter = option.value"
          >
            <template #prepend>
              <v-icon :color="option.color" size="18" class="mr-2">{{ option.icon }}</v-icon>
            </template>
            <v-list-item-title>{{ option.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

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
              Match
            </v-btn>
          </template>
          Match to target institution
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
              Unmatch
            </v-btn>
          </template>
          Unmatch from target institution
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

      <v-table v-else :class="{ 'table-loading': isLoading }">
        <thead>
          <tr>
            <th class="cell-checkbox">
              <v-checkbox
                :model-value="selectionState"
                :indeterminate="selectionState === 'indeterminate'"
                hide-details
                density="compact"
                @click="toggleSelectAll"
              />
            </th>
            <th class="cell-icon"></th>
            <th>Affiliation statement</th>
            <th style="width: 120px;">Works count</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(affiliation, index) in affiliations" :key="affiliation.raw_affiliation_string || index">
            <td class="cell-checkbox">
              <v-checkbox
                :model-value="selectedIds.has(affiliation.raw_affiliation_string)"
                hide-details
                density="compact"
                @update:model-value="toggleSelection(affiliation.raw_affiliation_string, $event)"
              />
            </td>
            <td class="cell-icon">
              <v-tooltip location="top">
                <template v-slot:activator="{ props: tooltipProps }">
                  <v-icon
                    v-bind="tooltipProps"
                    :color="getRowIcon(affiliation).color"
                    size="20"
                  >
                    {{ getRowIcon(affiliation).icon }}
                  </v-icon>
                </template>
                {{ getRowIcon(affiliation).tooltip }}
              </v-tooltip>
            </td>
            <td>{{ affiliation.raw_affiliation_string }}</td>
            <td>
              <a
                v-if="affiliation.works_count"
                :href="getWorksSearchUrl(affiliation.raw_affiliation_string)"
                target="_blank"
                class="works-count-link"
                @click.stop
              >
                {{ affiliation.works_count.toLocaleString() }}
              </a>
              <span v-else>0</span>
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AffiliationMatchingPanel' });

const props = defineProps({
  institutionId: {
    type: String,
    default: null,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const store = useStore();

// State
const affiliations = ref([]);
const isLoading = ref(false);
const error = ref(null);
const searchQuery = ref('');
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
const pendingCurations = ref(new Map()); // Map of entity_id -> action ('add' or 'remove')

// Fetch user's pending curations from API
async function fetchUserCurations() {
  if (props.isAdmin) return; // Admin mode doesn't need this

  try {
    const res = await axios.get(
      `${urlBase.userApi}/curations?per_page=1000`,
      axiosConfig({ userAuth: true })
    );

    // Populate pendingCurations map
    const curations = res.data.results || [];
    curations.forEach(c => {
      if (c.entity === 'ras') {
        pendingCurations.value.set(c.entity_id, c.action);
      }
    });
  } catch (err) {
    console.error('Error fetching user curations:', err);
  }
}

onMounted(() => {
  fetchUserCurations();
});

const exportProgressText = computed(() => {
  return `Exported ${exportedCount.value.toLocaleString()} of ${exportTotalTarget.value.toLocaleString()} rows...`;
});

// Filter state
const matchingFilter = ref('any');

// Computed
const matchingOptions = computed(() => [
  { value: 'any', label: 'Any status', icon: 'mdi-filter-variant', color: 'grey' },
  { value: 'matching', label: props.isAdmin ? 'Linked to target' : 'Linked to us', icon: 'mdi-link-variant', color: 'green' },
  { value: 'not_matching', label: props.isAdmin ? 'Unlinked to target' : 'Unlinked to us', icon: 'mdi-link-variant-off', color: 'grey' },
  { value: 'pending', label: 'Curation pending', icon: 'mdi-clock-outline', color: 'amber-darken-2' },
]);

const selectedFilterOption = computed(() => {
  return matchingOptions.value.find(o => o.value === matchingFilter.value);
});

const matchingFilterLabel = computed(() => {
  return selectedFilterOption.value?.label || 'Any status';
});

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

function getRowIcon(affiliation) {
  const pending = getPendingCuration(affiliation);
  const isMatched = isMatchedToTargetInstitution(affiliation);

  if (pending) {
    return {
      icon: 'mdi-clock-outline',
      color: 'amber-darken-2',
      tooltip: `Curation submitted: ${pending === 'add' ? 'match' : 'unmatch'} will be applied within 24 hours`
    };
  }

  if (isMatched) {
    return {
      icon: 'mdi-link-circle',
      color: 'green',
      tooltip: props.isAdmin ? 'Linked to target' : 'Linked to us'
    };
  }

  return {
    icon: 'mdi-link-off',
    color: 'grey-lighten-1',
    tooltip: props.isAdmin ? 'Unlinked to target' : 'Unlinked to us'
  };
}

function getWorksSearchUrl(rasText) {
  // Build URL to filter works by exact raw affiliation string match
  // Use quotes around the RAS to preserve commas in the filter value
  // Include is_xpac:true|false to show ALL works (the API defaults to
  // is_xpac:false, but our dashboard counts include xpac works)
  const encodedRas = encodeURIComponent(`"${rasText}"`);
  return `/works?filter=raw_affiliation_strings:${encodedRas},is_xpac:true|false`;
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
  }, 300);
}

async function fetchPendingAffiliations() {
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      per_page: perPage.value.toString(),
    });

    if (searchQuery.value) {
      params.set('q', searchQuery.value);
    }

    const res = await axios.get(
      `${urlBase.userApi}/curations?${params.toString()}`,
      axiosConfig({ userAuth: true })
    );

    const curations = res.data.results || [];

    // Convert curations to affiliation-like objects for display
    affiliations.value = curations.map(c => ({
      raw_affiliation_string: c.entity_id,
      works_count: null, // We don't have this for curations
      institution_ids_final: [], // Not relevant for pending view
    }));

    totalResults.value = res.data.meta?.total_count || 0;
    selectedIds.value = new Set();
  } catch (err) {
    console.error('Error fetching pending affiliations:', err);
    error.value = err?.response?.data?.message || 'Failed to load pending curations.';
    affiliations.value = [];
    totalResults.value = 0;
  } finally {
    isLoading.value = false;
  }
}

async function fetchAffiliations() {
  if (!props.institutionId && !['any', 'pending'].includes(matchingFilter.value)) {
    // Can't filter by institution without an institution ID (except for any/pending)
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    // Special handling for "pending" filter - show curated RAS entries
    if (matchingFilter.value === 'pending') {
      await fetchPendingAffiliations();
      return;
    }

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
      ...(props.isAdmin && props.institutionId ? { value: `https://openalex.org/${props.institutionId}` } : {}),
    }));

    const endpoint = props.isAdmin
      ? `${urlBase.userApi}/admin/curations`
      : `${urlBase.userApi}/curations`;

    await axios.post(
      endpoint,
      curations,
      axiosConfig({ userAuth: true })
    );

    const actionLabel = action === 'add' ? 'match' : 'unmatch';
    store.commit('snackbar', `Curation submitted: ${curations.length} ${actionLabel} request${curations.length === 1 ? '' : 's'} pending daily sync`);

    // Track pending curations for UI indicator
    curations.forEach(c => {
      pendingCurations.value.set(c.entity_id, c.action);
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
watch(() => props.institutionId, () => {
  currentPage.value = 1;
  matchingFilter.value = 'any';
  fetchAffiliations();
}, { immediate: true });

watch(matchingFilter, () => {
  currentPage.value = 1;
  fetchAffiliations();
});

watch(currentPage, () => {
  fetchAffiliations();
});
</script>

<style scoped>
.border-t {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.filter-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 400;
  color: #374151;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-button:hover {
  background: #F9FAFB;
  border-color: #D1D5DB;
}

.filter-button--active {
  background: #F3F4F6;
  border-color: #9CA3AF;
}

.table-loading {
  opacity: 0.5;
  pointer-events: none;
}

.cell-checkbox {
  width: 32px !important;
  padding-left: 8px !important;
  padding-right: 0 !important;
}

.cell-icon {
  width: 28px !important;
  padding-left: 12px !important;
  padding-right: 4px !important;
}

.works-count-link {
  color: #1976D2;
  text-decoration: none;
  cursor: pointer;
}

.works-count-link:hover {
  text-decoration: underline;
}
</style>
