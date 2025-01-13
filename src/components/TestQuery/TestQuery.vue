<template>
  <v-card
      rounded
      flat
      class="fill-height d-flex flex-column"
      :loading="status === 'loading' ? 'grey lighten-2' : undefined"
  >

    <!--    <div class="font-weight-bold">-->
    <!--      <span class="success&#45;&#45;text">pass: {{ passCount }}</span>-->
    <!--      <span class="error&#45;&#45;text mx-3">fail: {{ failCount }}</span>-->
    <!--      <span class="mx-3">complete: {{ completeCount }}</span>-->
    <!--      <span class="grey&#45;&#45;text">loading: {{ loadingCount }}</span>-->
    <!--    </div>-->

    <div class=" monospace body-2 pa-3">
      <span v-if="status === 'pass'" class="success--text">{{ config.oql }}</span>
      <span v-else-if="status === 'fail'" class="error--text">{{ config.oql }}</span>
      <span v-else class="grey--text">{{ config.oql }}</span>
    </div>

    <div class=" monospace body-2 pa-3">
      <span v-if="returnData?.meta?.count" class="success--text">{{ returnData.meta.count }} results</span>
      <span v-else-if="searchError" class="error--text">{{ searchError }}</span>
    </div>

    <div class="fill-height"></div>

    <div class="px-3 pt-1  d-flex">
      <test-query-oql
          v-for="test in oqlTests"
          :key="test.id"

          :input="test.input"
          :expected-response="test.expectedResponse"

          :test-suite-id="$route.params.testSuiteId"
          :query-id="config.id"
          :test-id="test.id"

          icon
          @pass="passCount += 1"
          @fail="failCount += 1"
      />


      <!--      <test-query-nat-lang-->
      <!--          v-for="(natLangString, i) in config.natLang"-->
      <!--          :key="i"-->

      <!--          :input="natLangString"-->
      <!--          :expected-response="config.query"-->
      <!--          :query-id="config.id"-->
      <!--          :test-id="i"-->

      <!--          icon-->
      <!--          @pass="passCount += 1"-->
      <!--          @fail="failCount += 1"-->
      <!--      />-->

      <!--      <v-divider vertical class="mx-1"/>-->

      <v-tooltip
          bottom
          :color="searchTestColor"
          max-width="300"
          v-if="runSearch"
      >
        <template v-slot:activator="{ on }">
          <v-btn
              small
              icon
              v-on="on"
              :color="searchTestColor"
              :disabled="!isSearchTestComplete"
              :href="'/s/' + searchId"
              target="_blank"
          >
            <v-icon v-if="isSearchPassing === null">mdi-timer-sand</v-icon>
            <v-icon v-else>mdi-magnify</v-icon>
          </v-btn>
        </template>
        <span>
          <span v-if="isSearchPassing">
            <span class="font-weight-bold">Search passed</span>
            (click to view)
          </span>
          <span v-else-if="searchError">
              <span class="font-weight-bold">Search Error:</span>
              {{ searchError }}
          </span>
          <span v-else>
            <span class="font-weight-bold">Search failed:</span> no results.
          </span>
        </span>
      </v-tooltip>
      <v-spacer/>
      <v-btn icon :to="`/tests/${$route.params.testSuiteId}/${config.id}`">
        <v-icon>mdi-link</v-icon>
      </v-btn>

    </div>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";
import {api} from "@/api";
import {oqlToQuery, queryToOQL} from "@/oqlParse/oqlParse";
import TestQueryNatLang from "@/components/TestQuery/TestQueryNatLang.vue";
import TestQueryOql from "@/components/TestQuery/TestQueryOql.vue";


export default {
  name: "TestQuery",
  components: {
    TestQueryNatLang,
    TestQueryOql,
  },
  props: {
    config: Object,
    runSearch: Number,
  },
  data() {
    return {
      failCount: 0,
      passCount: 0,
      searchId: null,
      isSearchPassing: null,
      searchError: null,
      returnData: null,
    }
  },
  computed: {
    status() {
      return this.loadingCount ?
          'loading' :
          this.failCount ?
              "fail" :
              "pass"
    },
    testsCount() {
      const oqlCount = 2
      const searchCount = this.runSearch ? 1 : 0
      return oqlCount + searchCount
      // const natLangCount = this.config.natLang.length
      // return oqlCount + searchCount + natLangCount
    },
    completeCount() {
      return this.failCount + this.passCount
    },
    loadingCount() {
      return Math.max(this.testsCount - this.completeCount, 0)
    },
    oqlTests() {
      return [
        {
          id: "from-query",
          input: this.config.query,
          expectedResponse: this.config.oql,
        },
        {
          id: "to-query",
          input: this.config.oql,
          expectedResponse: this.config.query,
        }
      ]
    },
    searchTestColor() {
      if (!this.isSearchTestComplete) {
        return "grey"
      } else {
        return (this.isSearchPassing) ? "success" : "error"
      }
    },
    isSearchTestComplete() {
      return this.isSearchPassing !== null
    },
  },
  methods: {
    async createSearch() {
      const url = api.apiBaseUrl() + "/searches?mailto=team@ourresearch.org"
      try {
        const resp = await axios.post(url, {
          query: this.config.query,
          bypass_cache: true,
        })
        this.searchId = resp.data.id
      } catch (e) {
        this.isSearchPassing = false
        this.searchError = "Could not create search: " + e
        this.searchId = null
      }
    },
    async getSearch() {
      const url = api.apiBaseUrl() + "/searches/" + this.searchId + "?mailto=team@ourresearch.org"
      const resp = await axios.get(url)
      if (resp.data.is_completed) {
        this.returnData = resp.data

        if (resp.data.backend_error) {
          this.isSearchPassing = false
          this.searchError = resp.data.backend_error
        } else 
        if (resp.data.results.length > 0) {
          this.isSearchPassing = true
        } else {
          this.isSearchPassing = false
          this.searchError = "No results."
        }
      }
    },
    async pollSearch() {
      if (!this.searchId) {
        this.isSearchPassing = false
        this.failCount += 1
        return
      }
      //console.log("polling search", this.searchId)
      await this.getSearch();
      if (this.isSearchPassing === null) {
        setTimeout(() => {
          this.pollSearch();
        }, 500);
      }
    },
    run() {
      this.passCount = 0
      this.failCount = 0
      if (this.runSearch) {
        this.runSearchMethod()
      }
    },
    async runSearchMethod() {
      await this.createSearch()
      this.pollSearch()
    }
  },
  created() {
    if (!this.config) throw new Error("config prop is required")
    this.run()
  },
  mounted() {
  },
  watch: {
    runSearch: {
      handler(newVal) {
        if (newVal) {
          this.runSearchMethod()
        }
      },
      immediate: true
    },
    isSearchPassing(newVal) {
      if (newVal) {
        this.passCount += 1
      } else {
        this.failCount += 1
      }
    },
    loadingCount(newVal) {
      if (newVal === 0) { // no loading, we're done
        this.$emit(this.failCount === 0 ? "pass" : "fail")
      }
    },
  }
}
</script>

<style scoped lang="scss">

</style>