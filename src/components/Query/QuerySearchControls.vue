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


<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'QuerySearchControls',
  computed: {
    ...mapGetters('search', [
      'hasQueryChanged',
      'isSearchCanceled',
      'queryIsCompleted'
    ]),
  },
  methods: {
    ...mapActions('search', [
      'createSearch',
      'resetToSubmittedQuery'
    ]),
    cancelSearch() {
      this.resetToSubmittedQuery();
    }
  }
}
</script>

<style lang="scss"> 

</style>