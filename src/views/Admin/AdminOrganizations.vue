<template>
  <div>
    <!-- Page title -->
    <h1 class="text-h5 font-weight-bold mb-4">Organizations</h1>
    
    <!-- Controls row: Search, Filters, Export, Create -->
    <div class="d-flex align-center ga-3 mb-4">
      <!-- Search field (always visible, Linear-style) -->
      <v-text-field
        v-model="localSearchQuery"
        variant="outlined"
        density="compact"
        placeholder="Search by name or domain"
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

      <!-- Plan filter button -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            size="small"
            class="text-none filter-btn"
          >
            {{ selectedPlan ? getPlanDisplayName(selectedPlan) : 'All plans' }}
            <v-icon end size="small">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            :active="!selectedPlan"
            @click="clearPlanFilter"
          >
            <v-list-item-title>All plans</v-list-item-title>
            <template v-if="!selectedPlan" #append>
              <v-icon size="small">mdi-check</v-icon>
            </template>
          </v-list-item>
          <v-list-item
            v-for="plan in availablePlans"
            :key="plan.name"
            :active="selectedPlan === plan.name"
            @click="selectPlanFilter(plan.name)"
          >
            <v-list-item-title>{{ plan.display_name }}</v-list-item-title>
            <template v-if="selectedPlan === plan.name" #append>
              <v-icon size="small">mdi-check</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-spacer />

      <!-- Export CSV button -->
      <v-btn
        variant="outlined"
        size="small"
        class="text-none"
        :loading="exporting"
        :disabled="exporting"
        @click="exportOrganizations"
      >
        <v-icon start size="small">mdi-download</v-icon>
        Export CSV
      </v-btn>

      <!-- Create organization button -->
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        class="text-none"
        @click="openCreateDialog"
      >
        New Organization
      </v-btn>
    </div>

    <!-- Error alert -->
    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <!-- Results info and table -->
    <div v-if="organizations.length || loading || localSearchQuery">
      <!-- Info row -->
      <div class="mb-2">
        <span class="text-body-2 text-medium-emphasis">
          Showing {{ showingStart }}-{{ showingEnd }} of {{ totalCount }} organizations
        </span>
      </div>

      <!-- Organizations table -->
      <v-card variant="outlined" class="bg-white">
      <v-table density="comfortable" class="orgs-table">
        <thead>
          <tr>
            <th>Organization</th>
            <th>Plan</th>
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
            <!-- Organization (name + domains) -->
            <td>
              <div class="py-2">
                <div class="d-flex align-center ga-2">
                  <span class="font-weight-medium">{{ org.name || '—' }}</span>
                </div>
                <div v-if="org.domains && org.domains.length" class="text-caption text-medium-emphasis">
                  {{ org.domains.join(', ') }}
                </div>
              </div>
            </td>
            
            <!-- Plan -->
            <td @click.stop>
              <v-menu location="bottom">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    variant="text"
                    size="small"
                    class="text-none px-1"
                    style="min-width: auto;"
                    :loading="updatingPlanOrgId === org.id"
                  >
                    {{ getPlanDisplayName(org.plan) || '—' }}
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    v-for="plan in availablePlans"
                    :key="plan.name"
                    :active="org.plan === plan.name"
                    @click="updateOrgPlan(org, plan.name)"
                  >
                    <v-list-item-title>{{ plan.display_name }}</v-list-item-title>
                  </v-list-item>
                  <v-divider v-if="org.plan" />
                  <v-list-item
                    v-if="org.plan"
                    @click="updateOrgPlan(org, null)"
                  >
                    <v-list-item-title class="text-medium-emphasis">Remove plan</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
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
            item-title="display_name"
            item-value="name"
            label="Plan (optional)"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            :disabled="createLoading"
          />
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
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { format } from 'timeago.js';
import { urlBase, axiosConfig } from '@/apiConfig';
import { exportToCsv } from '@/utils/csvExport';

defineOptions({ name: 'AdminOrganizations' });

const store = useStore();
const route = useRoute();
const router = useRouter();

// State
const organizations = ref([]);
const error = ref('');
const loading = ref(false);
const searched = ref(false);
const exporting = ref(false);

// Local search query (for v-model)
const localSearchQuery = ref('');

// Plan filter
const availablePlans = ref([]);

// Plan update loading state
const updatingPlanOrgId = ref(null);

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
    updateUrlParams({ q: localSearchQuery.value || undefined });
  }, 300);
}

function clearSearch() {
  localSearchQuery.value = '';
  updateUrlParams({ q: undefined });
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

function getPlanDisplayName(planName) {
  if (!planName) return '';
  const plan = availablePlans.value.find(p => p.name === planName);
  return plan?.display_name || planName;
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

async function updateOrgPlan(org, planName) {
  updatingPlanOrgId.value = org.id;
  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${org.id}`,
      { plan: planName },
      axiosConfig({ userAuth: true })
    );
    // Update the org in the list immediately
    org.plan = planName;
    store.commit('snackbar', planName ? 'Plan updated.' : 'Plan removed.');
  } catch (e) {
    console.error('Failed to update plan:', e);
    error.value = e?.response?.data?.message || 'Failed to update plan.';
  } finally {
    updatingPlanOrgId.value = null;
  }
}

function selectPlanFilter(planId) {
  selectedPlan.value = planId;
}

function clearPlanFilter() {
  selectedPlan.value = null;
}

// Export organizations to CSV
async function exportOrganizations() {
  exporting.value = true;
  
  try {
    const params = {
      sort: sortField.value,
      desc: sortDesc.value.toString(),
    };
    
    if (localSearchQuery.value.trim()) {
      params.q = localSearchQuery.value.trim();
    }
    
    if (selectedPlan.value) {
      params.plan = selectedPlan.value;
    }
    
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'domains', label: 'Domains', transform: (val) => val?.join(', ') || '' },
      { key: 'plan', label: 'Plan', transform: (val) => getPlanDisplayName(val) || '' },
      { key: 'openalex_id', label: 'OpenAlex ID' },
      { key: 'members', label: 'Members', transform: (val) => val?.length || 0 },
      { key: 'created', label: 'Created' },
    ];
    
    const filename = `organizations_${new Date().toISOString().split('T')[0]}.csv`;
    
    const count = await exportToCsv({
      url: `${urlBase.userApi}/organizations`,
      params,
      columns,
      filename,
      perPage: 100,
      maxPages: 100,
    });
    
    store.commit('snackbar', `Exported ${count} organizations.`);
  } catch (e) {
    console.error('Failed to export organizations:', e);
    error.value = 'Failed to export organizations.';
  } finally {
    exporting.value = false;
  }
}

// Watch route query changes and fetch organizations
watch(
  () => route.query,
  () => {
    fetchOrganizations();
  },
  { deep: true }
);

// Sync local search with URL
watch(() => route.query.q, (val) => {
  localSearchQuery.value = val || '';
}, { immediate: true });

// Load organizations on mount
onMounted(() => {
  localSearchQuery.value = route.query.q || '';
  fetchPlans();
  fetchOrganizations();
});
</script>

<style scoped lang="scss">
.orgs-table {
  background: transparent !important;
  
  th {
    font-size: 13px !important;
    font-weight: bold !important;
    white-space: nowrap;
  }
  
  th.sortable:hover {
    background-color: rgba(0, 0, 0, 0.04) !important;
  }
  
  th.sorted {
    color: rgb(var(--v-theme-primary));
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

.filter-btn {
  border-radius: 6px;
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
