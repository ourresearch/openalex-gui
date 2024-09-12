<template>
  <v-container v-if="queries.length">
    <v-row>
      <v-col>
        <v-checkbox
            label="run searches"
            v-model="runSearch"
        />
      </v-col>
    </v-row>
    <v-row dense>
      <v-col
          cols="12"
          sm="6"
          md="4"
          lg="3"
          v-for="(query, index) in queries"
          :key="index"
      >
        <test-query
            :config="query"
            :run-search="runSearch"
        />
      </v-col>
    </v-row>
  </v-container>

</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";
import TestQuery from "@/components/TestQuery/TestQuery.vue";
import TestQueryOql from "@/components/TestQuery/TestQueryOql.vue";
import TestQueryNatLang from "@/components/TestQuery/TestQueryNatLang.vue";
import {getTestSuite} from "@/components/TestQuery/testQuery";

export default {
  name: "Template",
  components: {
    TestQuery,
  },
  props: {},
  data() {
    return {
      runSearch: false,
      passCount: 0,
      failCount: 0,

      foo: 42,
      queries: [],
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
    ]),
    completeCount() {
      return this.failCount + this.passCount
    },
    testsCount() {
      return this.queries.length
    },
    loadingCount() {
      return this.testsCount - this.completeCount
    },

  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", []),
    ...mapActions("user", []),


  },
  created() {
  },
  async mounted() {
    this.queries = await getTestSuite(this.$route.params.testSuiteId)
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>