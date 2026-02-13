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

      <v-table v-else :class="{ 'table-loading': isLoading }" hover>
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
          <tr
            v-for="(affiliation, index) in affiliations"
            :key="affiliation.raw_affiliation_string || index"
            class="ras-row"
            @click="openWorksDialog(affiliation)"
          >
            <td class="cell-checkbox" @click.stop>
              <v-checkbox
                :model-value="selectedIds.has(affiliation.raw_affiliation_string)"
                hide-details
                density="compact"
                @update:model-value="toggleSelection(affiliation.raw_affiliation_string, $event)"
              />
            </td>
            <td class="cell-icon" @click.stop>
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
            <td>
              <div class="d-flex align-center flex-wrap" style="gap: 6px;">
                <span>{{ affiliation.raw_affiliation_string }}</span>
                <v-chip
                  v-if="getPendingCuration(affiliation)"
                  size="x-small"
                  color="amber-darken-2"
                  variant="tonal"
                  @click.stop="goToCuration(getPendingCuration(affiliation).id)"
                >
                  <v-icon start size="12">mdi-clock-outline</v-icon>
                  Curation pending
                </v-chip>
              </div>
            </td>
            <td>
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
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const store = useStore();
const route = useRoute();
const router = useRouter();

// URL status mapping
const statusToUrl = { any: null, matching: 'linked', not_matching: 'unlinked' };
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

// Fetch user's pending curations from API
async function fetchUserCurations() {
  try {
    const res = await axios.get(
      `${urlBase.userApi}/curations?per_page=1000`,
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

onMounted(() => {
  fetchUserCurations();
});

const exportProgressText = computed(() => {
  return `Exported ${exportedCount.value.toLocaleString()} of ${exportTotalTarget.value.toLocaleString()} rows...`;
});

// Filter state (initialize from URL if present)
const matchingFilter = ref(urlToStatus[route.query.status] || 'any');

// Computed
const matchingOptions = computed(() => [
  { value: 'any', label: 'All affiliations', icon: 'mdi-filter-variant', color: 'grey' },
  { value: 'matching', label: props.isAdmin ? 'Linked to target' : 'Linked to us', icon: 'mdi-link-variant', color: 'green' },
  { value: 'not_matching', label: props.isAdmin ? 'Unlinked to target' : 'Unlinked to us', icon: 'mdi-link-variant-off', color: 'grey' },
]);

const selectedFilterOption = computed(() => {
  return matchingOptions.value.find(o => o.value === matchingFilter.value);
});

const matchingFilterLabel = computed(() => {
  return selectedFilterOption.value?.label || 'All affiliations';
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
  const isMatched = isMatchedToTargetInstitution(affiliation);

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

function goToCuration(curationId) {
  const basePath = props.isAdmin ? '/admin' : '/settings';
  router.push(`${basePath}/curations/${curationId}`);
}

function openWorksDialog(affiliation) {
  selectedRas.value = affiliation.raw_affiliation_string;
  showWorksDialog.value = true;
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
      ...(props.isAdmin && props.institutionId ? { value: `https://openalex.org/${props.institutionId}` } : {}),
    }));

    const endpoint = props.isAdmin
      ? `${urlBase.userApi}/admin/curations`
      : `${urlBase.userApi}/curations`;

    const response = await axios.post(
      endpoint,
      curations,
      axiosConfig({ userAuth: true })
    );

    const actionLabel = action === 'add' ? 'match' : 'unmatch';
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
    matchingFilter.value = 'any';
  }
  // Only mark initial load done once we have a real institution ID.
  // Admin page starts with null then sets the ID after fetching from URL param —
  // we don't want that second call to reset the filter restored from URL.
  if (newId) {
    initialLoadDone = true;
  }
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

.ras-row {
  cursor: pointer;
}
</style>
