<template>
  <div v-if="apiKey" class="api-key-wrapper">
    <code class="api-key-code">{{ visible ? apiKey : maskedKey }}</code>
    <v-btn
      icon
      variant="text"
      size="x-small"
      :title="visible ? 'Hide API key' : 'Show API key'"
      @click="visible = !visible"
    >
      <v-icon size="16">{{ visible ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
    </v-btn>
    <v-btn
      icon
      variant="text"
      size="x-small"
      title="Copy API key"
      @click="copyToClipboard"
    >
      <v-icon size="16">mdi-content-copy</v-icon>
    </v-btn>
  </div>
  <span v-else class="text-medium-emphasis">—</span>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'ApiKeyDisplay' });

const props = defineProps({
  apiKey: {
    type: String,
    default: null
  }
});

const store = useStore();
const visible = ref(false);

const maskedKey = computed(() => {
  if (!props.apiKey) return '';
  return '\u2022'.repeat(props.apiKey.length);
});

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
</script>

<style lang="scss" scoped>
.api-key-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.api-key-code {
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace !important;
  font-size: 16px;
  color: #000;
  background: none;
  padding: 0;
  user-select: all;
}
</style>
