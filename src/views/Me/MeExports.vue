<template>
  <div>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h5 font-weight-bold">Exports</h1>
      <v-spacer />
      <v-btn
        v-if="exports.length"
        variant="text"
        color="error"
        size="small"
        prepend-icon="mdi-delete-outline"
        @click="deleteAllExports"
      >
        Delete all
      </v-btn>
    </div>

    <v-card flat variant="outlined" class="bg-white">
      <v-card-text v-if="isLoading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <div class="mt-4 text-grey">Loading your exports...</div>
      </v-card-text>

      <v-card-text v-else-if="error" class="py-8">
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-text v-else-if="!exports.length" class="py-8 text-center text-grey">
        You haven't created any exports yet.
      </v-card-text>

      <v-table v-else>
        <thead>
          <tr>
            <th>Description</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exp in exports" :key="exp.id">
            <td>
              <div class="d-flex align-center">
                <v-icon size="small" class="mr-2">mdi-file-document-outline</v-icon>
                <div>
                  <div>{{ formatDescription(exp) }}</div>
                  <div v-if="exp.format && exp.format !== 'csv'" class="text-caption text-grey">
                    {{ exp.format.toUpperCase() }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="cursor-pointer">
                    {{ formatRelativeTime(exp.created || exp.submitted) }}
                  </span>
                </template>
                {{ formatExactDate(exp.created || exp.submitted) }}
              </v-tooltip>
            </td>
            <td class="text-right">
              <div class="d-flex align-center justify-end ga-1">
                <!-- Failed exports - show error in red -->
                <v-tooltip v-if="exp.status === 'failed'" location="top">
                  <template v-slot:activator="{ props }">
                    <span v-bind="props" class="text-body-2 text-error mr-2">
                      {{ getErrorDisplayText(exp) }}
                    </span>
                  </template>
                  {{ exp.error_message || 'Export failed' }}
                </v-tooltip>

                <!-- Queued exports - show queue position -->
                <v-tooltip v-else-if="exp.status === 'submitted'" location="top">
                  <template v-slot:activator="{ props }">
                    <span v-bind="props" class="text-body-2 text-grey mr-2">
                      Queued ({{ exp.queue_position || '?' }} of {{ exp.queue_total || '?' }})
                    </span>
                  </template>
                  Waiting in queue - position {{ exp.queue_position }} of {{ exp.queue_total }}
                </v-tooltip>

                <!-- Running exports - show works count -->
                <v-tooltip v-if="exp.status === 'running'" location="top">
                  <template v-slot:activator="{ props }">
                    <span v-bind="props" class="text-body-2 text-grey">
                      {{ (exp.rows_exported || 0).toLocaleString() }}
                    </span>
                  </template>
                  {{ (exp.rows_exported || 0).toLocaleString() }} of {{ (exp.total_rows || 0).toLocaleString() }} works ({{ formatProgress(exp.progress, exp.total_rows) }}%)
                </v-tooltip>
                
                <!-- Donut progress for running exports (in place of download button) -->
                <v-tooltip v-if="exp.status === 'running'" location="top">
                  <template v-slot:activator="{ props }">
                    <span v-bind="props" class="d-inline-flex align-center justify-center" style="width: 28px; height: 28px;">
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 20 20" 
                        style="transform: rotate(-90deg);"
                      >
                        <circle cx="10" cy="10" r="6" fill="none" stroke="#e0e0e0" stroke-width="5" />
                        <circle cx="10" cy="10" r="6" fill="none" stroke="#000" stroke-width="5" 
                          :stroke-dasharray="`${(exp.progress || 0) * 37.7} 37.7`" stroke-linecap="round" />
                      </svg>
                    </span>
                  </template>
                  {{ formatProgress(exp.progress, exp.total_rows) }}% complete
                </v-tooltip>

                <!-- Download button for completed exports -->
                <v-btn
                  v-if="isExportComplete(exp) && exp.result_url"
                  icon
                  size="small"
                  variant="text"
                  color="primary"
                  :href="exp.result_url"
                  target="_blank"
                >
                  <v-icon>mdi-download</v-icon>
                  <v-tooltip activator="parent" location="top">Download</v-tooltip>
                </v-btn>

                <!-- More actions menu -->
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      v-bind="props"
                    >
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      :to="getSearchRoute(exp)"
                      prepend-icon="mdi-magnify"
                    >
                      <v-list-item-title>View search</v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      prepend-icon="mdi-content-copy"
                      @click="copyExportId(exp.id)"
                    >
                      <v-list-item-title>Copy export ID</v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      prepend-icon="mdi-delete-outline"
                      class="text-error"
                      @click="deleteExport(exp.id)"
                    >
                      <v-list-item-title>Delete</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { format as formatTimeago } from 'timeago.js';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'MeExports' });

useHead({ title: 'Exports' });

const store = useStore();

const exports = ref([]);
const isLoading = ref(false);
const error = ref(null);
const now = ref(Date.now());

const userId = computed(() => store.getters['user/userId']);

// Update relative times every minute
let timeUpdateInterval;
onMounted(() => {
  fetchExports();
  timeUpdateInterval = setInterval(() => {
    now.value = Date.now();
  }, 60000);
});

onBeforeUnmount(() => {
  clearInterval(timeUpdateInterval);
  clearInterval(pollInterval);
});

// Poll for updates on in-progress exports
let pollInterval;
onMounted(() => {
  pollInterval = setInterval(() => {
    const hasInProgress = exports.value.some(exp => !isExportComplete(exp));
    if (hasInProgress) {
      fetchExports();
    }
  }, 3000);
});

const fetchExports = async () => {
  if (!userId.value) {
    error.value = 'You must be logged in to view your exports.';
    return;
  }

  if (!isLoading.value) {
    isLoading.value = exports.value.length === 0;
  }
  error.value = null;

  try {
    const response = await axios.get(
      `${urlBase.userApi}/users/${userId.value}/exports`,
      axiosConfig({ userAuth: true })
    );
    exports.value = response.data.exports || response.data || [];
  } catch (err) {
    console.error('Error fetching exports:', err);
    error.value = 'Unable to load your exports. Please try again later.';
    exports.value = [];
  } finally {
    isLoading.value = false;
  }
};

const isExportComplete = (exp) => {
  return exp.status === 'finished' || exp.status === 'completed';
};

const formatProgress = (progress, totalRows) => {
  if (progress === null || progress === undefined) return '0';
  const percent = progress * 100;
  // Show more decimal places for larger exports for better feedback
  if (totalRows && totalRows > 100000) {
    return percent.toFixed(2);  // e.g., 2.22%
  }
  if (totalRows && totalRows > 10000) {
    return percent.toFixed(1);  // e.g., 2.2%
  }
  return Math.round(percent).toString();
};

const getErrorDisplayText = (exp) => {
  // Map error codes to short, user-friendly display text
  const errorDisplayMap = {
    'quota_exhausted': 'Quota exceeded',
    'api_key_missing': 'API key required',
    'api_key_invalid': 'Invalid API key',
    'openalex_rate_limited': 'Rate limited',
    'openalex_error': 'API error',
    'export_timeout': 'Timed out',
    'export_internal_error': 'Error',
  };
  return errorDisplayMap[exp.error_code] || 'Failed';
};

const formatDescription = (exp) => {
  // Get row count - prefer total_rows, fall back to rows_exported
  const rowCount = exp.total_rows || exp.rows_exported;
  
  // Get entity type from args or query_url, default to 'works'
  let entityType = 'works';
  if (exp.args?.entity) {
    entityType = exp.args.entity;
  } else if (exp.query_url) {
    // Extract entity type from URL path (e.g., /works, /sources, /authors)
    const match = exp.query_url.match(/api\.openalex\.org\/(\w+)/);
    if (match) {
      entityType = match[1];
    }
  }
  
  // Format with comma separators for large numbers
  if (rowCount) {
    return `${rowCount.toLocaleString()} ${entityType}`;
  }
  
  // Fallback if no row count yet
  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
};

const parseDate = (dateString) => {
  if (!dateString) return null;
  // If the date string doesn't have timezone info, assume UTC
  if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    return new Date(dateString + 'Z');
  }
  return new Date(dateString);
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  // Access now.value to create reactivity dependency
  // eslint-disable-next-line no-unused-vars
  const _ = now.value;
  return formatTimeago(parseDate(dateString));
};

const formatExactDate = (dateString) => {
  if (!dateString) return '';
  const date = parseDate(dateString);
  return date.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
};

const getSearchRoute = (exp) => {
  // Extract filter from query_url (e.g., "https://api.openalex.org/works?filter=...")
  if (exp.query_url) {
    try {
      const url = new URL(exp.query_url);
      const filter = url.searchParams.get('filter');
      if (filter) {
        return {
          name: 'Serp',
          params: { entityType: 'works' },
          query: { filter },
        };
      }
    } catch (e) {
      console.error('Failed to parse query_url:', e);
    }
  }
  return {
    name: 'Serp',
    params: { entityType: 'works' },
  };
};

const deleteExport = async (exportId) => {
  try {
    await axios.delete(
      `${urlBase.userApi}/users/${userId.value}/exports/${exportId}`,
      axiosConfig({ userAuth: true })
    );
    exports.value = exports.value.filter(exp => exp.id !== exportId);
    store.commit('snackbar', 'Export deleted');
  } catch (err) {
    console.error('Error deleting export:', err);
    store.commit('snackbar', 'Failed to delete export');
  }
};

const copyExportId = async (exportId) => {
  try {
    await navigator.clipboard.writeText(exportId);
    store.commit('snackbar', 'Export ID copied to clipboard');
  } catch (err) {
    console.error('Failed to copy export ID:', err);
    store.commit('snackbar', 'Failed to copy export ID');
  }
};

const deleteAllExports = async () => {
  try {
    await axios.delete(
      `${urlBase.userApi}/users/${userId.value}/exports`,
      axiosConfig({ userAuth: true })
    );
    exports.value = [];
    store.commit('snackbar', 'All exports deleted');
  } catch (err) {
    console.error('Error deleting exports:', err);
    store.commit('snackbar', 'Failed to delete exports');
  }
};
</script>
