<template>
  <div v-if="$store.state.testQueries.length">
    <v-container class="mt-6" >
      <div>
        <v-breadcrumbs
            class="ma-0 pa-0"
            :items="breadcrumbItems"
            large
        >
          <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-breadcrumbs>
      </div>
      <div class="text-h4 mb-5 mt-3">{{ pageTitle }}</div>
    </v-container>
    <v-container v-if="pageType === 'queries'">
      <v-row dense>
        <v-col
            cols="12"
            sm="6"
            md="4"
            lg="3"
            v-for="(query, index) in $store.state.testQueries"
            :key="index"
        >
          <test-query :config="query"/>
        </v-col>
      </v-row>
    </v-container>
    <v-container v-else-if="pageType === 'query'">
      <test-query
          :config="$store.state.testQueries.find(q => q.id == $route.params.queryId)"
      />
    </v-container>
    <v-container v-else-if="pageType === 'test-type'">
      <v-card flat rounded>
        <v-card-text>There's no page for Test Type right now.</v-card-text>
      </v-card>
    </v-container>
    <template dense v-else-if="pageType === 'test'">
      <test-query-oql
          v-if="$route.params.testType === 'oql'"


          :input="myTest.input"
          :expected-response="myTest.expectedResponse"

          :query-id="Number($route.params.queryId)"
          :test-id="$route.params.testId"
      />
      <test-query-nat-lang
          v-if="$route.params.testType === 'natlang'"

          :input="myTest.input"
          :expected-response="myTest.expectedResponse"

          :query-id="Number($route.params.queryId)"
          :test-id="Number($route.params.testId)"
      />
    </template>


  </div>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";
import TestQuery from "@/components/TestQuery/TestQuery.vue";
import TestQueryOql from "@/components/TestQuery/TestQueryOql.vue";
import TestQueryNatLang from "@/components/TestQuery/TestQueryNatLang.vue";

export default {
  name: "Template",
  components: {
    TestQuery,
    TestQueryNatLang,
    TestQueryOql,
  },
  props: {},
  data() {
    return {
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
    breadcrumbItems() {
      const items = [
        {text: 'Queries', to: '/test-queries', exact: true,}
      ];

      if (this.$route.params.queryId) {
        items.push({
          text: `Query #${this.$route.params.queryId}`,
          exact: true,
          to: `/test-queries/${this.$route.params.queryId}`
        });
      }

      if (this.$route.params.testType) {
        items.push({
          text: `${this.$route.params.testType}`,
          exact: true,
          to: `/test-queries/${this.$route.params.queryId}/${this.$route.params.testType}`
        });
      }

      if (this.$route.params.testId) {
        items.push({
          text: `${this.$route.params.testId}`,
          exact: true,
          to: `/test-queries/${this.$route.params.queryId}/${this.$route.params.testType}/${this.$route.params.testId}`
        });
      }
      return items
    },

    pageType() {
      if (this.$route.params.testId) {
        return "test";
      } else if (this.$route.params.testType) {
        return "test-type";
      } else if (this.$route.params.queryId) {
        return "query";
      } else {
        return "queries";
      }
    },

    pageTitle() {
      return {
        "queries": "Test Queries",
        "query": `Query #${this.$route.params.queryId}`,
        "test-type": `${this.$route.params.testType}`,
        "test": `${this.$route.params.testId}`,
      }[this.pageType]
    },


    myQuery() {
      if (!this.$route.params.queryId) {
        return null
      }
      return this.$store.state.testQueries.find(q => q.id == this.$route.params.queryId)
    },
    myTestType() {
      if (!this.$route.params.testType) {
        return null
      }
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
    ...mapActions([
      "getTestQueries",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", []),
    ...mapActions("user", []),


  },
  created() {
  },
  mounted() {
    this.getTestQueries()
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>