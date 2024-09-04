<template>
  <v-card
      color=""
      rounded
      flat
      class="fill-height d-flex flex-column"
  >
    <div class="font-weight-medium monospace body-2 pa-3">
      {{ config.oql }}
    </div>
    <div class="px-3 fill-height">
    </div>

    <div class="pa-3 d-flex">
      <v-tooltip
          bottom
          v-for="result in oqlTestResults"
          :key="result.id"
          :color="result.isPassing ? 'success' : 'error'"
      >
        <template v-slot:activator="{ on }">
          <v-btn
              small
              icon
              v-on="on"
              :color="result.isPassing ? 'success' : 'error'"
          >
            <v-icon>mdi-code-parentheses-box</v-icon>
          </v-btn>
        </template>
        <span>
<!--          <span>OQL: </span>-->
          <span >{{ result.displayName }}</span>
        </span>
      </v-tooltip>
      <v-divider vertical class="mx-1" />

      <test-query-nat-lang
        v-for="q in config.natLang"
        :key="q"
        :q="q"
        :expected-response="config.query"
      />

      <v-divider vertical class="mx-1" />

<!--      <v-spacer/>-->
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
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
        </template>
        <span>
          <span class="font-weight-bold">Search</span> (click to view)
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


export default {
  name: "QueryTest",
  components: {
    TestQueryNatLang,
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
    oqlTestResults() {
      return [
        {
          id: "queryToOQL",
          displayName: "from query",
          isPassing: queryToOQL(this.config.query) === this.config.oql,
        },
        {
          id: "oqlToQuery",
          displayName: "to query",
          isPassing: oqlToQuery(this.config.oql) === this.config.query,
        }
      ]
    },
    searchTestColor() {
      if (!this.isSearchTestComplete) {
        return "grey"
      }
      else {
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
      const resp = await axios.post(url, {query: this.config.query})
      this.searchId = resp.data.id
    },
    async getSearch() {
      const url = "https://api.openalex.org/searches/" + this.searchId
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
      console.log("polling search", this.searchId)
      await this.getSearch();
      if (this.isSearchPassing === null) {
        setTimeout(() => {
          this.pollSearch();
        }, 500);
      }
    },
    async run(){
      await this.createSearch()
      this.pollSearch()
    }


  },
  created() {
  },
  mounted() {
    this.run()
  },
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>