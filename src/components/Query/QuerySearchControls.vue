<template>
  <div class="search-controls mb-1 flex gap-1">
    <Button 
      v-if="hasQueryChanged || isSearchCanceled"
      @click="createSearch">
      Run Search
    </Button>
    <Button
      v-if="hasQueryChanged"
      variant="secondary"
      @click="cancelSearch">
      Cancel
    </Button>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { Button } from '@/components/ui/button';

defineOptions({ name: 'QuerySearchControls' });

const store = useStore();

const hasQueryChanged = computed(() => store.getters['search/hasQueryChanged']);
const isSearchCanceled = computed(() => store.getters['search/isSearchCanceled']);

const createSearch = () => store.dispatch('search/createSearch');
const resetToSubmittedQuery = () => store.dispatch('search/resetToSubmittedQuery');

function cancelSearch() {
  resetToSubmittedQuery();
}
</script>

<style lang="scss"> 

</style>