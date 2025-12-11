<template>
  <div 
    v-if="apiKey" 
    class="api-key-wrapper"
    @click="copyToClipboard"
  >
    <code class="api-key-code">{{ apiKey }}</code>
    <v-icon size="x-small" class="ml-2 copy-icon">mdi-content-copy</v-icon>
  </div>
  <span v-else class="text-medium-emphasis">—</span>
</template>

<script setup>
import { useStore } from 'vuex';

defineOptions({ name: 'ApiKeyDisplay' });

const props = defineProps({
  apiKey: {
    type: String,
    default: null
  }
});

const store = useStore();

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
  cursor: pointer;
  
  &:hover {
    .copy-icon {
      opacity: 1;
    }
  }
}

.api-key-code {
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace !important;
  font-size: 16px;
  color: #000;
  background: none;
  padding: 0;
  user-select: all;
}

.copy-icon {
  opacity: 0.5;
  transition: opacity 0.15s;
}
</style>
