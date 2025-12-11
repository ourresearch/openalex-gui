<template>
  <div>
    <div class="text-h5 mb-4">API</div>
    <div class="text-body-1 mb-4">
      Your API key gives you higher rate limits when using the
      <a href="https://docs.openalex.org" target="_blank" rel="noopener">OpenAlex API.</a>
    </div>
    
    <v-card flat variant="outlined" class="bg-white">
      <v-card-text>
        <div class="text-subtitle-2 text-grey mb-2">Your API Key</div>
        <ApiKeyDisplay :api-key="apiKey" />
        <div v-if="!apiKey" class="text-body-2 text-grey-darken-1 mt-2">
          No API key available. Please contact support if you need one.
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import ApiKeyDisplay from '@/components/ApiKeyDisplay.vue';

defineOptions({ name: 'MeApi' });

useHead({ title: 'API' });

const store = useStore();
const apiKey = computed(() => store.state.user.apiKey);
</script>

<style scoped>
</style>
