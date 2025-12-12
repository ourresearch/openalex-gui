<template>
  <div>
    <div class="text-h5 mb-4">Scripts</div>
    <div class="text-body-1 mb-6 text-medium-emphasis">
      Admin scripts for maintenance and data synchronization tasks.
    </div>
    
    <v-card flat variant="outlined" class="bg-white">
      <v-card-text>
        <div class="d-flex align-center mb-2">
          <v-icon class="mr-2" color="grey">mdi-sync</v-icon>
          <div class="text-subtitle-1 font-weight-medium">Sync API Keys to D1</div>
        </div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Copies all API keys from the PostgreSQL database to the Cloudflare D1 database with their rate limits.
        </div>
        
        <v-btn
          variant="flat"
          color="primary"
          :loading="isStarting"
          :disabled="syncStatus?.is_running"
          @click="startSync"
        >
          <v-icon start>mdi-play</v-icon>
          {{ syncStatus?.is_running ? 'Syncing...' : 'Run Sync' }}
        </v-btn>
        
        <div v-if="syncStatus && syncStatus.status !== 'idle'" class="mt-6">
          <v-divider class="mb-4" />
          
          <div class="d-flex align-center mb-2">
            <div class="text-subtitle-2 text-grey">Status:</div>
            <v-chip
              :color="statusColor"
              size="small"
              class="ml-2"
              variant="flat"
            >
              {{ statusLabel }}
            </v-chip>
          </div>
          
          <div v-if="syncStatus.is_running || syncStatus.total_keys" class="mt-4">
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span>Progress</span>
              <span>{{ syncStatus.synced_keys || 0 }} / {{ syncStatus.total_keys || 0 }} keys</span>
            </div>
            <v-progress-linear
              :model-value="progressPercent"
              :color="syncStatus.failed_keys > 0 ? 'warning' : 'primary'"
              height="8"
              rounded
            />
            <div class="text-caption text-medium-emphasis mt-1">
              {{ progressPercent.toFixed(1) }}% complete
            </div>
          </div>
          
          <div v-if="syncStatus.failed_keys > 0" class="mt-3">
            <div class="text-body-2 text-error">
              <v-icon size="small" color="error" class="mr-1">mdi-alert-circle</v-icon>
              {{ syncStatus.failed_keys }} keys failed to sync
            </div>
          </div>
          
          <div v-if="syncStatus.last_error" class="mt-3">
            <v-alert type="error" density="compact" variant="tonal">
              {{ syncStatus.last_error }}
            </v-alert>
          </div>
          
          <div v-if="syncStatus.errors?.length > 0" class="mt-3">
            <v-expansion-panels variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title class="text-body-2">
                  View error details ({{ syncStatus.errors.length }})
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div 
                    v-for="(error, index) in syncStatus.errors" 
                    :key="index"
                    class="text-caption text-error mb-1"
                  >
                    {{ error }}
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
          
          <div class="mt-4 text-caption text-medium-emphasis">
            <div v-if="syncStatus.started_at">
              Started: {{ formatDateTime(syncStatus.started_at) }}
              <span v-if="syncStatus.is_running"> ({{ elapsedTime }})</span>
            </div>
            <div v-if="syncStatus.completed_at">
              Completed: {{ formatDateTime(syncStatus.completed_at) }}
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminScripts' });

useHead({ title: 'Admin Scripts' });

const store = useStore();

const syncStatus = ref(null);
const isStarting = ref(false);
const isPolling = ref(false);
const elapsedTime = ref('');
let pollInterval = null;
let elapsedInterval = null;

const progressPercent = computed(() => {
  if (!syncStatus.value?.total_keys) return 0;
  return (syncStatus.value.synced_keys / syncStatus.value.total_keys) * 100;
});

const statusColor = computed(() => {
  switch (syncStatus.value?.status) {
    case 'running': return 'info';
    case 'completed': return 'success';
    case 'completed_with_errors': return 'warning';
    case 'failed': return 'error';
    default: return 'grey';
  }
});

const statusLabel = computed(() => {
  switch (syncStatus.value?.status) {
    case 'idle': return 'Idle';
    case 'running': return 'Running';
    case 'completed': return 'Completed';
    case 'completed_with_errors': return 'Completed with errors';
    case 'failed': return 'Failed';
    default: return syncStatus.value?.status || 'Unknown';
  }
});

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

function updateElapsedTime() {
  if (!syncStatus.value?.started_at || !syncStatus.value?.is_running) {
    elapsedTime.value = '';
    return;
  }
  
  const started = new Date(syncStatus.value.started_at);
  const now = new Date();
  const diffMs = now - started;
  const diffSecs = Math.floor(diffMs / 1000);
  const mins = Math.floor(diffSecs / 60);
  const secs = diffSecs % 60;
  
  if (mins > 0) {
    elapsedTime.value = `${mins}m ${secs}s elapsed`;
  } else {
    elapsedTime.value = `${secs}s elapsed`;
  }
}

async function fetchStatus() {
  try {
    const response = await axios.get(
      `${urlBase.userApi}/admin/api-key-sync`,
      axiosConfig({ userAuth: true })
    );
    syncStatus.value = response.data;
    
    if (!response.data.is_running && isPolling.value) {
      stopPolling();
      showCompletionMessage();
    }
  } catch (error) {
    console.error('Failed to fetch sync status:', error);
  }
}

function startPolling() {
  if (pollInterval) return;
  isPolling.value = true;
  pollInterval = setInterval(fetchStatus, 2000);
  elapsedInterval = setInterval(updateElapsedTime, 1000);
}

function stopPolling() {
  isPolling.value = false;
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  if (elapsedInterval) {
    clearInterval(elapsedInterval);
    elapsedInterval = null;
  }
}

function showCompletionMessage() {
  if (syncStatus.value?.status === 'completed') {
    store.commit('snackbar', `Sync completed: ${syncStatus.value.synced_keys} keys synced`);
  } else if (syncStatus.value?.status === 'completed_with_errors') {
    store.commit('snackbar', {
      msg: `Sync completed with ${syncStatus.value.failed_keys} errors`,
      color: 'warning'
    });
  } else if (syncStatus.value?.status === 'failed') {
    store.commit('snackbar', {
      msg: 'Sync failed',
      color: 'error'
    });
  }
}

async function startSync() {
  isStarting.value = true;
  
  try {
    await axios.post(
      `${urlBase.userApi}/admin/api-key-sync`,
      {},
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', 'Sync started');
    startPolling();
    await fetchStatus();
  } catch (error) {
    if (error.response?.status === 409) {
      store.commit('snackbar', 'Sync already in progress');
      startPolling();
      await fetchStatus();
    } else {
      console.error('Failed to start sync:', error);
      store.commit('snackbar', {
        msg: error.response?.data?.error || 'Failed to start sync',
        color: 'error'
      });
    }
  } finally {
    isStarting.value = false;
  }
}

onMounted(async () => {
  await fetchStatus();
  if (syncStatus.value?.is_running) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});

watch(() => syncStatus.value?.is_running, (isRunning) => {
  if (isRunning) {
    updateElapsedTime();
  }
});
</script>

<style scoped>
</style>
