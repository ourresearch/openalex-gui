<template>
  <div>
    <!-- Page title -->
    <h1 class="text-h5 font-weight-bold mb-4">Multiple API Keys</h1>
    
    <!-- Controls row: Search -->
    <div class="d-flex align-center ga-3 mb-4">
      <!-- Search field -->
      <v-text-field
        v-model="localSearchQuery"
        variant="outlined"
        density="compact"
        placeholder="Search by API key or owner"
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

      <v-spacer />
    </div>

    <!-- Error alert -->
    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <!-- Results info and table -->
    <div v-if="apiKeys.length || loading || localSearchQuery">
      <!-- Info row -->
      <div class="mb-2">
        <span class="text-body-2 text-medium-emphasis">
          Showing {{ showingStart }}-{{ showingEnd }} of {{ totalCount }} API keys from owners with multiple keys
        </span>
      </div>

      <!-- API Keys table -->
      <v-card variant="outlined" class="bg-white">
        <v-table density="comfortable" class="api-keys-table">
          <thead>
            <tr>
              <th 
                :class="{ 'sortable': true, 'sorted': sortField === 'api_key' }"
                @click="toggleSort('api_key')"
                style="cursor: pointer;"
              >
                API Key
                <v-icon v-if="sortField === 'api_key'" size="small" class="ml-1">
                  {{ sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                </v-icon>
              </th>
              <th 
                :class="{ 'sortable': true, 'sorted': sortField === 'owner' }"
                @click="toggleSort('owner')"
                style="cursor: pointer;"
              >
                Owner
                <v-icon v-if="sortField === 'owner'" size="small" class="ml-1">
                  {{ sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                </v-icon>
              </th>
              <th 
                :class="{ 'sortable': true, 'sorted': sortField === 'calls_per_day' }"
                @click="toggleSort('calls_per_day')"
                style="cursor: pointer;"
              >
                Calls per day
                <v-icon v-if="sortField === 'calls_per_day'" size="small" class="ml-1">
                  {{ sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                </v-icon>
              </th>
              <th>Calls used today</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(item, index) in apiKeys" 
              :key="`${item.api_key}-${item.owner_id}-${index}`"
              class="api-key-row"
            >
              <!-- API Key with copy button -->
              <td>
                <div class="d-flex align-center py-2">
                  <code class="api-key-text mr-2">{{ item.api_key }}</code>
                  <v-btn
                    icon
                    variant="text"
                    size="x-small"
                    @click.stop="copyApiKey(item.api_key)"
                  >
                    <v-icon size="small">{{ copiedKey === item.api_key ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
                  </v-btn>
                </div>
              </td>
              
              <!-- Owner (clickable link with user/org icon) -->
              <td>
                <router-link 
                  v-if="item.owner_id"
                  :to="item.owner_type === 'user' ? `/admin/users/${item.owner_id}` : `/admin/organizations/${item.owner_id}`"
                  class="owner-link"
                  @click.stop
                >
                  <v-icon size="small" class="mr-1">{{ item.owner_type === 'user' ? 'mdi-account' : 'mdi-domain' }}</v-icon>
                  {{ item.owner_name || '—' }}
                </router-link>
                <span v-else class="text-medium-emphasis">—</span>
              </td>
              
              <!-- Calls per day -->
              <td class="number-cell">{{ formatNumber(item.calls_per_day) }}</td>
              
              <!-- Calls used today (placeholder) -->
              <td class="number-cell text-medium-emphasis">—</td>
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
      No owners with multiple API keys found.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminMultipleApiKeys' });

const store = useStore();
const route = useRoute();
const router = useRouter();

// State
const apiKeys = ref([]);
const error = ref('');
const loading = ref(false);
const searched = ref(false);
const copiedKey = ref(null);

// Local search query (for v-model)
const localSearchQuery = ref('');

// URL-synced state (computed from route query)
const searchQuery = computed({
  get: () => route.query.q || '',
  set: (val) => updateUrlParams({ q: val || undefined })
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
async function fetchApiKeys() {
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
      `${urlBase.userApi}/admin/multiple-api-keys?${params.toString()}`,
      axiosConfig({ userAuth: true })
    );

    apiKeys.value = res.data.results || [];
    totalCount.value = res.data.meta?.total_count || 0;
    totalPages.value = res.data.meta?.total_pages || 1;
    searched.value = true;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to fetch API keys.';
    apiKeys.value = [];
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
  if ('q' in params) {
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
  fetchApiKeys();
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
    fetchApiKeys();
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
    fetchApiKeys();
  }
}

async function copyApiKey(apiKey) {
  try {
    await navigator.clipboard.writeText(apiKey);
    copiedKey.value = apiKey;
    store.commit('snackbar', 'API key copied to clipboard.');
    setTimeout(() => {
      copiedKey.value = null;
    }, 2000);
  } catch (e) {
    console.error('Failed to copy API key:', e);
    error.value = 'Failed to copy API key.';
  }
}

function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  return num.toLocaleString();
}

// Watch route query changes and fetch API keys
watch(
  () => route.query,
  () => {
    fetchApiKeys();
  },
  { deep: true }
);

// Sync local search with URL
watch(() => route.query.q, (val) => {
  localSearchQuery.value = val || '';
}, { immediate: true });

// Load API keys on mount
onMounted(() => {
  localSearchQuery.value = route.query.q || '';
  fetchApiKeys();
});
</script>

<style scoped lang="scss">
.api-keys-table {
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

.api-key-row {
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
}

.api-key-text {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 13px;
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.owner-link {
  color: #1976D2;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  
  &:hover {
    text-decoration: underline;
  }
}

.number-cell {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  text-align: right;
}
</style>
