<template>
  <v-container>
    <div class="text-h5">Query tester</div>
    <v-card rounded flat class="pa-5 mb-8">
      <div>
        <query-summarize />
        <query-summarize-by v-if="query.summarize" />

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

export default {
  name: "Template",
  components: {
    QuerySummarize,
    QuerySummarizeBy,
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