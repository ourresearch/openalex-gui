<template>
  <div>
    <!-- Page title -->
    <h1 class="text-h5 font-weight-bold mb-4">Users</h1>
    
    <!-- Controls row: Search, Filters, Export, Create -->
    <div class="d-flex align-center ga-3 mb-4">
      <!-- Search field (always visible, Linear-style) -->
      <v-text-field
        v-model="localSearchQuery"
        variant="outlined"
        density="compact"
        placeholder="Search by name or email"
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

      <!-- Organization filter button -->
      <v-menu :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            size="small"
            class="text-none filter-btn"
          >
            {{ selectedOrg ? selectedOrg.name : 'All organizations' }}
            <v-icon end size="small">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-card min-width="280" class="pa-2">
          <v-autocomplete
            v-model="selectedOrg"
            :items="orgSearchResults"
            :loading="orgSearchLoading"
            item-title="name"
            item-value="id"
            return-object
            placeholder="Search organizations..."
            density="compact"
            variant="outlined"
            hide-details
            no-filter
            clearable
            autofocus
            @update:search="onOrgSearch"
            @update:model-value="onOrgSelect"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #subtitle>
                  <span v-if="item.raw.domains && item.raw.domains.length">
                    {{ item.raw.domains.join(', ') }}
                  </span>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-card>
      </v-menu>

      <v-spacer />

      <!-- Create user button -->
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        class="text-none"
        @click="openCreateDialog"
      >
        New User
      </v-btn>
    </div>

    <!-- Error alert -->
    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <!-- Results info and table -->
    <div v-if="users.length || loading || localSearchQuery">
      <!-- Info row -->
      <div class="mb-2">
        <span class="text-body-2 text-medium-emphasis">
          Showing {{ showingStart }}-{{ showingEnd }} of {{ totalCount }} users
        </span>
      </div>

      <!-- Users table -->
      <v-table density="comfortable" class="users-table">
        <thead>
          <tr>
            <th 
              :class="{ 'sortable': true, 'sorted': sortField === 'name' }"
              @click="toggleSort('name')"
              style="cursor: pointer;"
            >
              User
              <v-icon v-if="sortField === 'name'" size="small" class="ml-1">
                {{ sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
              </v-icon>
            </th>
            <th>Organization</th>
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
            v-for="user in users" 
            :key="user.id"
            class="user-row"
            @click="openUserPanel(user.id)"
          >
            <!-- User (avatar + name + email) -->
            <td>
              <div class="d-flex align-center py-2">
                <v-avatar size="40" class="mr-3" :color="getAvatarColor(user)">
                  <v-img 
                    v-if="user.gravatar_url" 
                    :src="user.gravatar_url"
                    :alt="user.display_name"
                  />
                  <span v-else class="text-white font-weight-medium">
                    {{ getInitial(user) }}
                  </span>
                </v-avatar>
                <div>
                  <div class="d-flex align-center ga-2">
                    <span class="font-weight-medium">{{ user.display_name || '—' }}</span>
                    <v-icon v-if="user.is_admin" size="x-small" color="amber-darken-2">mdi-crown</v-icon>
                    <v-chip
                      v-if="user.plan"
                      size="x-small"
                      variant="outlined"
                      color="grey"
                      label
                      class="plan-chip"
                    >
                      {{ getPlanDisplayName(user.plan) }}
                    </v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis">{{ user.email || '—' }}</div>
                </div>
              </div>
            </td>
            
            <!-- Organization -->
            <td>{{ user.organization_name || '—' }}</td>
            
            <!-- Age -->
            <td>
              <v-tooltip :text="formatDateTime(user.created)" location="top">
                <template #activator="{ props }">
                  <span v-bind="props">{{ formatAge(user.created) }}</span>
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
      No users found.
    </div>

    <!-- Create User Dialog -->
    <v-dialog v-model="createDialogOpen" max-width="500">
      <v-card :loading="createLoading" :disabled="createLoading" flat rounded>
        <v-card-title>Create user</v-card-title>
        <v-alert v-if="createError" type="error" density="compact" class="mx-4 mt-2">{{ createError }}</v-alert>
        <div class="pa-4">
          <v-text-field
            v-model="newUser.name"
            label="Name"
            variant="outlined"
            density="compact"
            class="mb-3"
            :disabled="createLoading"
          />
          <v-text-field
            v-model="newUser.email"
            label="Email"
            variant="outlined"
            density="compact"
            class="mb-3"
            :disabled="createLoading"
          />
          <v-autocomplete
            v-model="newUser.organization"
            :items="newUserOrgResults"
            :loading="newUserOrgLoading"
            item-title="name"
            item-value="id"
            return-object
            label="Organization (optional)"
            variant="outlined"
            density="compact"
            hide-details
            no-filter
            clearable
            class="mb-3"
            :disabled="createLoading"
            @update:search="onNewUserOrgSearch"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #subtitle>
                  <span v-if="item.raw.domains && item.raw.domains.length">
                    {{ item.raw.domains.join(', ') }}
                  </span>
                </template>
              </v-list-item>
            </template>
            <template #no-data>
              <v-list-item v-if="newUserOrgQuery">
                <v-list-item-title class="text-medium-emphasis">No organizations found</v-list-item-title>
              </v-list-item>
            </template>
          </v-autocomplete>
          <v-select
            v-if="newUser.organization"
            v-model="newUser.role"
            :items="roleOptions"
            label="Role"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-3"
            :disabled="createLoading"
          />
          <v-select
            v-model="newUser.plan"
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
            @click="createUser" 
            :disabled="!canCreateUser || createLoading"
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

defineOptions({ name: 'AdminUsers' });

const store = useStore();
const route = useRoute();
const router = useRouter();

// State
const users = ref([]);
const error = ref('');
const loading = ref(false);
const searched = ref(false);
const exporting = ref(false);

// Local search query (for v-model)
const localSearchQuery = ref('');

// Plan filter
const availablePlans = ref([]);

// Organization filter
const orgSearchResults = ref([]);
const orgSearchLoading = ref(false);
const orgSearchQuery = ref('');
const selectedOrg = ref(null);
let orgSearchTimer = null;

// Computed for active filters
const hasActiveFilters = computed(() => {
  return selectedPlan.value || selectedOrg.value;
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (selectedPlan.value) count++;
  if (selectedOrg.value) count++;
  return count;
});

// Create user dialog
const createDialogOpen = ref(false);
const createLoading = ref(false);
const createError = ref('');
const newUser = ref({
  name: '',
  email: '',
  organization: null,
  role: 'member',
  plan: null
});
const newUserOrgResults = ref([]);
const newUserOrgLoading = ref(false);
const newUserOrgQuery = ref('');
let newUserOrgTimer = null;
const roleOptions = [
  { title: 'Member', value: 'member' },
  { title: 'Owner', value: 'owner' }
];

const canCreateUser = computed(() => {
  return newUser.value.name?.trim() && newUser.value.email?.trim();
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

// Selected organization (URL-synced)
const selectedOrgId = computed({
  get: () => route.query.org || null,
  set: (val) => updateUrlParams({ org: val || undefined })
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

// Avatar colors for users without gravatar
const avatarColors = [
  '#1976D2', '#388E3C', '#D32F2F', '#7B1FA2', 
  '#C2185B', '#0097A7', '#F57C00', '#5D4037'
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
async function fetchUsers() {
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

    if (selectedOrgId.value) {
      params.set('organization_id', selectedOrgId.value);
    }

    const res = await axios.get(
      `${urlBase.userApi}/users?${params.toString()}`,
      axiosConfig({ userAuth: true })
    );

    users.value = res.data.results || [];
    totalCount.value = res.data.meta?.total_count || 0;
    totalPages.value = res.data.meta?.total_pages || 1;
    searched.value = true;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to fetch users.';
    users.value = [];
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
  if ('q' in params || 'plan' in params || 'org' in params) {
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

function clearAllFilters() {
  selectedPlan.value = null;
  selectedOrg.value = null;
  selectedOrgId.value = null;
}

function toggleSort(field) {
  if (sortField.value === field) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortField.value = field;
    sortDesc.value = true;
  }
  page.value = 1;
  fetchUsers();
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
    fetchUsers();
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
    fetchUsers();
  }
}

function openUserPanel(userId) {
  router.push(`/admin/users/${userId}`);
}

// Create user dialog functions
function openCreateDialog() {
  createDialogOpen.value = true;
  createError.value = '';
  newUser.value = {
    name: '',
    email: '',
    organization: null,
    role: 'member',
    plan: null
  };
  newUserOrgResults.value = [];
  newUserOrgQuery.value = '';
}

function closeCreateDialog() {
  createDialogOpen.value = false;
}

function onNewUserOrgSearch(val) {
  newUserOrgQuery.value = val || '';
  clearTimeout(newUserOrgTimer);
  
  if (!val || !val.trim()) {
    newUserOrgResults.value = [];
    newUserOrgLoading.value = false;
    return;
  }
  
  newUserOrgLoading.value = true;
  
  newUserOrgTimer = setTimeout(async () => {
    try {
      const params = new URLSearchParams({
        q: val.trim(),
        per_page: '10',
      });
      const res = await axios.get(
        `${urlBase.userApi}/organizations?${params.toString()}`,
        axiosConfig({ userAuth: true })
      );
      newUserOrgResults.value = res.data.results || [];
    } catch (e) {
      console.error('Failed to search organizations:', e);
      newUserOrgResults.value = [];
    } finally {
      newUserOrgLoading.value = false;
    }
  }, 300);
}

async function createUser() {
  createLoading.value = true;
  
  try {
    const payload = {
      display_name: newUser.value.name.trim(),
      email: newUser.value.email.trim()
    };
    
    if (newUser.value.organization) {
      payload.organization_id = newUser.value.organization.id;
      payload.organization_role = newUser.value.role;
    }
    
    if (newUser.value.plan) {
      payload.plan = newUser.value.plan;
    }
    
    await axios.post(
      `${urlBase.userApi}/admin/users`,
      payload,
      axiosConfig({ userAuth: true })
    );
    
    closeCreateDialog();
    store.commit('snackbar', 'User created.');
    await fetchUsers();
  } catch (e) {
    console.error('Failed to create user:', e);
    createError.value = e?.response?.data?.message || 'Failed to create user.';
  } finally {
    createLoading.value = false;
  }
}


function getInitial(user) {
  if (user.display_name) return user.display_name.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();
  return '?';
}

function getAvatarColor(user) {
  // Generate consistent color based on user id or email
  const str = user.id || user.email || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
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

function getExpiryTooltip(dateStr) {
  if (!dateStr) return '';
  const date = parseUTCDate(dateStr);
  const now = new Date();
  const diffMs = date - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
  } else if (diffDays === 0) {
    return 'Expires today';
  } else if (diffDays === 1) {
    return 'Expires in 1 day';
  } else if (diffDays < 30) {
    return `Expires in ${diffDays} days`;
  } else if (diffDays < 365) {
    const months = Math.round(diffDays / 30);
    return `Expires in ${months} month${months !== 1 ? 's' : ''}`;
  } else {
    const years = Math.round(diffDays / 365);
    return `Expires in ${years} year${years !== 1 ? 's' : ''}`;
  }
}

function getPlanDisplayName(planName) {
  if (!planName) return '';
  const plan = availablePlans.value.find(p => p.name === planName);
  return plan?.display_name || planName;
}

function getPlanColor(plan) {
  const planColors = {
    'starter': 'grey',
    '1M-daily': 'primary',
    '2M-daily': 'primary',
    'academic-waiver': 'info',
  };
  return planColors[plan] || 'grey';
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

// Organization filter functions
function onOrgSearch(val) {
  orgSearchQuery.value = val || '';
  clearTimeout(orgSearchTimer);
  
  if (!val || !val.trim()) {
    orgSearchResults.value = [];
    orgSearchLoading.value = false;
    return;
  }
  
  orgSearchLoading.value = true;
  
  orgSearchTimer = setTimeout(async () => {
    try {
      const params = new URLSearchParams({
        q: val.trim(),
        per_page: '10',
      });
      const res = await axios.get(
        `${urlBase.userApi}/organizations?${params.toString()}`,
        axiosConfig({ userAuth: true })
      );
      orgSearchResults.value = res.data.results || [];
    } catch (e) {
      console.error('Failed to search organizations:', e);
      orgSearchResults.value = [];
    } finally {
      orgSearchLoading.value = false;
    }
  }, 300);
}

function onOrgSelect(org) {
  if (org) {
    selectedOrgId.value = org.id;
    selectedOrg.value = org;
  } else {
    selectedOrgId.value = null;
    selectedOrg.value = null;
  }
}

function clearOrgFilter() {
  selectedOrgId.value = null;
  selectedOrg.value = null;
  orgSearchResults.value = [];
}

// Export users to CSV
async function exportUsers() {
  if (!selectedOrgId.value) return;
  
  exporting.value = true;
  
  try {
    const params = {
      organization_id: selectedOrgId.value,
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
      { key: 'display_name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'organization_role', label: 'Role' },
      { key: 'plan', label: 'Plan', transform: (val) => getPlanDisplayName(val) || '' },
      { key: 'api_key', label: 'API Key' },
      { key: 'created', label: 'Created' },
      { key: 'last_seen', label: 'Last Seen' },
    ];
    
    const orgName = selectedOrg.value?.name || 'users';
    const filename = `${orgName.replace(/[^a-z0-9]/gi, '_')}_users_${new Date().toISOString().split('T')[0]}.csv`;
    
    const count = await exportToCsv({
      url: `${urlBase.userApi}/users`,
      params,
      columns,
      filename,
      perPage: 100,
      maxPages: 100,
    });
    
    store.commit('snackbar', `Exported ${count} users.`);
  } catch (e) {
    console.error('Failed to export users:', e);
    error.value = 'Failed to export users.';
  } finally {
    exporting.value = false;
  }
}

async function fetchOrgIfNeeded() {
  // If we have an org ID in URL but no selectedOrg, fetch it
  if (selectedOrgId.value && !selectedOrg.value) {
    try {
      const res = await axios.get(
        `${urlBase.userApi}/organizations/${selectedOrgId.value}`,
        axiosConfig({ userAuth: true })
      );
      selectedOrg.value = res.data;
    } catch (e) {
      console.error('Failed to fetch organization:', e);
    }
  }
}

// Watch route query changes and fetch users
watch(
  () => route.query,
  () => {
    fetchUsers();
  },
  { deep: true }
);

// Sync local search with URL
watch(() => route.query.q, (val) => {
  localSearchQuery.value = val || '';
}, { immediate: true });

// Load plans and users on mount
onMounted(() => {
  localSearchQuery.value = route.query.q || '';
  fetchPlans();
  fetchOrgIfNeeded();
  fetchUsers();
});
</script>

<style scoped lang="scss">
.users-table {
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
  max-width: 320px;
  flex-shrink: 0;
  
  :deep(.v-field) {
    border-radius: 6px;
  }
}

.filter-btn {
  border-radius: 6px;
}

.user-row {
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
}

.plan-chip {
  font-size: 10px !important;
  height: 18px !important;
}

.org-autocomplete-menu {
  min-width: 350px;
  
  :deep(.v-field) {
    border-radius: 4px 4px 0 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  :deep(.v-autocomplete__menu-icon) {
    display: none;
  }
}
</style>
