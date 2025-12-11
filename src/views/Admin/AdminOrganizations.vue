<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 font-weight-bold">Organizations</h1>
      <div class="d-flex align-center">
        <!-- Expandable search -->
        <v-text-field
          v-if="searchExpanded"
          ref="searchField"
          v-model="searchQuery"
          variant="outlined"
          density="compact"
          placeholder="Search by name or domain"
          hide-details
          autofocus
          :loading="loading"
          class="search-field"
          @update:model-value="debouncedSearch"
          @blur="collapseSearchIfEmpty"
          @keydown.escape="collapseSearch"
        >
          <template #append-inner>
            <v-btn
              icon
              variant="text"
              size="x-small"
              @click="collapseSearch"
            >
              <v-icon size="small">mdi-close</v-icon>
            </v-btn>
          </template>
        </v-text-field>
        <v-btn
          v-else
          icon
          variant="text"
          size="small"
          @click="expandSearch"
        >
          <v-icon>mdi-magnify</v-icon>
          <v-tooltip activator="parent" location="bottom">Search organizations</v-tooltip>
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          class="ml-2"
          @click="openCreateDialog"
        >
          <v-icon start size="small">mdi-plus</v-icon>
          New
        </v-btn>
      </div>
    </div>

    <!-- Plan filter -->
    <div class="mb-4">
      <v-menu>
        <template #activator="{ props }">
          <v-chip
            v-bind="selectedPlan ? {} : props"
            :variant="selectedPlan ? 'flat' : 'outlined'"
            :color="selectedPlan ? 'primary' : undefined"
            :append-icon="selectedPlan ? undefined : 'mdi-chevron-down'"
          >
            <span v-if="!selectedPlan" v-bind="props" style="cursor: pointer;">Plan</span>
            <template v-else>
              {{ formatPlan(selectedPlan) }}
              <v-icon size="small" class="ml-1" @click.stop="clearPlanFilter">mdi-close</v-icon>
            </template>
          </v-chip>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="plan in availablePlans"
            :key="plan.name"
            @click="selectPlanFilter(plan.name)"
          >
            <v-list-item-title>{{ formatPlan(plan.name) }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- Error alert -->
    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <!-- Results info and table -->
    <div v-if="organizations.length || loading || searchExpanded">
      <!-- Info row -->
      <div class="mb-2">
        <span class="text-body-2 text-medium-emphasis">
          Showing {{ showingStart }}-{{ showingEnd }} of {{ totalCount }} organizations
        </span>
      </div>

      <!-- Organizations table -->
      <v-table density="comfortable" class="orgs-table">
        <thead>
          <tr>
            <th>Organization</th>
            <th 
              :class="{ 'sortable': true, 'sorted': sortField === 'member_count' }"
              @click="toggleSort('member_count')"
              style="cursor: pointer;"
            >
              Members
              <v-icon v-if="sortField === 'member_count'" size="small" class="ml-1">
                {{ sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
              </v-icon>
            </th>
            <th 
              :class="{ 'sortable': true, 'sorted': sortField === 'created' }"
              @click="toggleSort('created')"
              style="cursor: pointer;"
            >
              Created
              <v-icon v-if="sortField === 'created'" size="small" class="ml-1">
                {{ sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
              </v-icon>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="org in organizations" 
            :key="org.id"
            class="org-row"
            @click="openOrgDetail(org.id)"
          >
            <!-- Organization (name + plan + domains) -->
            <td>
              <div class="py-2">
                <div class="d-flex align-center ga-2">
                  <span class="font-weight-medium">{{ org.name || '—' }}</span>
                  <v-chip
                    v-if="org.plan"
                    size="x-small"
                    variant="outlined"
                    color="grey"
                    label
                    class="plan-chip"
                  >
                    {{ formatPlan(org.plan) }}
                  </v-chip>
                </div>
                <div v-if="org.domains && org.domains.length" class="text-caption text-medium-emphasis">
                  {{ org.domains.join(', ') }}
                </div>
              </div>
            </td>
            
            <!-- Members count -->
            <td>{{ org.members ? org.members.length : 0 }}</td>
            
            <!-- Created -->
            <td>
              <v-tooltip :text="formatDateTime(org.created)" location="top">
                <template #activator="{ props }">
                  <span v-bind="props">{{ formatAge(org.created) }}</span>
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
    <div v-else-if="searched && !loading" class="text-center text-medium-emphasis py-8">
      No organizations found.
    </div>

    <!-- Create Organization Dialog -->
    <v-dialog v-model="createDialogOpen" max-width="500">
      <v-card :loading="createLoading" :disabled="createLoading" flat rounded>
        <v-card-title>Create organization</v-card-title>
        <v-alert v-if="createError" type="error" density="compact" class="mx-4 mt-2">{{ createError }}</v-alert>
        <div class="pa-4">
          <v-text-field
            v-model="newOrg.name"
            label="Name"
            variant="outlined"
            density="compact"
            class="mb-3"
            :disabled="createLoading"
          />
          <v-select
            v-model="newOrg.plan"
            :items="availablePlans"
            item-title="name"
            item-value="name"
            label="Plan (optional)"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            :disabled="createLoading"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :title="formatPlan(item.raw.name)" />
            </template>
            <template #selection="{ item }">
              {{ formatPlan(item.raw.name) }}
            </template>
          </v-select>
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeCreateDialog" :disabled="createLoading">Cancel</v-btn>
          <v-btn 
            color="primary"
            variant="flat"
            @click="createOrganization" 
            :disabled="!canCreateOrg || createLoading"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { format } from 'timeago.js';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminOrganizations' });

const store = useStore();
const route = useRoute();
const router = useRouter();

// State
const organizations = ref([]);
const error = ref('');
const loading = ref(false);
const searched = ref(false);
const searchExpanded = ref(false);
const searchField = ref(null);

// Plan filter
const availablePlans = ref([]);

// Create organization dialog
const createDialogOpen = ref(false);
const createLoading = ref(false);
const createError = ref('');
const newOrg = ref({
  name: '',
  plan: null
});

const canCreateOrg = computed(() => {
  return newOrg.value.name?.trim();
});

// URL-synced state (computed from route query)
const searchQuery = computed({
  get: () => route.query.q || '',
  set: (val) => updateUrlParams({ q: val || undefined })
});

const selectedPlan = computed({
  get: () => route.query.plan || null,
  set: (val) => updateUrlParams({ plan: val || undefined })
});

// Pagination
const page = ref(1);
const perPage = ref(25);
const totalCount = ref(0);
const totalPages = ref(1);

// Sorting
const sortField = ref('created');
const sortDesc = ref(true);

// Debounce timer
let debounceTimer = null;

// Computed
const showingStart = computed(() => {
  if (totalCount.value === 0) return 0;
  return (page.value - 1) * perPage.value + 1;
});

const showingEnd = computed(() => {
  return Math.min(page.value * perPage.value, totalCount.value);
});

// Methods
async function fetchOrganizations() {
  error.value = '';
  loading.value = true;

  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      per_page: perPage.value.toString(),
      sort: sortField.value,
      desc: sortDesc.value.toString(),
    });

    if (searchQuery.value.trim()) {
      params.set('q', searchQuery.value.trim());
    }

    if (selectedPlan.value) {
      params.set('plan', selectedPlan.value);
    }

    const res = await axios.get(
      `${urlBase.userApi}/organizations?${params.toString()}`,
      axiosConfig({ userAuth: true })
    );

    organizations.value = res.data.results || [];
    totalCount.value = res.data.meta?.total_count || 0;
    totalPages.value = res.data.meta?.total_pages || 1;
    searched.value = true;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to fetch organizations.';
    organizations.value = [];
  } finally {
    loading.value = false;
  }
}

function updateUrlParams(params) {
  const newQuery = { ...route.query };
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      delete newQuery[key];
    } else {
      newQuery[key] = value;
    }
  }
  // Reset page when filters change
  if ('q' in params || 'plan' in params) {
    delete newQuery.page;
  }
  router.replace({ query: newQuery });
}

function debouncedSearch() {
  loading.value = true;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateUrlParams({ q: searchQuery.value || undefined });
  }, 300);
}

function expandSearch() {
  searchExpanded.value = true;
  nextTick(() => {
    searchField.value?.focus();
  });
}

function collapseSearch() {
  searchExpanded.value = false;
  if (searchQuery.value) {
    searchQuery.value = '';
    page.value = 1;
    fetchOrganizations();
  }
}

function collapseSearchIfEmpty() {
  if (!searchQuery.value) {
    searchExpanded.value = false;
  }
}

function toggleSort(field) {
  if (sortField.value === field) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortField.value = field;
    sortDesc.value = true;
  }
  page.value = 1;
  fetchOrganizations();
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
    fetchOrganizations();
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
    fetchOrganizations();
  }
}

function openOrgDetail(orgId) {
  router.push(`/admin/organizations/${orgId}`);
}

// Create organization dialog functions
function openCreateDialog() {
  createDialogOpen.value = true;
  createError.value = '';
  newOrg.value = {
    name: '',
    plan: null
  };
}

function closeCreateDialog() {
  createDialogOpen.value = false;
}

async function createOrganization() {
  createLoading.value = true;
  
  try {
    const payload = {
      name: newOrg.value.name.trim()
    };
    
    if (newOrg.value.plan) {
      payload.plan = newOrg.value.plan;
    }
    
    await axios.post(
      `${urlBase.userApi}/organizations`,
      payload,
      axiosConfig({ userAuth: true })
    );
    
    closeCreateDialog();
    store.commit('snackbar', 'Organization created.');
    await fetchOrganizations();
  } catch (e) {
    console.error('Failed to create organization:', e);
    createError.value = e?.response?.data?.message || 'Failed to create organization.';
  } finally {
    createLoading.value = false;
  }
}

function parseUTCDate(dateStr) {
  if (!dateStr) return null;
  // If the date string doesn't have timezone info, treat it as UTC
  if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    dateStr = dateStr.replace(' ', 'T') + 'Z';
  }
  return new Date(dateStr);
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = parseUTCDate(dateStr);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function formatAge(dateStr) {
  if (!dateStr) return '—';
  return format(parseUTCDate(dateStr));
}

function formatPlan(plan) {
  if (!plan) return '';
  const labels = {
    'starter': 'Starter',
    '1M-daily': '1M',
    '2M-daily': '2M',
    'academic-waiver': 'Waiver',
  };
  return labels[plan] || plan;
}

function getPlanColor(plan) {
  if (!plan) return 'default';
  const colors = {
    '1M-daily': 'blue',
    '2M-daily': 'purple',
    'academic-waiver': 'green',
  };
  return colors[plan] || 'default';
}

async function fetchPlans() {
  try {
    const res = await axios.get(
      `${urlBase.userApi}/plans`,
      axiosConfig({ userAuth: true })
    );
    availablePlans.value = res.data.results || [];
  } catch (e) {
    console.error('Failed to fetch plans:', e);
  }
}

function selectPlanFilter(planId) {
  selectedPlan.value = planId;
}

function clearPlanFilter() {
  selectedPlan.value = null;
}

// Watch route query changes and fetch organizations
watch(
  () => route.query,
  () => {
    fetchOrganizations();
  },
  { deep: true }
);

// Load organizations on mount
onMounted(() => {
  // If arriving with a search query, expand the search field
  if (route.query.q) {
    searchExpanded.value = true;
  }
  fetchPlans();
  fetchOrganizations();
});
</script>

<style scoped lang="scss">
.orgs-table {
  th.sortable:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
  
  th.sorted {
    color: rgb(var(--v-theme-primary));
  }
  
  th {
    font-size: 13px !important;
    white-space: nowrap;
  }
  
  td {
    font-size: 14px !important;
  }
}

.search-field {
  width: 280px;
}

.org-row {
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
}

.plan-chip {
  font-size: 10px !important;
  height: 18px !important;
}
</style>
