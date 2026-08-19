<template>
  <div v-if="apiKey" class="api-key-block">
    <div class="api-key-actions">
      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-content-copy"
        @click="copyToClipboard"
      >
        Copy
      </v-btn>
      <v-btn
        v-if="onRotate"
        variant="text"
        size="small"
        prepend-icon="mdi-autorenew"
        @click="rotateDialogOpen = true"
      >
        Rotate
      </v-btn>
    </div>
    <div v-if="retiredKey" class="retired-key-row text-caption text-medium-emphasis">
      Old key works until {{ formatExpiry(retiredKey.expires_at) }}
      <v-btn
        v-if="onExpireNow"
        variant="text"
        size="x-small"
        color="error"
        class="ml-1"
        :loading="expireLoading"
        @click="expireNow"
      >
        Expire now
      </v-btn>
    </div>
  </div>
  <span v-else class="text-medium-emphasis">—</span>

  <!-- Rotate Confirmation Dialog -->
  <v-dialog v-model="rotateDialogOpen" max-width="440">
    <v-card rounded="lg">
      <v-card-text class="pa-6">
        <div class="text-h6 font-weight-bold mb-3">Rotate API key?</div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          This replaces your current API key with a new one. To avoid downtime,
          you can keep the old key working while you deploy the new one —
          it keeps its normal limits, then stops for good.
        </div>
        <div v-if="signOutWarning" class="text-body-2 text-medium-emphasis mb-4">
          OpenAlex signed in on your other browsers and devices will be logged
          out right away either way; the grace window applies to API requests
          only.
        </div>
        <v-select
          v-model="selectedGrace"
          :items="graceChoices"
          label="Old key stops working"
          variant="outlined"
          density="comfortable"
          hide-details
        />
        <div v-if="selectedGrace === 'now'" class="text-caption text-medium-emphasis mt-3">
          The old key stops working immediately. Anything still using it will
          fail until it gets the new key.
        </div>
      </v-card-text>
      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" @click="rotateDialogOpen = false" :disabled="rotateLoading">
          Cancel
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          @click="rotateKey"
          :loading="rotateLoading"
        >
          Rotate key
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'ApiKeyDisplay' });

const props = defineProps({
  apiKey: {
    type: String,
    default: null
  },
  onRotate: {
    type: Function,
    default: null
  },
  // {api_key, expires_at} from the last grace rotation, or null (oxjob #830)
  retiredKey: {
    type: Object,
    default: null
  },
  onExpireNow: {
    type: Function,
    default: null
  },
  // Personal keys are also the GUI session credential (#290), so rotating
  // them logs out other devices regardless of the grace window.
  signOutWarning: {
    type: Boolean,
    default: false
  }
});

const store = useStore();
const rotateDialogOpen = ref(false);
const rotateLoading = ref(false);
const expireLoading = ref(false);
const selectedGrace = ref('24h');

const graceChoices = [
  { title: 'In 24 hours (recommended)', value: '24h' },
  { title: 'In 7 days', value: '7d' },
  { title: 'Immediately', value: 'now' },
];

function formatExpiry(iso) {
  if (!iso) return '';
  try {
    // API timestamps are UTC without zone suffix
    return new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

async function copyToClipboard() {
  if (!props.apiKey) return;

  try {
    await navigator.clipboard.writeText(props.apiKey);
    store.commit('snackbar', 'API key copied to clipboard');
  } catch (err) {
    console.error('Failed to copy:', err);
    store.commit('snackbar', 'Failed to copy API key');
  }
}

async function rotateKey() {
  rotateLoading.value = true;
  try {
    const newKey = await props.onRotate(selectedGrace.value);
    rotateDialogOpen.value = false;
    const graceNote = selectedGrace.value === 'now'
      ? ''
      : ' — old key works until the window ends';
    try {
      await navigator.clipboard.writeText(newKey);
      store.commit('snackbar', `API key rotated and copied to clipboard${graceNote}`);
    } catch {
      store.commit('snackbar', `API key rotated${graceNote}`);
    }
  } catch (e) {
    console.error('Failed to rotate API key:', e);
    store.commit('snackbar', e?.response?.data?.message || 'Failed to rotate API key');
  } finally {
    rotateLoading.value = false;
  }
}

async function expireNow() {
  expireLoading.value = true;
  try {
    await props.onExpireNow();
    store.commit('snackbar', 'Old API key expired');
  } catch (e) {
    console.error('Failed to expire retired API key:', e);
    store.commit('snackbar', e?.response?.data?.message || 'Failed to expire old API key');
  } finally {
    expireLoading.value = false;
  }
}
</script>

<style scoped>
.api-key-block {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
}
.api-key-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.retired-key-row {
  display: inline-flex;
  align-items: center;
}
</style>
