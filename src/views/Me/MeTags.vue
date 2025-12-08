<template>
  <div>
    <div class="text-h5 mb-4">Tags</div>
    
    <v-card flat variant="outlined" class="bg-white">
      <v-card-text class="text-center py-12">
        <v-icon size="48" color="grey-lighten-1" class="mb-4">mdi-tag-outline</v-icon>
        <div class="text-h6 text-grey">Coming soon...</div>
        <div class="text-body-2 text-grey-darken-1 mt-2">
          Manage your custom tags for organizing works and entities.
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { useHead } from '@unhead/vue';

defineOptions({ name: 'MeTags' });

useHead({ title: 'Tags' });
</script>
