<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">Users</h1>

    <!-- Plan filter -->
    <div class="mb-4">
      <v-menu>
        <template #activator="{ props }">
          <v-chip
            v-bind="props"
            :variant="selectedPlans.length ? 'flat' : 'outlined'"
            :color="selectedPlans.length ? 'primary' : undefined"
            append-icon="mdi-chevron-down"
          >
            {{ selectedPlans.length ? formatPlan(selectedPlans[0]) : 'Plan' }}
          </v-chip>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="plan in availablePlans"
            :key="plan.name"
            @click="togglePlanFilter(plan.name)"
          >
            <template #prepend>
              <v-icon v-if="selectedPlans.includes(plan.name)" size="small" class="mr-2">mdi-check</v-icon>
              <span v-else class="mr-2" style="width: 20px; display: inline-block;"></span>
            </template>
            <v-list-item-title>{{ formatPlan(plan.name) }}</v-list-item-title>
          </v-list-item>
          <v-divider v-if="selectedPlans.length" class="my-1" />
          <v-list-item
            v-if="selectedPlans.length"
            @click="clearPlanFilter"
          >
            <v-list-item-title class="text-medium-emphasis">Clear filter</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- Error alert -->
    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <!-- Results info and table -->
    <div v-if="users.length || loading || searchExpanded">
      <!-- Info row with search -->
      <div class="d-flex justify-space-between align-center mb-2">
        <span class="text-body-2 text-medium-emphasis">
          Showing {{ showingStart }}-{{ showingEnd }} of {{ totalCount }} users
        </span>
        <div class="d-flex align-center">
          <!-- Expandable search -->
          <v-text-field
            v-if="searchExpanded"
            ref="searchField"
            v-model="searchQuery"
            variant="outlined"
            density="compact"
            placeholder="Search by name or email"
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
            <v-tooltip activator="parent" location="bottom">Search users</v-tooltip>
          </v-btn>
        </div>
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
            <th 
              :class="{ 'sortable': true, 'sorted': sortField === 'org_name' }"
              @click="toggleSort('org_name')"
              style="cursor: pointer;"
            >
              Organization
              <v-icon v-if="sortField === 'org_name'" size="small" class="ml-1">
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
                    :alt="user.name"
                  />
                  <span v-else class="text-white font-weight-medium">
                    {{ getInitial(user) }}
                  </span>
                </v-avatar>
                <div>
                  <div class="d-flex align-center ga-2">
                    <span class="font-weight-medium">{{ user.name || '—' }}</span>
                    <v-icon v-if="user.is_admin" size="x-small" color="amber-darken-2">mdi-crown</v-icon>
                    <v-chip
                      v-if="user.plan"
                      size="x-small"
                      :color="getPlanColor(user.plan)"
                      variant="tonal"
                      class="plan-chip"
                    >
                      {{ formatPlan(user.plan) }}
                    </v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis">{{ user.email || '—' }}</div>
                </div>
              </div>
            </td>
            
            <!-- Organization -->
            <td>{{ user.org_name || '—' }}</td>
            
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
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { format } from 'timeago.js';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminUsers' });

const store = useStore();
const route = useRoute();
const router = useRouter();

// State
const users = ref([]);
const error = ref('');
const loading = ref(false);
const searched = ref(false);
const searchExpanded = ref(false);
const searchField = ref(null);

// Plan filter
const availablePlans = ref([]);

// URL-synced state (computed from route query)
const searchQuery = computed({
  get: () => route.query.q || '',
  set: (val) => updateUrlParams({ q: val || undefined })
});

const selectedPlans = computed({
  get: () => {
    const plan = route.query.plan;
    if (!plan) return [];
    return plan.split(',').filter(Boolean);
  },
  set: (val) => updateUrlParams({ plan: val.length ? val.join(',') : undefined })
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

    if (selectedPlans.value.length) {
      params.set('plan', selectedPlans.value.join(','));
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

function clearSearch() {
  searchQuery.value = '';
  page.value = 1;
  fetchUsers();
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
    fetchUsers();
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


function getInitial(user) {
  if (user.name) return user.name.charAt(0).toUpperCase();
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

function formatPlan(plan) {
  const planLabels = {
    'starter': 'Starter',
    '1M-daily': '1M Daily',
    '2M-daily': '2M Daily',
    'academic-waiver': 'Waiver',
  };
  return planLabels[plan] || plan;
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

function togglePlanFilter(planId) {
  const current = [...selectedPlans.value];
  const index = current.indexOf(planId);
  if (index === -1) {
    current.push(planId);
  } else {
    current.splice(index, 1);
  }
  // If all plans are selected, clear the filter (all = none)
  if (current.length === availablePlans.value.length) {
    selectedPlans.value = [];
  } else {
    selectedPlans.value = current;
  }
}

function clearPlanFilter() {
  selectedPlans.value = [];
}

// Watch route query changes and fetch users
watch(
  () => route.query,
  () => {
    fetchUsers();
  },
  { deep: true }
);

// Load plans and users on mount
onMounted(() => {
  // If arriving with a search query, expand the search field
  if (route.query.q) {
    searchExpanded.value = true;
  }
  fetchPlans();
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
  width: 280px;
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
</style>
