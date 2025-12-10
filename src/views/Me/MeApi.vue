<template>
  <div>
    <div class="text-h5 mb-4">API</div>
    
    <v-card flat variant="outlined" class="bg-white">
      <v-card-text>
        <div class="text-body-1 mb-4">
          Use your API key gives you higher rate limits when using the OpenAlex API. Use it like this:
        </div>
        


        <a :href="exampleApiUrl" target="_blank" rel="noopener">
          <code>{{ exampleApiUrl }}</code>
        </a>

        
        <div class="text-body-1 my-4">
          You can do all kinds of cool things with our API...learn more
          
          in the <a href="https://docs.openalex.org" target="_blank" rel="noopener">
            API docs here!
          </a>
        </div>
        
        <v-divider class="mb-4" />
        
        <div class="text-subtitle-2 text-grey mb-2">Your API Key</div>
        
        <div v-if="apiKey" class="d-flex align-center ga-2">
          <code class="api-key" @click="selectAndCopyApiKey">{{ apiKey }}</code>
          <v-btn
            icon
            variant="text"
            size="small"
            @click="copyApiKey"
          >
            <v-icon>{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
            <v-tooltip activator="parent" location="top">
              {{ copied ? 'Copied!' : 'Copy to clipboard' }}
            </v-tooltip>
          </v-btn>
        </div>
        
        <div v-else class="text-body-2 text-grey-darken-1">
          No API key available. Please contact support if you need one.
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

defineOptions({ name: 'MeApi' });

useHead({ title: 'API' });

const store = useStore();
const copied = ref(false);

const apiKey = computed(() => store.state.user.apiKey);
const exampleApiUrl = computed(() => `https://api.openalex.org/works?api_key=${apiKey.value}`);

function selectAndCopyApiKey(event) {
  // Select the text
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(event.target);
  selection.removeAllRanges();
  selection.addRange(range);
  
  // Also copy it
  copyApiKey();
}

async function copyApiKey() {
  if (!apiKey.value) return;
  
  try {
    await navigator.clipboard.writeText(apiKey.value);
    copied.value = true;
    store.commit('snackbar', 'API key copied to clipboard');
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    store.commit('snackbar', 'Failed to copy API key');
  }
}
</script>

<style scoped>
.api-key {
  font-family: monospace;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px 8px;
  background-color: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  user-select: all;
}
</style>
