<template>
  <div class="serp-api-editor">
    <Card class="font-mono min-h-[40px] flex items-center p-2 pr-3">
      <Code class="h-5 w-5 mr-3 mt-1 ml-1 text-muted-foreground" />
      <div class="flex-grow mt-1 text-sm">
        https://api.openalex.org/{{ entityType }}<span v-html="apiQuerySplittable"></span>
      </div>
      <Button variant="ghost" size="icon" @click="copyToClipboard" class="ml-4">
        <Copy class="h-4 w-4" />
      </Button>
    </Card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { Code, Copy } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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