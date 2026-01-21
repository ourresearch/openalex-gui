<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-2">Curations</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      Curations you've submitted to improve affiliation matching. Changes are applied during the daily sync.
    </p>

    <!-- Controls row -->
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <!-- Search field -->
      <v-text-field
        v-model="localSearchQuery"
        variant="outlined"
        density="compact"
        placeholder="Search by affiliation text"
        hide-details
        class="search-field"
        @update:model-value="debouncedSearch"
        @keydown.escape="clearSearch"
      >
        <template #prepend-inner>
          <v-icon size="small" color="grey">mdi-magnify</v-icon>
        </template>
        <template v-if="localSearchQuery" #append-inner>
          <v-btn
            icon
            variant="text"
            size="x-small"
            @click="clearSearch"
          >
            <v-icon size="small">mdi-close</v-icon>
          </v-btn>
        </template>
      </v-text-field>

      <!-- Action filter -->
      <v-select
        v-model="actionFilter"
        :items="actionOptions"
        item-title="title"
        item-value="value"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        label="Action"
        class="filter-select"
      >
        <template #item="{ item, props }">
          <v-list-item v-bind="props">
            <template #prepend>
              <v-icon
                :color="item.raw.value === 'add' ? 'success' : 'error'"
                size="small"
                class="mr-2"
              >
                {{ item.raw.value === 'add' ? 'mdi-link-variant' : 'mdi-link-variant-off' }}
              </v-icon>
            </template>
          </v-list-item>
        </template>
        <template #selection="{ item }">
          <v-icon
            :color="item.raw.value === 'add' ? 'success' : 'error'"
            size="small"
            class="mr-2"
          >
            {{ item.raw.value === 'add' ? 'mdi-link-variant' : 'mdi-link-variant-off' }}
          </v-icon>
          {{ item.raw.title }}
        </template>
      </v-select>
    </div>

    <!-- Error alert -->
    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <!-- Loading state -->
    <div v-if="loading && !curations.length" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Results info and table -->
    <div v-else-if="curations.length">
      <!-- Info row -->
      <div class="mb-2">
        <span class="text-body-2 text-medium-emphasis">
          Showing {{ showingStart }}-{{ showingEnd }} of {{ totalCount }} curations
        </span>
      </div>

      <!-- Curations table -->
      <v-card variant="outlined" class="bg-white">
        <v-table density="comfortable" class="curations-table">
          <thead>
            <tr>
              <th class="icon-col"></th>
              <th>Affiliation</th>
              <th class="date-col">Created</th>
              <th class="action-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="curation in curations"
              :key="curation.id"
              class="curation-row"
            >
              <!-- Action icon -->
              <td class="icon-col">
                <v-tooltip location="top">
                  <template #activator="{ props }">
                    <v-icon
                      v-bind="props"
                      :color="curation.action === 'add' ? 'success' : 'error'"
                      size="20"
                    >
                      {{ curation.action === 'add' ? 'mdi-link-variant' : 'mdi-link-variant-off' }}
                    </v-icon>
                  </template>
                  {{ curation.action === 'add' ? 'Match to your institution' : 'Unmatch from your institution' }}
                </v-tooltip>
              </td>

              <!-- Affiliation text (full, wrapped) -->
              <td>
                <div class="affiliation-text">{{ curation.entity_id }}</div>
              </td>

              <!-- Created date -->
              <td class="date-col text-medium-emphasis">
                <v-tooltip location="top">
                  <template #activator="{ props }">
                    <span v-bind="props">
                      {{ formatRelativeDate(curation.created) }}
                    </span>
                  </template>
                  {{ formatExactDate(curation.created) }}
                </v-tooltip>
              </td>

              <!-- Delete action -->
              <td class="action-col">
                <v-btn
                  icon
                  variant="text"
                  size="x-small"
                  color="error"
                  @click="confirmDelete(curation)"
                >
                  <v-icon size="small">mdi-delete-outline</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <!-- Bottom pagination -->
      <div v-if="totalPages > 1" class="d-flex justify-end align-center mt-4">
        <v-btn
          icon
          variant="text"
          size="small"
          :disabled="page <= 1"
          @click="prevPage"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <span class="text-body-2 mx-2">Page {{ page }} of {{ totalPages }}</span>
        <v-btn
          icon
          variant="text"
          size="small"
          :disabled="page >= totalPages"
          @click="nextPage"
        >
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- No results -->
    <div v-else class="text-center text-medium-emphasis py-8">
      <v-icon size="48" color="grey-lighten-1" class="mb-4">mdi-link-plus</v-icon>
      <p>No curations yet.</p>
      <p class="text-body-2">
        Submit curations from the
        <router-link to="/settings/affiliations">Affiliations</router-link>
        page to improve matching for your institution.
      </p>
    </div>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Curation</v-card-title>
        <v-card-text>
          Are you sure you want to delete this curation? It will no longer be applied during the next sync.
          <div v-if="curationToDelete" class="mt-3 pa-3 bg-grey-lighten-4 rounded">
            <div class="text-body-2">
              <strong>Affiliation:</strong> {{ curationToDelete.entity_id }}
            </div>
            <div class="text-body-2 mt-1">
              <strong>Action:</strong> {{ curationToDelete.action === 'add' ? 'Match' : 'Unmatch' }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="isDeleting"
            @click="deleteCuration"
          >
            Delete
          </v-btn>
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

defineOptions({ name: 'SettingsCurations' });

useHead({ title: 'Curations' });

const store = useStore();

// State
const curations = ref([]);
const error = ref('');
const loading = ref(false);
const localSearchQuery = ref('');
const actionFilter = ref(null);

// Pagination
const page = ref(1);
const perPage = ref(25);
const totalCount = ref(0);
const totalPages = ref(1);

// Delete dialog
const showDeleteDialog = ref(false);
const isDeleting = ref(false);
const curationToDelete = ref(null);

// Debounce timer
let debounceTimer = null;

// Options
const actionOptions = [
  { title: 'Match', value: 'add' },
  { title: 'Unmatch', value: 'remove' },
];

// Computed
const showingStart = computed(() => {
  if (totalCount.value === 0) return 0;
  return (page.value - 1) * perPage.value + 1;
});

const showingEnd = computed(() => {
  return Math.min(page.value * perPage.value, totalCount.value);
});

// Methods
async function fetchCurations() {
  error.value = '';
  loading.value = true;

  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      per_page: perPage.value.toString(),
    });

    if (localSearchQuery.value.trim()) {
      params.set('q', localSearchQuery.value.trim());
    }

    if (actionFilter.value) {
      params.set('action', actionFilter.value);
    }

    const res = await axios.get(
      `${urlBase.userApi}/curations?${params.toString()}`,
      axiosConfig({ userAuth: true })
    );

    curations.value = res.data.results || [];
    totalCount.value = res.data.meta?.total_count || 0;
    totalPages.value = res.data.meta?.total_pages || 1;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to fetch curations.';
    curations.value = [];
  } finally {
    loading.value = false;
  }
}

function debouncedSearch() {
  loading.value = true;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    fetchCurations();
  }, 300);
}

function clearSearch() {
  localSearchQuery.value = '';
  page.value = 1;
  fetchCurations();
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
    fetchCurations();
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
    fetchCurations();
  }
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatExactDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function confirmDelete(curation) {
  curationToDelete.value = curation;
  showDeleteDialog.value = true;
}

async function deleteCuration() {
  if (!curationToDelete.value) return;

  isDeleting.value = true;
  error.value = '';

  try {
    await axios.delete(
      `${urlBase.userApi}/curations/${curationToDelete.value.id}`,
      axiosConfig({ userAuth: true })
    );

    store.commit('snackbar', 'Curation deleted');
    showDeleteDialog.value = false;
    curationToDelete.value = null;
    fetchCurations();
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to delete curation.';
  } finally {
    isDeleting.value = false;
  }
}

// Watch filter changes
watch(actionFilter, () => {
  page.value = 1;
  fetchCurations();
});

// Load curations on mount
onMounted(() => {
  fetchCurations();
});
</script>

<style scoped lang="scss">
.curations-table {
  background: transparent !important;

  :deep(table) {
    width: 100%;
  }

  th {
    font-size: 13px !important;
    font-weight: bold !important;
    white-space: nowrap;
  }

  td {
    font-size: 14px !important;
    vertical-align: top;
    padding-top: 12px !important;
    padding-bottom: 12px !important;
  }

  .icon-col {
    width: 40px;
    padding-right: 0 !important;
  }

  .date-col {
    width: 120px;
    white-space: nowrap;
  }

  .action-col {
    width: 50px;
  }
}

.search-field {
  max-width: 320px;
  flex-shrink: 0;

  :deep(.v-field) {
    border-radius: 6px;
  }
}

.filter-select {
  max-width: 150px;
}

.curation-row {
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
}

.affiliation-text {
  word-break: break-word;
  line-height: 1.4;
}
</style>
