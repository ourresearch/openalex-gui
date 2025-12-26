<template>
  <div>
    <!-- Page title -->
    <h1 class="text-h5 font-weight-bold mb-2">Affiliation Matching</h1>
    <p class="text-body-2 text-grey-darken-1 mb-6">
      Fine-tune how OpenAlex matches affiliation strings to your institution.
    </p>

    <!-- Search and Filters Row -->
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <!-- Search bar -->
      <v-text-field
        v-model="searchQuery"
        placeholder="Search affiliations"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
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
            <v-list-item-title>{{ option.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Works Count Filter -->
      <v-menu :close-on-content-click="false">
        <template v-slot:activator="{ props }">
          <button
            v-bind="props"
            class="filter-button"
            :class="{ 'filter-button--active': hasWorksCountFilter }"
          >
            {{ worksCountLabel }}
            <v-icon size="16">mdi-chevron-down</v-icon>
          </button>
        </template>
        <v-card min-width="220" class="pa-3">
          <div class="text-caption text-grey mb-2">Works count</div>
          <v-text-field
            v-model.number="worksCountMin"
            label="At least"
            type="number"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-2"
            :min="0"
          />
          <v-text-field
            v-model.number="worksCountMax"
            label="No more than"
            type="number"
            variant="outlined"
            density="compact"
            hide-details
            :min="0"
          />
          <div class="d-flex justify-end mt-3">
            <v-btn
              size="small"
              variant="text"
              @click="clearWorksCountFilter"
            >
              Clear
            </v-btn>
          </div>
        </v-card>
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
            >
              Match
            </v-btn>
          </template>
          Match to my institution
        </v-tooltip>

        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              size="small"
              class="ml-2"
            >
              Unmatch
            </v-btn>
          </template>
          Unmatch from my institution
        </v-tooltip>
      </template>

      <v-spacer />

      <!-- Export button -->
      <v-btn
        variant="text"
        size="small"
        @click="handleExport"
      >
        Export
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
        No affiliations found.
      </v-card-text>

      <v-table v-else :class="{ 'table-loading': isLoading }">
        <thead>
          <tr>
            <th style="width: 40px;">
              <v-checkbox
                :model-value="selectionState"
                :indeterminate="selectionState === 'indeterminate'"
                hide-details
                density="compact"
                @click="toggleSelectAll"
              />
            </th>
            <th style="width: 40px;"></th>
            <th>Affiliation</th>
            <th style="width: 120px;">Works count</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(affiliation, index) in affiliations" :key="affiliation.raw_affiliation_string || index">
            <td>
              <v-checkbox
                :model-value="selectedIds.has(affiliation.raw_affiliation_string)"
                hide-details
                density="compact"
                @update:model-value="toggleSelection(affiliation.raw_affiliation_string, $event)"
              />
            </td>
            <td>
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-icon
                    v-bind="props"
                    :color="isMatchedToMyInstitution(affiliation) ? 'black' : 'grey-lighten-1'"
                    size="small"
                  >
                    {{ isMatchedToMyInstitution(affiliation) ? 'mdi-link' : 'mdi-link-off' }}
                  </v-icon>
                </template>
                {{ isMatchedToMyInstitution(affiliation) ? 'Affiliation is matched to my institution' : 'Affiliation is not matched to my institution' }}
              </v-tooltip>
            </td>
            <td>{{ affiliation.raw_affiliation_string }}</td>
            <td>{{ affiliation.works_count?.toLocaleString() ?? 0 }}</td>
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

    <!-- Export Dialog -->
    <v-dialog v-model="showExportLimitDialog" max-width="400">
      <v-card>
        <v-card-title>Export Limit</v-card-title>
        <v-card-text>
          The maximum export size is 1,000 rows. Your current result set has {{ totalResults.toLocaleString() }} rows.
          Only the first 1,000 rows will be exported.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showExportLimitDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmExport">Export anyway</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'SettingsAffiliations' });

useHead({ title: 'Affiliation Matching' });

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

// Filter state
const matchingFilter = ref('any');
const worksCountMin = ref(null);
const worksCountMax = ref(null);

// Organization data
const organization = ref(null);

// Computed
const organizationId = computed(() => store.state.user.organizationId);
const myInstitutionId = computed(() => {
  // Get the OpenAlex institution ID from the organization data
  // Format: https://openalex.org/I123456789 -> I123456789
  const openalexId = organization.value?.openalex_id;
  if (!openalexId) return null;
  // Extract just the ID part (e.g., "I123456789") for the API
  if (openalexId.startsWith('https://openalex.org/')) {
    return openalexId.replace('https://openalex.org/', '');
  }
  return openalexId;
});

const matchingOptions = [
  { value: 'any', label: 'Matching any' },
  { value: 'matching', label: 'Matching my institution' },
  { value: 'not_matching', label: 'Not matching my institution' },
];

const matchingFilterLabel = computed(() => {
  if (matchingFilter.value === 'any') return 'Matching any institution';
  const option = matchingOptions.find(o => o.value === matchingFilter.value);
  return option?.label || 'Matching any institution';
});

const hasWorksCountFilter = computed(() => {
  return worksCountMin.value !== null || worksCountMax.value !== null;
});

const worksCountLabel = computed(() => {
  const min = worksCountMin.value;
  const max = worksCountMax.value;
  
  if (min !== null && max !== null) {
    return `${min}-${max} works`;
  } else if (min !== null) {
    return `≥${min} works`;
  } else if (max !== null) {
    return `≤${max} works`;
  }
  return 'Works count';
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
function isMatchedToMyInstitution(affiliation) {
  if (!myInstitutionId.value) return false;
  // Check if the affiliation's institution_ids_final includes the user's institution
  const myId = myInstitutionId.value;
  const myIdFull = myId.startsWith('https://') ? myId : `https://openalex.org/${myId}`;
  return affiliation.institution_ids_final?.some(id => 
    id === myId || id === myIdFull
  ) || false;
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

function clearWorksCountFilter() {
  worksCountMin.value = null;
  worksCountMax.value = null;
}

let searchTimeout = null;
function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchAffiliations();
  }, 300);
}

async function fetchAffiliations() {
  isLoading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();
    params.set('page', currentPage.value);
    
    // Text search
    if (searchQuery.value) {
      params.set('q', searchQuery.value);
    }
    
    // Matching filter - uses matched-institutions or unmatched-institutions params
    if (matchingFilter.value === 'matching' && myInstitutionId.value) {
      params.set('matched-institutions', myInstitutionId.value);
    } else if (matchingFilter.value === 'not_matching' && myInstitutionId.value) {
      params.set('unmatched-institutions', myInstitutionId.value);
    }
    
    // Works count filter - format: "42-100", "42-", "-42"
    if (worksCountMin.value !== null && worksCountMax.value !== null) {
      params.set('works_count', `${worksCountMin.value}-${worksCountMax.value}`);
    } else if (worksCountMin.value !== null) {
      params.set('works_count', `${worksCountMin.value}-`);
    } else if (worksCountMax.value !== null) {
      params.set('works_count', `-${worksCountMax.value}`);
    }
    
    // Note: pending filter not yet supported by API

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
  if (totalResults.value > 1000) {
    showExportLimitDialog.value = true;
  } else {
    exportToCsv();
  }
}

function confirmExport() {
  showExportLimitDialog.value = false;
  exportToCsv();
}

async function exportToCsv() {
  const maxExportRows = 1000;
  const exportPerPage = 100;
  let allResults = [];
  let page = 1;

  try {
    store.commit('snackbar', 'Preparing export...');

    while (allResults.length < maxExportRows) {
      const params = new URLSearchParams();
      params.set('page', page);
      
      if (searchQuery.value) {
        params.set('q', searchQuery.value);
      }
      if (matchingFilter.value === 'matching' && myInstitutionId.value) {
        params.set('matched-institutions', myInstitutionId.value);
      } else if (matchingFilter.value === 'not_matching' && myInstitutionId.value) {
        params.set('unmatched-institutions', myInstitutionId.value);
      }
      if (worksCountMin.value !== null && worksCountMax.value !== null) {
        params.set('works_count', `${worksCountMin.value}-${worksCountMax.value}`);
      } else if (worksCountMin.value !== null) {
        params.set('works_count', `${worksCountMin.value}-`);
      } else if (worksCountMax.value !== null) {
        params.set('works_count', `-${worksCountMax.value}`);
      }

      const response = await axios.get(
        `${urlBase.api}/raw-affiliation-strings?${params.toString()}`,
        axiosConfig()
      );

      const results = response.data.results || [];
      if (results.length === 0) break;

      allResults = allResults.concat(results);
      page++;

      if (results.length < exportPerPage) break;
    }

    // Limit to max export rows
    allResults = allResults.slice(0, maxExportRows);

    // Convert to CSV
    const csvContent = convertToCsv(allResults);
    downloadCsv(csvContent, 'affiliations-export.csv');

    store.commit('snackbar', `Exported ${allResults.length} affiliations`);
  } catch (err) {
    console.error('Error exporting:', err);
    store.commit('snackbar', 'Failed to export affiliations');
  }
}

function convertToCsv(data) {
  if (data.length === 0) return '';

  // Define columns based on API response structure
  const columns = [
    { key: 'raw_affiliation_string', header: 'Affiliation' },
    { key: 'works_count', header: 'Works Count' },
    { key: 'institution_ids_final', header: 'Institution IDs', transform: (val) => val?.join('|') || '' },
    { key: 'countries', header: 'Countries', transform: (val) => val?.join('|') || '' },
  ];

  // Create header row
  const headers = columns.map(c => `"${c.header}"`).join(',');

  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];
      if (col.transform) {
        value = col.transform(value);
      }
      if (value === null || value === undefined) {
        value = '';
      }
      // Escape quotes and wrap in quotes
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

// Watchers
watch(matchingFilter, () => {
  currentPage.value = 1;
  fetchAffiliations();
});

watch([worksCountMin, worksCountMax], () => {
  currentPage.value = 1;
  fetchAffiliations();
}, { debounce: 300 });

watch(currentPage, () => {
  fetchAffiliations();
});

// Lifecycle
onMounted(async () => {
  await fetchOrganization();
  fetchAffiliations();
});

async function fetchOrganization() {
  if (!organizationId.value) return;
  
  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${organizationId.value}`,
      axiosConfig({ userAuth: true })
    );
    organization.value = res.data;
  } catch (err) {
    console.error('Error fetching organization:', err);
  }
}
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
</style>
