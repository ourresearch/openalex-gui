<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">Users</h1>

    <!-- Search bar -->
    <v-text-field
      v-model="searchQuery"
      variant="outlined"
      density="comfortable"
      label="Search users by name or email"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details
      class="mb-4"
      @update:model-value="debouncedSearch"
      @click:clear="clearSearch"
    />

    <!-- Error alert -->
    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <!-- Loading -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- Results info and table -->
    <div v-if="users.length || loading">
      <!-- Pagination info -->
      <div class="d-flex justify-space-between align-center mb-2">
        <span class="text-body-2 text-medium-emphasis">
          Showing {{ showingStart }}-{{ showingEnd }} of {{ totalCount }} users
        </span>
        <div class="d-flex align-center ga-2">
          <v-btn
            icon
            variant="text"
            size="small"
            :disabled="page <= 1"
            @click="prevPage"
          >
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>
          <span class="text-body-2">Page {{ page }} of {{ totalPages }}</span>
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

      <!-- Users table -->
      <v-table density="comfortable" class="users-table">
        <thead>
          <tr>
            <th 
              v-for="col in columns" 
              :key="col.key"
              :class="{ 'sortable': col.sortable, 'sorted': sortField === col.sortKey }"
              @click="col.sortable && toggleSort(col.sortKey)"
              style="cursor: pointer; white-space: nowrap;"
            >
              {{ col.label }}
              <v-icon v-if="col.sortable && sortField === col.sortKey" size="small" class="ml-1">
                {{ sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
              </v-icon>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <!-- Name -->
            <td>{{ user.name || '—' }}</td>
            
            <!-- Email -->
            <td>{{ user.email || '—' }}</td>
            
            <!-- Org Name -->
            <td>{{ user.org_name || '—' }}</td>
            
            <!-- API Max/sec -->
            <td class="text-center">{{ user.api_max_per_sec ?? '—' }}</td>
            
            <!-- API Key -->
            <td>
              <div v-if="user.api_key" class="d-flex align-center">
                <code class="text-body-2">{{ truncateApiKey(user.api_key) }}</code>
                <v-btn
                  icon
                  variant="text"
                  size="x-small"
                  @click="copyApiKey(user.api_key)"
                  class="ml-1"
                >
                  <v-icon size="small">mdi-content-copy</v-icon>
                </v-btn>
              </div>
              <span v-else class="text-medium-emphasis">—</span>
            </td>
            
            <!-- API Key Expires -->
            <td>
              <span v-if="user.api_key_expires_at" :class="expiryClass(user.api_key_expires_at)">
                {{ formatDate(user.api_key_expires_at) }}
              </span>
              <span v-else class="text-medium-emphasis">—</span>
            </td>
            
            <!-- Academic Waiver -->
            <td class="text-center">
              <v-chip
                v-if="user.has_academic_waiver"
                size="small"
                color="success"
                variant="tonal"
              >
                Yes
              </v-chip>
              <span v-else class="text-medium-emphasis">—</span>
            </td>
            
            <!-- Role -->
            <td>
              <v-chip
                size="small"
                :color="getRoleColor(user)"
                variant="tonal"
              >
                {{ getRole(user) }}
              </v-chip>
            </td>
            
            <!-- Created -->
            <td>{{ formatDate(user.created) }}</td>
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
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminUsers' });

const store = useStore();

// State
const searchQuery = ref('');
const users = ref([]);
const error = ref('');
const loading = ref(false);
const searched = ref(false);

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

// Columns config
const columns = [
  { key: 'name', label: 'Name', sortable: true, sortKey: 'name' },
  { key: 'email', label: 'Email', sortable: true, sortKey: 'email' },
  { key: 'org_name', label: 'Org Name', sortable: true, sortKey: 'org_name' },
  { key: 'api_max_per_sec', label: 'Max/sec', sortable: false },
  { key: 'api_key', label: 'API Key', sortable: false },
  { key: 'api_key_expires_at', label: 'Key Expires', sortable: true, sortKey: 'api_key_expires_at' },
  { key: 'has_academic_waiver', label: 'Academic', sortable: false },
  { key: 'role', label: 'Role', sortable: false },
  { key: 'created', label: 'Created', sortable: true, sortKey: 'created' },
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

function debouncedSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    fetchUsers();
  }, 300);
}

function clearSearch() {
  searchQuery.value = '';
  page.value = 1;
  fetchUsers();
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

function truncateApiKey(key) {
  if (!key) return '';
  return key.length > 12 ? key.slice(0, 12) + '...' : key;
}

function copyApiKey(key) {
  navigator.clipboard.writeText(key);
  store.commit('snackbar', 'API key copied to clipboard');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function expiryClass(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const daysUntil = (date - now) / (1000 * 60 * 60 * 24);
  
  if (daysUntil < 0) return 'text-error font-weight-bold';
  if (daysUntil < 30) return 'text-warning font-weight-bold';
  return '';
}

function getRole(user) {
  if (user.is_admin) return 'Admin';
  if (user.is_librarian) return 'Librarian';
  return 'User';
}

function getRoleColor(user) {
  if (user.is_admin) return 'error';
  if (user.is_librarian) return 'info';
  return 'default';
}

// Load users on mount
onMounted(() => {
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
  
  td, th {
    font-size: 13px !important;
  }
}
</style>
