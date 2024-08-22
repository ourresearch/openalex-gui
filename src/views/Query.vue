<template>
  <v-container>
    <v-toolbar flat color="transparent" class="">

      <v-toolbar-title>Query tester</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn rounded color="primary" @click="createSearch">
        <v-icon left>mdi-play</v-icon> Do it
      </v-btn>
    </v-toolbar>
    <v-row>
      <v-col cols="6">
        <v-card rounded flat class="mb-8">
          <v-toolbar dense flat>
            <v-toolbar-title>Filter works (tree)</v-toolbar-title>
          </v-toolbar>
          <div class="pb-5">
            <v-divider class=""/>
            <query-filter-tree />
          </div>
        </v-card>


        <v-card rounded flat class="mb-8">
          <v-toolbar dense flat>
            <v-toolbar-title>Summarize</v-toolbar-title>
          </v-toolbar>
          <div class="d-flex align-center pb-4 px-4">
            <query-summarize-by   class="ml-3"/>
          </div>
          <div v-if="query.summarize_by">
            <v-divider class="my-2"/>
            <v-subheader>
              <template>Filter {{ querySubjectEntity }}</template>
            </v-subheader>
            <div class="pb-5">
              <query-filter-branch
                  v-if="filterRoots.find(f => f.subjectEntity === query.summarize_by)?.id"
                  :subject-entity="query.summarize_by"
                  :id="filterRoots.find(f => f.subjectEntity === query.summarize_by)?.id"
              />
            </div>
          </div>
        </v-card>
        <v-card rounded flat class="mb-8">
          <v-toolbar dense flat>
            <v-toolbar-title>Sort {{ querySubjectEntity }}</v-toolbar-title>
          </v-toolbar>
          <div class="pb-4 px-4">
            <query-sort-by v-if="!isQuerySingleRow"/>
            <div v-else class="my-3 grey--text">
              There's only one row in the result, no need to sort.
            </div>
          </div>
        </v-card>
        <v-card rounded flat class="mb-8">
          <v-toolbar dense flat>
            <v-toolbar-title>Return columns</v-toolbar-title>
          </v-toolbar>
          <div class="px-4 pb-4">
            <query-return/>
            <v-divider class="my-2"/>
            <v-chip
                small
                outlined
                label
                v-for="colId in query.return_columns"
                :key="colId"
                close
                @click:close="deleteReturnColumn(colId)"
                close-icon="mdi-close"
                class="mb-1 mr-2"
            >
              {{ colId }}
            </v-chip>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6">
        <v-card rounded flat class="pa-5 mb-8">
          <pre>{{ $store.state.search.query }}</pre>
        </v-card>

      </v-col>
    </v-row>

  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import QuerySummarizeBy from "@/components/Query/QuerySummarizeBy.vue";
import QuerySortBy from "@/components/Query/QuerySortBy.vue";
import QueryReturn from "@/components/Query/QueryReturn.vue";
import QueryFilterBranch from "@/components/Query/QueryFilterBranch.vue";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";

export default {
  name: "Template",
  components: {
    QueryFilterBranch,
    QuerySummarizeBy,
    QuerySortBy,
    QueryReturn,
    QueryFilterTree,

  },
  props: {},
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
      "isQuerySingleRow",
      "filterRoots",
        "querySubjectEntity"
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions("search", [
      "deleteReturnColumn",
        "createSearch",
    ]),
    ...mapActions("user", []),


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>