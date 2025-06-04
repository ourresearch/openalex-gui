<template>
  <div class="color-2 py-2">
    <v-container v-if="queries.length">
    <div class="d-flex align-center pa-3">
      <div>
        <div>
          {{queries.length}} queries
        </div>
        <div v-if="passCount > 0" class="text-success">
          {{ passCount }} passing
        </div>
        <div v-if="failCount > 0" class="text-error">
          {{ failCount }} failing
        </div>
        <div v-if="loadingCount > 0" class="">
          {{ loadingCount }} loading
        </div>
      </div>
      <v-spacer/>
      <v-btn color="primary" @click="runSearchSuite">Run Searches</v-btn>
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
            @pass="passCount += 1"
            @fail="failCount +=1"
        />
      </v-col>
    </v-row>
  </v-container>
</div>
</template>


<script>

import TestQuery from "@/components/TestQuery/TestQuery.vue";
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
    }
  },
  computed: {
    completeCount() {
      return this.failCount + this.passCount;
    },
    testsCount() {
      return this.queries.length;
    },
    loadingCount() {
      return this.runSearch ? this.testsCount - this.completeCount : 0;
    },
  },
  methods: {
    runSearchSuite() {
      this.passCount = 0
      this.failCount = 0
      this.runSearch += 1
    }
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