<template>
  <span class="query-outline-view">
    <!-- Button that opens the dialog -->
    <v-btn small class="query-outline-button" color="catPurple" @click="openDialog">
      <v-icon small>mdi-format-list-bulleted</v-icon>
    </v-btn>

    <!-- Dialog component -->
    <v-dialog
      v-model="dialogOpen"
      max-width="500px"
    >
      <v-card class="query-builder">
        <div class="pa-8 pb-0">
          <query-filter-tree
            v-if="querySubjectEntity !== 'works'"
            :subject-entity="querySubjectEntity"
            :filters="query.filter_aggs" />

          <query-filter-tree
            subject-entity="works"
            :isWithAggs="querySubjectEntity !== 'works'"
            :filters="query.filter_works" />
        </div>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey darken-1"
            text
            @click="cancelClick"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="searchClick"
          >
            Search
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
import {mapGetters, mapActions} from "vuex";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";

export default {
  name: "QueryOutlineView",
  components: {
    QueryFilterTree
  },
  data() {
    return {
      dialogOpen: false
    };
  },
  computed: {
    ...mapGetters("search",[
      "query",
      "querySubjectEntity"
    ]),
  },
  methods: {
    ...mapActions('search', [
      'createSearch',
      'resetToSubmittedQuery'
    ]),
    openDialog() {
      this.dialogOpen = true;
    },
    cancelClick() {
      this.resetToSubmittedQuery();
      this.dialogOpen = false;
    },
    searchClick() {
      this.createSearch();
      this.dialogOpen = false;
    }
  }
};
</script>

<style lang="scss">
.query-outline-button.v-btn {
  min-width: 20px !important;
}
</style>
