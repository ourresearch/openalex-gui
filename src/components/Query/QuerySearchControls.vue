<template>
  <v-sheet v-if="showDialog" class="search-controls">
    <v-btn 
      v-if="hasQueryChanged || isSearchCanceled"
      class="mr-2"
      color="catWorksDarker"
      @click="createSearch">
      Run Search
    </v-btn>
    <v-btn
      v-if="hasQueryChanged"
      @click="cancelSearch">
      Cancel
    </v-btn>
  </v-sheet>
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
    showDialog() {
      return this.hasQueryChanged || this.isSearchCanceled;
    }
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