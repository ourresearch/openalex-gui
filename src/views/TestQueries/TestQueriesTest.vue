<template>
  <v-container>
    <template v-if="myTest">
        <test-query-oql
            v-if="myTestType === 'oql'"

            :input="myTest.input"
            :expected-response="myTest.expectedResponse"

            :query-id="Number($route.params.queryId)"
            :test-id="$route.params.testId"
        />

        <test-query-nat-lang
            v-if="myTestType === 'natlang'"

            :input="myTest.input"
            :expected-response="myTest.expectedResponse"

            :query-id="Number($route.params.queryId)"
            :test-id="Number($route.params.testId)"
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
import TestQueryNatLang from "@/components/TestQuery/TestQueryNatLang.vue";
import {getTestQuery} from "@/components/TestQuery/testQuery";

export default {
  name: "Template",
  components: {
    TestQueryNatLang, TestQueryOql
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
    ]),
    myQuery() {
      return getTestQuery(this.$route.params.testSuiteId, this.$route.params.queryId)
    },
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
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>