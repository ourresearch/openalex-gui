<template>
  <div>
    <div class="text-h5 mb-4">API</div>
    
    <v-card flat variant="outlined" class="bg-white">
      <v-card-text class="text-center py-12">
        <v-icon size="48" color="grey-lighten-1" class="mb-4">mdi-code-braces</v-icon>
        <div class="text-h6 text-grey">Coming soon...</div>
        <div class="text-body-2 text-grey-darken-1 mt-2">
          API key management and usage statistics will be available here.
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { useHead } from '@unhead/vue';

defineOptions({ name: 'MeApi' });

useHead({ title: 'API' });
</script>
