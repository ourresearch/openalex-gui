<template>
  <v-card
      color=""
      rounded
      flat
      class="fill-height d-flex flex-column"
  >
    <div class="font-weight-medium monospace body-2 pa-3">
      <!--      <span>{{ config.id }}.</span>-->
      {{ config.oql }}
    </div>

    <div class="pa-3 d-flex">
      <test-query-oql
          v-for="test in oqlTests"
          :key="test.id"

          :input="test.input"
          :expected-response="test.expectedResponse"

          :query-id="config.id"
          :test-id="test.id"

          icon
      />

      <v-divider vertical class="mx-1"/>

      <test-query-nat-lang
          v-for="(natLangString, i) in config.natLang"
          :key="i"

          :input="natLangString"
          :expected-response="config.query"

          :query-id="config.id"
          :test-id="i"

          icon
      />

      <v-divider vertical class="mx-1"/>

      <v-tooltip
          bottom
          :color="searchTestColor"
          max-width="300"
      >
        <template v-slot:activator="{ on }">
          <v-btn
              small
              icon
              v-on="on"
              :color="searchTestColor"
              :disabled="!isSearchTestComplete"
              :href="'https://staging.openalex.org/s/' + searchId"
              target="_blank"
          >
            <v-icon v-if="isSearchPassing === null">mdi-timer-sand</v-icon>
            <v-icon v-else>mdi-magnify</v-icon>
          </v-btn>
        </template>
        <span>
          <span v-if="searchError">
            <span class="font-weight-bold">Search Error:</span>
            {{ searchError }}
          </span>
          <span v-else class="font-weight-bold">Search passed</span>
          (click to view)
        </span>
      </v-tooltip>

    </div>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {oqlToQuery, queryToOQL} from "@/oqlParse/oqlParse";
import axios from "axios";
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
    runFlag: Boolean,
  },
  data() {
    return {
      foo: 42,

      searchId: null,
      isSearchPassing: null,
      searchError: null,
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
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", []),
    ...mapActions("user", []),
    async createSearch() {
      const url = "https://api.openalex.org/searches"
      try {
        const resp = await axios.post(url, {query: this.config.query})
        this.searchId = resp.data.id
      } catch (e) {
        this.isSearchPassing = false
        this.searchError = "Could not create search: " + e

        this.searchId = null
      }
    },
    async getSearch() {
      const url = "https://api.openalex.org/searches/" + this.searchId + "?mailto=team@ourresearch.org"
      const resp = await axios.get(url)
      if (resp.data.is_ready) {
        if (resp.data.results.length > 0) {
          this.isSearchPassing = true
        } else {
          this.isSearchPassing = false
        }
      }
    },
    async pollSearch() {
      if (!this.searchId) {
        this.isSearchPassing = false
        return
      }
      console.log("polling search", this.searchId)
      await this.getSearch();
      if (this.isSearchPassing === null) {
        setTimeout(() => {
          this.pollSearch();
        }, 500);
      }
    },
    async run() {
      await this.createSearch()
      this.pollSearch()
    }


  },
  created() {
  },
  mounted() {
    if (!this.config) throw new Error("config prop is required")
    this.run()
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>