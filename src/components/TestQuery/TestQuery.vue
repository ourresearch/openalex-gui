<template>
  <div class="">
   <v-card
      rounded
      flat
      border
      class="fill-height d-flex flex-column"
      style="max-width: 500px"
      :loading="status === 'loading' ? 'grey lighten-2' : undefined"
    >

    <div v-if="config.title" class="pa-3" style="margin-bottom: -20px">
      {{config.title}}
    </div>

    <div class=" monospace text-body-2 pa-3">
      <span v-if="status === 'pass'" class="text-success">
        {{ config.oql }}
      </span>
      <span v-else-if="status === 'fail'" class="text-error">
        {{ config.oql }}
      </span>
      <span v-else class="text-grey">{{ config.oql }}</span>
    </div>

    <div class=" monospace text-body-2 pa-3">
      <span v-if="isSearchPassing === true" class="text-success">{{ returnData.meta.count }} results</span>
      <span v-else-if="returnData?.meta.count === 0" class="text-error">{{ returnData.meta.count }} results</span>
      <span v-else-if="searchError" class="text-error">{{ searchError }}</span>
    </div>

    <div class=" monospace text-body-2 pa-3" v-if="returnData?.timestamps?.duration">
      <span class="text-success">{{ filters.toPrecision(returnData.timestamps.duration, 3) }} seconds</span>
    </div>

    <div v-if="config.error" class="monospace text-body-2 pa-3">
      <span class="text-error"><b>Note:</b> {{ config.error }}</span>
    </div>

    <div class="fill-height"></div>

    <div class="px-3 pt-1  d-flex">
      <template v-if="config.oql">
        <test-query-oql
            v-for="test in oqlTests"
            :key="test.id"
            :input="test.input"
            :expected-response="test.expectedResponse"
            :test-suite-id="$route.params.testSuiteId"
            :query-id="config.id"
            :test-id="test.id"
            icon
            :runTest="runSearch+1"
            @pass="passCount += 1"
            @fail="failCount += 1"
        />
      </template>

      <v-tooltip
          location="bottom"
          :color="searchTestColor"
          max-width="300"
          v-if="runSearch"
      >
        <template v-slot:activator="{ props }">
          <v-btn
              size="small"
              icon
              v-bind="props"
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
</div>
</template>

<script>

import {api} from "@/api";
import filters from '@/filters';
import TestQueryOql from "@/components/TestQuery/TestQueryOql.vue";

export default {
  name: "TestQuery",
  components: {
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
      duration: null,
      filters,
    }
  },
  computed: {
    status() {
      return this.loadingCount ?
          'loading' :
          this.failCount ?
              "fail" :
              "pass";
    },
    testsCount() {
      const oqlCount = this.config.oql ? 2 : 0;
      const searchCount = this.runSearch ? 1 : 0;
      return oqlCount + searchCount;
    },
    completeCount() {
      return this.failCount + this.passCount;
    },
    loadingCount() {
      return Math.max(this.testsCount - this.completeCount, 0);
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
      ];
    },
    searchTestColor() {
      if (!this.isSearchTestComplete) {
        return "grey";
      } else {
        return (this.isSearchPassing) ? "success" : "error";
      }
    },
    isSearchTestComplete() {
      return this.isSearchPassing !== null;
    },
  },
  methods: {
    async createSearch() {
      try {
        const resp = await api.createSearch(this.config.query, {bypass_cache: true, is_test: true});
        this.searchId = resp.data.id;
      } catch (e) {
        this.isSearchPassing = false;
        this.searchError = "Could not create search: " + e;
        this.searchId = null;
      }
    },
    async getSearch() {
      console.log("getSearch: " + this.searchId);
      const resp = await api.getSearch(this.searchId, {is_test: true});
      if (resp.is_completed) {
        this.returnData = resp;

        if (resp.backend_error) {
          this.isSearchPassing = false;
          this.searchError = resp.backend_error;
          
        } else if (this.config.expectsZeroResults && resp.results.length === 0) {
          this.isSearchPassing = true;

        } else if (resp.results.length == 0) {
          this.isSearchPassing = false;

        } else {
          this.isSearchPassing = true;
        }
      }
    },
    async pollSearch() {
      if (!this.searchId) {
        this.isSearchPassing = false;
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
      this.passCount = 0;
      this.failCount = 0;
      this.searchId = null;
      this.isSearchPassing = null;
      this.searchError = null;
      this.returnData = null;
      if (this.runSearch) {
        this.runSearchMethod();
      }
    },
    async runSearchMethod() {
      await this.createSearch();
      this.pollSearch();
    }
  },
  created() {
    if (!this.config) throw new Error("config prop is required")
    this.run();
  },
  mounted() {
  },
  watch: {
    runSearch: {
      handler(newVal) {
        if (newVal) {
          this.run()
        }
      },
      immediate: true
    },
    isSearchPassing(newVal) {
      if (newVal) {
        this.passCount += 1;
      } else {
        this.failCount += 1;
      }
    },
    loadingCount(newVal) {
      if (newVal === 0) { // no loading, we're done
        this.$emit(this.failCount === 0 ? "pass" : "fail");
      }
    },
  }
}
</script>

<style scoped lang="scss">

</style>