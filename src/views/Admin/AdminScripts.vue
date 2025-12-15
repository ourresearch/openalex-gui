<template>
  <div>
    <h1 class="text-xl font-bold mb-4">Scripts</h1>
    <div class="text-base mb-6 text-muted-foreground">
      Admin scripts for maintenance and data synchronization tasks.
    </div>
    
    <Card>
      <CardContent class="pt-6">
        <div class="flex items-center mb-2">
          <RefreshCw class="h-5 w-5 mr-2 text-muted-foreground" />
          <div class="text-base font-medium">Sync API Keys to D1</div>
        </div>
        <div class="text-sm text-muted-foreground mb-4">
          Copies all API keys from the PostgreSQL database to the Cloudflare D1 database with their rate limits.
        </div>
        
        <Button
          :disabled="isStarting || syncStatus?.is_running"
          @click="startSync"
        >
          <Play class="h-4 w-4 mr-1" />
          {{ buttonLabel }}
        </Button>
        
        <div v-if="syncStatus && syncStatus.status !== 'idle'" class="mt-6">
          <Separator class="mb-4" />
          
          <div class="flex items-center mb-2">
            <div class="text-sm text-muted-foreground">Status:</div>
            <Badge
              :variant="statusVariant"
              class="ml-2"
            >
              {{ statusLabel }}
            </Badge>
          </div>
          
          <div v-if="syncStatus.total_keys" class="mt-2 text-sm">
            {{ syncStatus.synced_keys?.toLocaleString() || syncStatus.total_keys?.toLocaleString() }} keys
          </div>
          
          <div v-if="syncStatus.last_error" class="mt-3">
            <Alert variant="destructive">
              <AlertCircle class="h-4 w-4" />
              <AlertDescription>{{ syncStatus.last_error }}</AlertDescription>
            </Alert>
          </div>
          
          <div class="mt-4 text-xs text-muted-foreground">
            <div v-if="syncStatus.started_at">
              Started: {{ formatDateTime(syncStatus.started_at) }}
              <span v-if="syncStatus.is_running"> ({{ elapsedTime }})</span>
            </div>
            <div v-if="syncStatus.completed_at">
              Completed: {{ formatDateTime(syncStatus.completed_at) }}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { RefreshCw, Play, AlertCircle } from 'lucide-vue-next';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

const statusVariant = computed(() => {
  switch (syncStatus.value?.status) {
    case 'running': return 'secondary';
    case 'completed': return 'default';
    case 'failed': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'secondary';
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
