<template>
  <v-container>
    <template v-if="myTest">
        <test-query-oql
            v-if="myTestType === 'oql'"

            :input="myTest.input"
            :expected-response="myTest.expectedResponse"

            :test-suite-id="$route.params.testSuiteId"
            :query-id="Number($route.params.queryId)"
            :test-id="$route.params.testId"
        />
    </template>
    <template v-else>
      loading....
    </template>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import TestQueryOql from "@/components/TestQuery/TestQueryOql.vue";
import {getTestQuery} from "@/components/TestQuery/tests";

export default {
  name: "TestQueriesTest",
  components: {
   TestQueryOql
  },
  props: {},
  data() {
    return {
      foo: 42,
      myQuery: null,
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
    myTestType() {
      return this.$route.params.testType
    },

    myTest() {
      if (!this.myQuery && this.myTestType && this.$route.params.testId) {
        return null
      }
      if (this.myTestType === 'oql') {
        const oqlTestsDict = {
          "from-query": {
            input: this.myQuery.query,
            expectedResponse: this.myQuery.oql,
          },
          "to-query": {
            input: this.myQuery.oql,
            expectedResponse: this.myQuery.query,
          }
        }
        return oqlTestsDict[this.$route.params.testId]

      } else if (this.myTestType === 'natlang') {
        return {
          input: this.myQuery.natLang[this.$route.params.testId],
          expectedResponse: this.myQuery.query,
        }
      } else {
        throw new Error(`Unknown test type: ${this.myTestType}`)
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", []),
    ...mapActions("user", []),


  },
  created() {
  },
  async mounted() {
    this.myQuery = await getTestQuery(
        this.$route.params.testSuiteId,
        this.$route.params.queryId,
    )

  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>