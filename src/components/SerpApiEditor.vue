<template>
  <div class="serp-api-editor">
    <v-card
        variant="outlined"
        style="font-family: Monaco, monospace; min-height: 40px;"
        class="rounded-o d-flex align-center pa-2 pr-3"
    >
      <v-icon class="mr-3 mt-1 ml-1" color="grey">mdi-api</v-icon>
      <div class="flex-grow-1 mt-1">
        https://api.openalex.org/{{ entityType }}<span v-html="apiQuerySplittable"></span>
      </div>
      <v-btn
        icon
        variant="text"
        @click="copyToClipboard"
        class="ml-4"
      >
        <v-icon>mdi-content-copy</v-icon>
      </v-btn>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { url } from '@/url';

defineOptions({
  name: 'SerpApiEditor',
});

const store = useStore();
const route = useRoute();

// Vuex getter
const entityType = computed(() => store.getters['entityType']);

// Reactive values
const apiUrl = computed(() => url.makeApiUrl(route));
const apiQuerySplittable = computed(() => {
  const search = new URL(apiUrl.value).search;
  const parts = search.split(/(?=[&,])/).map(part => part);
  return parts.join('<wbr>');
});

// Vuex mutation
const snackbar = (msg) => store.commit('snackbar', msg);

// Methods
async function copyToClipboard() {
  await navigator.clipboard.writeText(apiUrl.value);
  snackbar('URL copied to clipboard.');
}
</script>