<template>
  <v-container v-if="queries.length">
    <div class="d-flex align-center pa-3">
      <div>
        <div>
          {{queries.length}} queries
        </div>
        <div v-if="passCount > 0" class="success--text">
          {{ passCount }} passing
        </div>
        <div v-if="failCount > 0" class="error--text">
          {{ failCount }} failing
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