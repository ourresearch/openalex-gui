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

      <!-- Curations list -->
      <div class="curation-list">
        <v-card
          v-for="curation in curations"
          :key="curation.id"
          variant="outlined"
          class="curation-card bg-white"
          @click="router.push(`${curationBasePath}/${curation.id}`)"
        >
          <!-- Row 1: RAS text -->
          <div class="curation-ras">{{ curation.entity_id }}</div>

          <v-divider />

          <!-- Row 2: Action + Institution -->
          <div class="curation-institution-row">
            <span
              class="font-weight-medium action-label"
              :class="curation.action === 'add' ? 'text-success' : 'text-error'"
            >
              {{ curation.action === 'add' ? 'Link' : 'Unlink' }}
            </span>
            <div v-if="institutionMap[curation.value]" class="institution-info" @click.stop="openInstitution(curation.value)">
              <span class="institution-name">{{ institutionMap[curation.value].display_name }}</span>
              <span class="text-medium-emphasis institution-geo">
                {{ institutionMap[curation.value].city || institutionMap[curation.value].country }}
                ({{ shortId(curation.value) }})
              </span>
            </div>
            <code v-else class="value-text">{{ curation.value }}</code>
          </div>

          <v-divider />

          <!-- Row 3: Author ... time · status -->
          <div class="curation-footer">
            <span class="text-medium-emphasis">{{ curation.user_name || curation.user_id || '—' }}</span>
            <v-spacer />
            <v-tooltip location="top">
              <template #activator="{ props }">
                <span v-bind="props" class="text-medium-emphasis">{{ formatRelativeDate(curation.created) }}</span>
              </template>
              {{ formatExactDate(curation.created) }}
            </v-tooltip>
            <span class="meta-sep">·</span>
            <v-tooltip location="top">
              <template #activator="{ props: tooltipProps }">
                <span
                  v-bind="tooltipProps"
                  :class="curation.is_applied ? 'text-success' : 'text-medium-emphasis'"
                >
                  {{ curation.is_applied ? 'Applied' : 'Pending' }}
                </span>
              </template>
              <span v-if="curation.is_applied">Applied {{ formatExactDate(curation.applied_at) }}</span>
              <span v-else>Waiting for nightly pipeline</span>
            </v-tooltip>
          </div>
        </v-card>
      </div>

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

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminCurations' });

const route = useRoute();
const router = useRouter();

// Context-awareness: detect route context for navigation paths
const curationBasePath = computed(() => {
  if (route.path.startsWith('/admin')) return '/admin/curations';
  if (route.path.startsWith('/settings/site-')) return '/settings/site-curations';
  return '/settings/curations';
});
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
      `${urlBase.userApi}/curations?${params.toString()}`,
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
      institutionMap.value[inst.id] = {
        display_name: inst.display_name,
        city: inst.geo?.city || '',
        country: inst.geo?.country || '',
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
.curation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.curation-card {
  padding: 14px 16px;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}

.curation-ras {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  padding-bottom: 10px;
}

.curation-institution-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 10px 0;
}

.action-label {
  font-size: 13px;
  flex-shrink: 0;
}

.institution-info {
  min-width: 0;
  cursor: pointer;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;

  &:hover .institution-name {
    text-decoration: underline;
  }
}

.institution-name {
  font-size: 14px;
  font-weight: 500;
}

.institution-geo {
  font-size: 14px;
}

.curation-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding-top: 10px;
}

.meta-sep {
  color: rgba(0, 0, 0, 0.25);
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

.value-text {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 13px;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}


</style>
