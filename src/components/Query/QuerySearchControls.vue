<template>
  <span class="search-controls">
    <v-btn 
      v-if="hasQueryChanged || isSearchCanceled"
      class="mx-1"
      small
      color="primary"
      @click="createSearch">
      Run Search
    </v-btn>
    <v-btn
      v-if="hasQueryChanged"
      small
      @click="cancelSearch">
      Cancel
    </v-btn>
  </span>
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