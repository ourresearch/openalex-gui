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
        label="Entity type"
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
          <v-list-item v-bind="props" :prepend-icon="item.raw.icon" />
        </template>
        <template #selection="{ item }">
          <v-icon :icon="item.raw.icon" size="small" class="mr-1" />
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
      >
        <template #item="{ item, props: itemProps }">
          <v-list-item v-bind="itemProps" :prepend-icon="item.raw.icon" />
        </template>
        <template #selection="{ item }">
          <v-icon :icon="item.raw.icon" size="small" class="mr-1" />
          {{ item.title }}
        </template>
      </v-select>

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
      <v-table density="comfortable" class="curation-table">
        <thead>
          <tr>
            <th class="col-status" />
            <th>Target entity</th>
            <th>Property</th>
            <th>New value</th>
            <th>Owner</th>
            <th class="col-created">Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="curation in curations" :key="curation.id">
            <!-- Status: applied/pending icon -->
            <td class="col-status">
              <v-tooltip location="bottom" :text="statusMeta(curation).label">
                <template #activator="{ props: tipProps }">
                  <v-icon
                    v-bind="tipProps"
                    :icon="statusMeta(curation).icon"
                    :color="statusMeta(curation).color"
                    size="small"
                  />
                </template>
              </v-tooltip>
            </td>

            <!-- Entity: type icon + resolved name -->
            <td>
              <CurationEntityRef
                :entity-ref="descriptorFor(curation).headerRef"
                :entity-map="entityMap"
                :icon="entityMeta(curation.entity).icon"
                max-width="320px"
              />
            </td>

            <!-- Property: action icon + human property label.
                 Tooltip (oxjob #193 R9): two rows — action icon + label on
                 top, the raw techy property string in monospace below. -->
            <td>
              <v-tooltip location="bottom" max-width="320">
                <template #activator="{ props: tipProps }">
                  <span v-bind="tipProps" class="cur-property">
                    <v-icon
                      :icon="actionMeta(curation.action).icon"
                      size="small"
                      class="cur-action-icon"
                    />
                    <span class="cur-property-label">{{ propertyLabel(curation) }}</span>
                  </span>
                </template>
                <CurationTooltipBody
                  :icon="actionMeta(curation.action).icon"
                  :primary="actionMeta(curation.action).label"
                  :secondary="curation.property || '—'"
                />
              </v-tooltip>
            </td>

            <!-- New value: entity (icon+name) when resolvable, else text.
                 The previous value is intentionally NOT shown here (oxjob #193
                 R9 — it added little in the list and often just duplicated the
                 new value); the before→after diff lives on the detail page. -->
            <td>
              <CurationEntityRef
                :entity-ref="descriptorFor(curation).targetRef"
                :entity-map="entityMap"
                :icon="refIcon(descriptorFor(curation).targetRef)"
                max-width="280px"
              />
            </td>

            <!-- Owner: name, tooltip with full name + user id beneath -->
            <td>
              <v-tooltip location="bottom" max-width="420">
                <template #activator="{ props: tipProps }">
                  <router-link
                    v-if="isAdminContext && curation.user_id"
                    v-bind="tipProps"
                    :to="`/admin/users/${curation.user_id}`"
                    class="cur-owner-link cur-trunc-cell"
                  >{{ curation.user_name || curation.user_id }}</router-link>
                  <span
                    v-else
                    v-bind="tipProps"
                    class="text-medium-emphasis cur-trunc-cell"
                  >{{ curation.user_name || curation.user_id || '—' }}</span>
                </template>
                <CurationTooltipBody
                  :primary="curation.user_name || curation.user_id || '—'"
                  :secondary="curation.user_id || ''"
                />
              </v-tooltip>
            </td>

            <!-- Created: short age, links to the curation detail page -->
            <td class="col-created">
              <v-tooltip location="bottom" :text="formatExactDate(curation.created)">
                <template #activator="{ props: tipProps }">
                  <router-link
                    v-bind="tipProps"
                    :to="`${curationBasePath}/${curation.id}`"
                    class="cur-created-link"
                  >{{ formatRelativeShort(curation.created) }}</router-link>
                </template>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </v-table>

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
import { curationDescriptor, useEntityResolver, actionMeta, entityMeta, refIcon, propertyLabel, formatRelativeShort, formatExactDate, statusMeta } from '@/composables/useCurationDescriptor';
import CurationEntityRef from '@/components/CurationEntityRef.vue';
import CurationTooltipBody from '@/components/CurationTooltipBody.vue';

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

// Options. Canonical curation verbs are add/remove/replace; icons come
// from the shared composable so the filter and the table stay in sync.
const actionOptions = ['add', 'remove', 'replace'].map((value) => {
  const m = actionMeta(value);
  return { title: m.label, value, icon: m.icon };
});

const statusOptions = [
  { title: 'Pending', value: 'pending', icon: 'mdi-clock-outline' },
  { title: 'Applied', value: 'applied', icon: 'mdi-check-circle' },
  { title: 'Timed out', value: 'timed_out', icon: 'mdi-close-circle' },
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
      params.set('status', statusFilter.value);
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
.curation-table {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;

  :deep(thead th) {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(0, 0, 0, 0.55);
  }

  :deep(td) {
    font-size: 14px;
  }

  .col-status {
    width: 48px;
    text-align: center;
  }

  .col-created {
    white-space: nowrap;
  }
}

.cur-property {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 260px;
  color: rgba(0, 0, 0, 0.7);
  cursor: default;
}

.cur-property-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.cur-action-icon {
  flex-shrink: 0;
}

.cur-trunc-cell {
  display: inline-block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.cur-owner-link {
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.cur-created-link {
  color: rgba(0, 0, 0, 0.6);
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: rgba(0, 0, 0, 0.9);
    text-decoration: underline;
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
</style>
