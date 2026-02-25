<template>
  <div v-if="apiKey" class="api-key-actions">
    <v-btn
      icon
      variant="text"
      size="x-small"
      title="Copy API key"
      @click="copyToClipboard"
    >
      <v-icon size="16">mdi-content-copy</v-icon>
    </v-btn>
    <v-btn
      v-if="onRotate"
      icon
      variant="text"
      size="x-small"
      title="Rotate API key"
      @click="rotateDialogOpen = true"
    >
      <v-icon size="16">mdi-autorenew</v-icon>
    </v-btn>
  </div>
  <span v-else class="text-medium-emphasis">—</span>

  <!-- Rotate Confirmation Dialog -->
  <v-dialog v-model="rotateDialogOpen" max-width="400">
    <v-card rounded="lg">
      <v-card-text class="pa-6">
        <div class="text-h6 font-weight-bold mb-3">Rotate API key?</div>
        <div class="text-body-2 text-medium-emphasis">
          This will replace your current API key. Everything using your current
          key will stop working. This can't be undone.
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
  }
});

const store = useStore();
const rotateDialogOpen = ref(false);
const rotateLoading = ref(false);

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
    const newKey = await props.onRotate();
    rotateDialogOpen.value = false;
    try {
      await navigator.clipboard.writeText(newKey);
      store.commit('snackbar', 'API key rotated and copied to clipboard');
    } catch {
      store.commit('snackbar', 'API key rotated');
    }
  } catch (e) {
    console.error('Failed to rotate API key:', e);
    store.commit('snackbar', e?.response?.data?.message || 'Failed to rotate API key');
  } finally {
    rotateLoading.value = false;
  }
}
</script>

<style scoped>
.api-key-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
</style>
