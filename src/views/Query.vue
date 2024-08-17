<template>
  <v-container>
    <div class="text-h4 mb-4">Query creator</div>
    <v-row>
      <v-col cols="6">
        <v-card rounded flat class="mb-8">
          <v-toolbar dense flat>
            <v-toolbar-title>Get works</v-toolbar-title>
          </v-toolbar>
          <div class="d-flex align-center px-4">
            <query-where-branch :id="0"/>
          </div>
        </v-card>
        <v-card rounded flat class="mb-8">
          <v-toolbar dense flat>
            <v-toolbar-title>Summarize</v-toolbar-title>
          </v-toolbar>
          <div class="d-flex align-center pb-4 px-4">
            <query-summarize class="my-2"/>
            <query-summarize-by v-if="query.summarize" class="ml-3"/>
          </div>
        </v-card>
        <v-card rounded flat class="mb-8">
          <v-toolbar dense flat>
            <v-toolbar-title>Sort {{ returnedEntityType }}</v-toolbar-title>
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
                v-for="colId in query.return"
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
import QuerySummarize from "@/components/Query/QuerySummarize.vue";
import QuerySummarizeBy from "@/components/Query/QuerySummarizeBy.vue";
import QuerySortBy from "@/components/Query/QuerySortBy.vue";
import QueryReturn from "@/components/Query/QueryReturn.vue";
import QueryWhereBranch from "@/components/Query/QueryWhereBranch.vue";

export default {
  name: "Template",
  components: {
    QueryWhereBranch,
    QuerySummarize,
    QuerySummarizeBy,
    QuerySortBy,
    QueryReturn,

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
      "returnedEntityType"
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions("search", [
      "deleteReturnColumn",
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