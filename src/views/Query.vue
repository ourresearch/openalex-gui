<template>
  <v-container>
    <div class="text-h5">Query tester</div>
    <v-card rounded flat class="pa-5 mb-8">
      <div class="d-flex align-center">
        <query-summarize class="my-2" />
        <query-summarize-by v-if="query.summarize" class="ml-3" />
      </div>
    </v-card>
    <v-card rounded flat class="pa-5 mb-8">
      <div>
        <query-sort-by v-if="query.sort_by.column_id" />
        <query-return  />
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
    ...mapGetters([
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
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