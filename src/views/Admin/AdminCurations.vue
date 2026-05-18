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
        label="Entity"
        class="filter-select"
      >
        <template #item="{ item, props: itemProps }">
          <v-list-item v-bind="itemProps" :prepend-icon="item.raw.icon" />
        </template>
        <template #selection="{ item }">
          <v-icon :icon="item.raw.icon" size="small" class="mr-1" />
          {{ item.title }}
        </template>
      </v-select>

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
        >
          <!-- Line 1: entity badge · entity · action · property · new value -->
          <div class="cur-line cur-line-1">
            <v-chip size="small" label variant="tonal" class="flex-shrink-0">
              <v-icon start :icon="entityMeta(curation.entity).icon" size="small" />
              {{ entityMeta(curation.entity).label }}
            </v-chip>

            <CurationEntityRef
              :entity-ref="descriptorFor(curation).headerRef"
              :entity-map="entityMap"
              max-width="260px"
            />

            <v-chip
              size="small"
              label
              variant="flat"
              :color="actionMeta(curation.action).color"
              class="flex-shrink-0"
            >
              <v-icon start :icon="actionMeta(curation.action).icon" size="small" />
              {{ actionMeta(curation.action).label }}
            </v-chip>

            <v-tooltip location="top" :text="curation.property || '—'">
              <template #activator="{ props: tipProps }">
                <span v-bind="tipProps" class="cur-property">{{ propertyLabel(curation) }}</span>
              </template>
            </v-tooltip>

            <CurationEntityRef
              :entity-ref="descriptorFor(curation).targetRef"
              :entity-map="entityMap"
              max-width="220px"
            />
          </div>

          <v-divider />

          <!-- Line 2: status · spacer · owner · time · detail link -->
          <div class="cur-line cur-line-2">
            <v-tooltip location="top" :text="curation.is_applied ? 'Applied' : 'Pending'">
              <template #activator="{ props: tipProps }">
                <v-icon
                  v-bind="tipProps"
                  :icon="curation.is_applied ? 'mdi-check-circle' : 'mdi-clock-outline'"
                  :color="curation.is_applied ? 'success' : 'medium-emphasis'"
                  size="small"
                />
              </template>
            </v-tooltip>

            <v-spacer />

            <router-link
              v-if="isAdminContext && curation.user_id"
              :to="`/admin/users/${curation.user_id}`"
              class="cur-owner-link"
            >{{ curation.user_name || curation.user_id }}</router-link>
            <span v-else class="text-medium-emphasis">{{ curation.user_name || curation.user_id || '—' }}</span>

            <span class="meta-sep">·</span>

            <v-tooltip location="top" :text="formatExactDate(curation.created)">
              <template #activator="{ props: tipProps }">
                <span v-bind="tipProps" class="text-medium-emphasis">{{ formatRelativeDate(curation.created) }}</span>
              </template>
            </v-tooltip>

            <router-link
              :to="`${curationBasePath}/${curation.id}`"
              class="cur-detail-link"
              aria-label="Open curation detail"
            >
              <v-icon icon="mdi-link-variant" size="small" />
            </router-link>
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
import { useRoute } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { curationDescriptor, useEntityResolver, actionMeta, entityMeta, propertyLabel, formatRelativeDate, formatExactDate } from '@/composables/useCurationDescriptor';
import CurationEntityRef from '@/components/CurationEntityRef.vue';

defineOptions({ name: 'AdminCurations' });

const route = useRoute();

// Context-awareness: detect route context for navigation paths
const curationBasePath = computed(() => {
  if (route.path.startsWith('/admin')) return '/admin/curations';
  if (route.path.startsWith('/settings/site-')) return '/settings/site-curations';
  return '/settings/curations';
});
// Owner links to /admin/users/:userId, which only exists in the site-admin
// area. Org-admin / site-settings contexts have no per-user page.
const isAdminContext = computed(() => route.path.startsWith('/admin'));
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

// Options. Canonical curation verbs are add/remove/replace; icons+colors come
// from the shared composable so the filter and the cards stay in sync.
const actionOptions = ['add', 'remove', 'replace'].map((value) => {
  const m = actionMeta(value);
  return { title: m.label, value, icon: m.icon, color: m.color };
});

const statusOptions = [
  { title: 'Pending', value: 'pending' },
  { title: 'Applied', value: 'applied' },
];

const entityOptions = ['ras', 'authors', 'works'].map((value) => {
  const m = entityMeta(value);
  return { title: m.label, value, icon: m.icon };
});

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
  padding: 12px 16px;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}

.cur-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cur-line-1 {
  flex-wrap: wrap;
  padding-bottom: 10px;
}

.cur-line-2 {
  font-size: 13px;
  padding-top: 10px;
}

.cur-property {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  cursor: default;
}

.cur-owner-link {
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.cur-detail-link {
  display: inline-flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.55);
  margin-left: 2px;

  &:hover {
    color: rgba(0, 0, 0, 0.9);
  }
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
