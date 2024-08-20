<template>
  <v-container fluid class="pt-0">

    <v-row class="mt-12">
      <v-col>
        <v-card flat rounded>
          <results-table
              v-if="$store.state.search.is_ready"
              :api-url="apiUrl"
              @setColumns="setColumns"
              @setSort="setSort"
          />

        </v-card>
      </v-col>
    </v-row>
    <v-dialog scrollable v-model="isPropSelectorDialogOpen">
      <prop-selector
          :subject-entity="'works'"
          @close="isPropSelectorDialogOpen = false"
      />
    </v-dialog>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import OqlBox from "@/components/OqlBox.vue";
import {ret1} from "@/data/mockResults1";
import ResultsTable from "@/components/Results/ResultsTable.vue";
import axios from "axios";
import * as oaxSearch from "@/oaxSearch";
import {sleep} from "@/util";
import PropSelector from "@/components/PropSelector.vue";

export default {
  name: "Template",
  components: {
    OqlBox,
    ResultsTable,
    PropSelector,
  },
  props: {},
  data() {
    return {
      foo: 42,
      page: 1,
      queryString: "",
      canonicalQueryString: "",
      submittedQueryString: "",
      resultsMeta: {},
      resultsHeader: [],
      resultsBody: [],
      isResultsReady: false,
      results: {
        header: [],
        body: []
      },
      apiUrl: "",
      isPropSelectorDialogOpen: false,
    }
  },
  computed: {
    ...mapGetters([
      "isLocalEnv",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([
      "createSearch",
    ]),
    ...mapActions("user", []),
    ...mapActions("search", [
        "createSearch",
        "getSearch",
    ]),
    async getResults() {
      try {
        await this.getSearch(this.$route.params.id)
        if (!this.$store.state.search.is_ready) {
          console.log("getResults: not ready, waiting")
          await sleep(500)
          return this.getResults()
        }
      } catch (e) {
        this.snackbar({msg: "Error fetching results", color: "error"})
        console.error(e)
      }

    },
    setEverythingFromApiResp(resp) {
      this.isResultsReady = true
      this.resultsMeta = resp.data.meta
      this.resultsBody = resp.data.results.body
      this.resultsHeader = resp.data.results.header
      this.canonicalQueryString = resp.data.meta.oql
    },
    clearEverything() {
      this.resultsMeta = {}
      this.resultsHeader = []
      this.resultsBody = []
      this.canonicalQueryString = ""
    },
    setColumns(ids) {
      console.log("setColumns", this.canonicalQueryString, ids)
      const replaceReturnFields = (query, fields) => query.replace(/return.*/, `return ${fields.join(', ')}`);
      const newQueryString = replaceReturnFields(this.canonicalQueryString, ids)
      this.createSearch(newQueryString)
    },
    setSort({id, direction}) {
      if (!["asc", "desc"].includes(direction)) {
        console.error("setSort: invalid direction", direction)
        throw new Error("setSort: invalid direction")
      }
      const replaceSortBy = (query, sortField, isAscending) => query.replace(/sort by.*/, `sort by ${sortField} ${direction}`);
      const newQueryString = replaceSortBy(this.canonicalQueryString, id, direction)
      console.log("setSort", id, direction, newQueryString)
      this.createSearch(newQueryString)
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.params.id": {
      handler: function (value) {
        this.getResults()
      },
      immediate: true
    },


  }
}
</script>

<style scoped lang="scss">

</style>