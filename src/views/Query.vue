<template>
  <v-container>
    <div class="text-h5">Query tester</div>
    <v-card rounded flat class="pa-5 mb-8">
      <div class="d-flex align-center">
        <query-summarize class="my-2"/>
        <query-summarize-by v-if="query.summarize" class="ml-3"/>
      </div>
    </v-card>
    <v-card rounded flat class="pa-5 mb-8">
      <div>
        <query-sort-by v-if="!isQuerySingleRow"/>
      </div>
    </v-card>
    <v-card rounded flat class="pa-5 mb-8">
      <div>
        <query-return/>
      </div>
      <v-divider class="my-2" />
      <div>
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
    <v-card rounded flat class="pa-5 mb-8">
      <pre>{{ $store.state.search.query }}</pre>
    </v-card>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import QuerySummarize from "@/components/Query/QuerySummarize.vue";
import QuerySummarizeBy from "@/components/Query/QuerySummarizeBy.vue";
import QuerySortBy from "@/components/Query/QuerySortBy.vue";
import QueryReturn from "@/components/Query/QueryReturn.vue";

export default {
  name: "Template",
  components: {
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