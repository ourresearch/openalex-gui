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
          :loading="isStarting || syncStatus?.is_running"
          :disabled="syncStatus?.is_running"
          @click="startSync"
        >
          <v-icon start>mdi-play</v-icon>
          {{ buttonLabel }}
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
          
          <div v-if="syncStatus.total_keys" class="mt-2 text-body-2">
            {{ syncStatus.synced_keys?.toLocaleString() || syncStatus.total_keys?.toLocaleString() }} keys
          </div>
          
          <div v-if="syncStatus.last_error" class="mt-3">
            <v-alert type="error" density="compact" variant="tonal">
              {{ syncStatus.last_error }}
            </v-alert>
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
let elapsedInterval = null;

const buttonLabel = computed(() => {
  if (syncStatus.value?.is_running) {
    const count = syncStatus.value.total_keys?.toLocaleString() || '';
    return count ? `Syncing ${count} keys...` : 'Syncing...';
  }
  return 'Run Sync';
});

const statusColor = computed(() => {
  switch (syncStatus.value?.status) {
    case 'running': return 'info';
    case 'completed': return 'success';
    case 'failed': return 'error';
    case 'cancelled': return 'warning';
    default: return 'grey';
  }
});

const statusLabel = computed(() => {
  switch (syncStatus.value?.status) {
    case 'idle': return 'Ready to sync';
    case 'running': return 'Syncing...';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
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
    // Don't stop polling on error - the sync might still be running
    // Only stop if we get a definitive "not running" response
  }
}

// Use a more robust polling approach with setTimeout instead of setInterval
let pollTimeout = null;

async function poll() {
  if (!isPolling.value) return;
  
  await fetchStatus();
  
  // Schedule next poll if still polling
  if (isPolling.value) {
    pollTimeout = setTimeout(poll, 1000);
  }
}

function startPolling() {
  if (isPolling.value) return;
  isPolling.value = true;
  poll(); // Start the polling loop
  elapsedInterval = setInterval(updateElapsedTime, 1000);
}

function stopPolling() {
  isPolling.value = false;
  if (pollTimeout) {
    clearTimeout(pollTimeout);
    pollTimeout = null;
  }
  if (elapsedInterval) {
    clearInterval(elapsedInterval);
    elapsedInterval = null;
  }
}

function showCompletionMessage() {
  if (syncStatus.value?.status === 'completed') {
    const count = syncStatus.value.synced_keys?.toLocaleString() || '';
    store.commit('snackbar', `Synced ${count} keys`);
  } else if (syncStatus.value?.status === 'failed') {
    store.commit('snackbar', {
      msg: syncStatus.value.last_error || 'Sync failed',
      color: 'error'
    });
  } else if (syncStatus.value?.status === 'cancelled') {
    store.commit('snackbar', {
      msg: 'Sync cancelled',
      color: 'warning'
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
