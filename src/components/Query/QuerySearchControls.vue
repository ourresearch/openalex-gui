<template>
  <div class="search-controls mb-1">
    <v-btn 
      v-if="hasQueryChanged || isSearchCanceled"
      class="mx-1"
      size="default"
      color="primary"
      variant="flat"
      @click="createSearch">
      Run Search
    </v-btn>
    <v-btn
      v-if="hasQueryChanged"
      size="default"
      variant="flat"
      @click="cancelSearch">
      Cancel
    </v-btn>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

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