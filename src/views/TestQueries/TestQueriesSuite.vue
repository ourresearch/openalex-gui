<template>
  <v-container v-if="queries.length">
    <div class="d-flex align-center pa-3">
      {{queries.length}} queries
      <v-spacer/>
      <v-btn color="primary" @click="runSearch += 1">Run Searches</v-btn>
    </div>
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
import {getTestSuite} from "@/components/TestQuery/tests";

export default {
  name: "TestQueriesSuite",
  components: {
    TestQuery,
  },
  props: {},
  data() {
    return {
      runSearch: 0,
      passCount: 0,
      failCount: 0,
      queries: [],
      isLoading: false,
    }
  },
  computed: {
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
  },
  created() {
  },
  async mounted() {
    const queries = await getTestSuite(this.$route.params.testSuiteId)
    this.queries = queries
  },
  watch: {}
}
</script>


<style scoped lang="scss">

</style>