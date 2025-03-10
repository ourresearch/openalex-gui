<template>
  <div v-if="hasQueryChanged || isSearchCanceled" class="pa-2">
    <v-btn 
      v-if="hasQueryChanged || isSearchCanceled"
      small 
      color="primary" 
      class="mr-2" 
      @click="createSearch">
      Search
    </v-btn>
    <v-btn
      v-if="hasQueryChanged"
      small  
      class="mr-2"
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
    ])
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