<template>
  <div>
    <!-- Page title -->
    <h1 class="text-h5 font-weight-bold mb-4">Curations</h1>

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
        variant="outlined"
        density="compact"
        hide-details
        clearable
        label="Action"
        class="filter-select"
      >
        <template #item="{ item, props }">
          <v-list-item v-bind="props" :prepend-icon="item.raw.icon" :base-color="item.raw.color" />
        </template>
        <template #selection="{ item }">
          <v-icon :color="item.raw.color" :icon="item.raw.icon" size="small" class="mr-1" />
          {{ item.title }}
        </template>
      </v-select>

      <!-- Status filter -->
      <v-select
        v-model="statusFilter"
        :items="statusOptions"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        label="Status"
        class="filter-select"
      />

      <v-spacer />

      <!-- Create button -->
      <v-btn
        color="primary"
        @click="showCreateDialog = true"
      >
        <v-icon start>mdi-plus</v-icon>
        Create Curation
      </v-btn>
    </div>

    <!-- Error alert -->
    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <!-- Results info and table -->
    <div v-if="curations.length || loading">
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
              <th style="width: 32px;"></th>
              <th>Raw Affiliation String</th>
              <th>Institution</th>
              <th>User</th>
              <th>Created</th>
              <th style="width: 50px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="curation in curations"
              :key="curation.id"
              class="curation-row"
              @click="router.push(`/admin/curations/${curation.id}`)"
            >
              <!-- Status icon -->
              <td>
                <v-tooltip location="top">
                  <template #activator="{ props: tooltipProps }">
                    <v-icon
                      v-if="curation.is_applied"
                      v-bind="tooltipProps"
                      color="success"
                      size="small"
                    >mdi-check-circle</v-icon>
                    <v-icon
                      v-else
                      v-bind="tooltipProps"
                      color="grey"
                      size="small"
                    >mdi-clock-outline</v-icon>
                  </template>
                  <span v-if="curation.is_applied">Applied {{ formatExactDate(curation.applied_at) }}</span>
                  <span v-else>Waiting for nightly pipeline</span>
                </v-tooltip>
              </td>

              <!-- Entity ID -->
              <td>
                <div class="entity-id-cell">{{ curation.entity_id }}</div>
              </td>

              <!-- Institution (with action color) -->
              <td>
                <v-tooltip location="top" max-width="300">
                  <template #activator="{ props: tooltipProps }">
                    <v-chip
                      v-if="institutionMap[curation.value]"
                      v-bind="tooltipProps"
                      :color="curation.action === 'add' ? 'success' : 'error'"
                      variant="outlined"
                      size="small"
                      label
                      @click.stop="openInstitution(curation.value)"
                    >
                      <v-icon start size="14">{{ curation.action === 'add' ? 'mdi-plus' : 'mdi-minus' }}</v-icon>
                      {{ truncate(institutionMap[curation.value].display_name, 30) }}
                    </v-chip>
                    <code v-else v-bind="tooltipProps" class="value-text">{{ curation.value }}</code>
                  </template>
                  <template v-if="institutionMap[curation.value]">
                    <div class="font-weight-medium">
                      <span :style="{ color: curation.action === 'add' ? '#16a34a' : '#dc2626' }">{{ curation.action === 'add' ? 'Add' : 'Remove' }}</span>
                      {{ institutionMap[curation.value].display_name }}
                    </div>
                    <div v-if="institutionMap[curation.value].location" class="text-caption mt-1" style="opacity: 0.85;">
                      {{ institutionMap[curation.value].location }}
                    </div>
                    <div class="text-caption mt-1" style="opacity: 0.6;">{{ shortId(curation.value) }}</div>
                  </template>
                  <template v-else>{{ curation.value }}</template>
                </v-tooltip>
              </td>

              <!-- User -->
              <td>
                <router-link
                  v-if="curation.user_id"
                  :to="`/admin/users/${curation.user_id}`"
                  class="user-link"
                  @click.stop
                >
                  {{ curation.user_name || curation.user_id }}
                </router-link>
                <span v-else class="text-medium-emphasis">—</span>
              </td>

              <!-- Created date -->
              <td class="text-medium-emphasis">
                <v-tooltip location="top">
                  <template #activator="{ props }">
                    <span v-bind="props" class="date-text">
                      {{ formatRelativeDate(curation.created) }}
                    </span>
                  </template>
                  {{ formatExactDate(curation.created) }}
                </v-tooltip>
              </td>

            </tr>
          </tbody>
        </v-table>
      </v-card>

      <!-- Bottom pagination -->
      <div class="d-flex justify-end align-center mt-4">
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
    <div v-else-if="!loading" class="text-center text-medium-emphasis py-8">
      No curations found.
    </div>

    <!-- Create Curation Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="600">
      <v-card>
        <v-card-title>Create Curation</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newCuration.entity_id"
            label="Affiliation text (entity_id)"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-select
            v-model="newCuration.action"
            :items="['add', 'remove']"
            label="Action"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field
            v-model="newCuration.value"
            label="Institution OpenAlex ID (value)"
            variant="outlined"
            density="compact"
            placeholder="I123456789"
            class="mb-3"
          />
          <v-text-field
            v-model="newCuration.user_id"
            label="User ID (optional)"
            variant="outlined"
            density="compact"
            placeholder="Leave blank to use your ID"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCreateDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="isCreating"
            :disabled="!canCreate"
            @click="createCuration"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminCurations' });

const store = useStore();
const route = useRoute();
const router = useRouter();

// State
const curations = ref([]);
const error = ref('');
const loading = ref(false);
const localSearchQuery = ref('');
const actionFilter = ref(null);
const statusFilter = ref(null);
const institutionMap = ref({}); // { fullOpenAlexUrl: { display_name, location } }

// Pagination
const page = ref(1);
const perPage = ref(25);
const totalCount = ref(0);
const totalPages = ref(1);

// Create dialog
const showCreateDialog = ref(false);
const isCreating = ref(false);
const newCuration = ref({
  entity_id: '',
  action: 'add',
  value: '',
  user_id: '',
});

// Debounce timer
let debounceTimer = null;

// Options
const actionOptions = [
  { title: 'Add', value: 'add', icon: 'mdi-plus', color: 'success' },
  { title: 'Remove', value: 'remove', icon: 'mdi-minus', color: 'error' },
];

const statusOptions = [
  { title: 'Pending', value: 'pending' },
  { title: 'Applied', value: 'applied' },
];

// Computed
const showingStart = computed(() => {
  if (totalCount.value === 0) return 0;
  return (page.value - 1) * perPage.value + 1;
});

const showingEnd = computed(() => {
  return Math.min(page.value * perPage.value, totalCount.value);
});

const canCreate = computed(() => {
  return newCuration.value.entity_id && newCuration.value.action && newCuration.value.value;
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

    if (statusFilter.value) {
      params.set('is_applied', statusFilter.value === 'applied' ? 'true' : 'false');
    }

    const res = await axios.get(
      `${urlBase.userApi}/admin/curations?${params.toString()}`,
      axiosConfig({ userAuth: true })
    );

    curations.value = res.data.results || [];
    totalCount.value = res.data.meta?.total_count || 0;
    totalPages.value = res.data.meta?.total_pages || 1;
    fetchInstitutionNames(curations.value);
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to fetch curations.';
    curations.value = [];
  } finally {
    loading.value = false;
  }
}

function shortId(openalexUrl) {
  if (!openalexUrl) return '';
  return openalexUrl.replace('https://openalex.org/', '');
}

function openInstitution(value) {
  window.open(`https://openalex.org/institutions/${shortId(value)}`, '_blank');
}

function truncate(str, maxLen) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

async function fetchInstitutionNames(curationsList) {
  const ids = [...new Set(
    curationsList
      .map(c => c.value)
      .filter(v => v && v.includes('openalex.org/I'))
      .filter(v => !institutionMap.value[v])
      .map(v => shortId(v))
  )];
  if (!ids.length) return;

  try {
    const res = await axios.get(
      `https://api.openalex.org/institutions?filter=openalex:${ids.join('|')}&select=id,display_name,geo&per_page=${ids.length}`
    );
    for (const inst of res.data.results || []) {
      const parts = [inst.geo?.city, inst.geo?.region, inst.geo?.country].filter(Boolean);
      institutionMap.value[inst.id] = {
        display_name: inst.display_name,
        location: parts.join(', '),
      };
    }
  } catch (e) {
    // Non-critical — fall back to showing raw IDs
    console.warn('Failed to fetch institution names:', e);
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

async function createCuration() {
  isCreating.value = true;
  error.value = '';

  try {
    const payload = {
      entity: 'ras',
      entity_id: newCuration.value.entity_id,
      property: 'institution_ids',
      action: newCuration.value.action,
      value: newCuration.value.value,
    };

    if (newCuration.value.user_id) {
      payload.user_id = newCuration.value.user_id;
    }

    await axios.post(
      `${urlBase.userApi}/admin/curations`,
      payload,
      axiosConfig({ userAuth: true })
    );

    store.commit('snackbar', 'Curation created successfully');
    showCreateDialog.value = false;
    newCuration.value = { entity_id: '', action: 'add', value: '', user_id: '' };
    fetchCurations();
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to create curation.';
  } finally {
    isCreating.value = false;
  }
}

// Watch filter changes
watch(actionFilter, () => {
  page.value = 1;
  fetchCurations();
});

watch(statusFilter, () => {
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

  th {
    font-size: 13px !important;
    font-weight: bold !important;
    white-space: nowrap;
  }

  td {
    font-size: 14px !important;
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
  cursor: pointer;

  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
}

.entity-id-cell {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.value-text {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 13px;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.user-link {
  color: #1976D2;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

</style>
