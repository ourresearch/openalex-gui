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
        placeholder="Search"
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

      <!-- Entity-type filter -->
      <v-select
        v-model="entityFilter"
        :items="entityOptions"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        label="Type"
        class="filter-select"
      />

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
          <!-- Row 1: header entity (RAS text, or resolved author/work) -->
          <CurationEntityRef
            :entity-ref="descriptorFor(curation).headerRef"
            :entity-map="entityMap"
            text-class="curation-ras"
            class="curation-header-row"
          />

          <v-divider />

          <!-- Row 2: Action + target entity -->
          <div class="curation-institution-row">
            <span
              class="font-weight-medium action-label"
              :class="`text-${descriptorFor(curation).actionColor}`"
            >
              {{ descriptorFor(curation).actionLabel }}
            </span>
            <CurationEntityRef
              :entity-ref="descriptorFor(curation).targetRef"
              :entity-map="entityMap"
              text-class="target-text"
            />
          </div>

          <v-divider />

          <!-- Row 3: Author ... time · status -->
          <div class="curation-footer">
            <span class="text-medium-emphasis">{{ curation.user_name || curation.user_id || '—' }}</span>
            <v-spacer />
            <v-tooltip location="top" aria-label="Created date">
              <template #activator="{ props }">
                <span v-bind="props" class="text-medium-emphasis">{{ formatRelativeDate(curation.created) }}</span>
              </template>
              {{ formatExactDate(curation.created) }}
            </v-tooltip>
            <span class="meta-sep">·</span>
            <v-tooltip location="top" aria-label="Application status">
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
import { curationDescriptor, useEntityResolver } from '@/composables/useCurationDescriptor';
import CurationEntityRef from '@/components/CurationEntityRef.vue';

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
const entityFilter = ref(null);
const actionFilter = ref(null);
const statusFilter = ref(null);
const { entityMap, resolve: resolveEntities } = useEntityResolver();

// Per-curation descriptor cache (stable for a given row id)
const descriptorCache = new Map();
function descriptorFor(curation) {
  let d = descriptorCache.get(curation.id);
  if (!d) {
    d = curationDescriptor(curation);
    descriptorCache.set(curation.id, d);
  }
  return d;
}

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

const entityOptions = [
  { title: 'RAS', value: 'ras' },
  { title: 'Author', value: 'authors' },
  { title: 'Work', value: 'works' },
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

    if (entityFilter.value) {
      params.set('entity', entityFilter.value);
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
    resolveEntities(curations.value);
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

// Watch filter changes
watch(entityFilter, () => {
  page.value = 1;
  fetchCurations();
});

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
}

.curation-header-row {
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

.target-text {
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
</style>
