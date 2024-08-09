<template>
  <v-container fluid class="pt-0">
    <v-row>
      <v-col>
        <OqlBox
            :canonical-query-string="canonicalQueryString"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <results-table
            :results-body="resultsBody"
            :results-header="resultsHeader"
            :results-meta="resultsMeta"
            :api-url="apiUrl"
            @setColumns="setColumns"
            @setSort="setSort"
        />
        <!--        <div v-if="results.body.length >= 20" class="d-flex py-1">-->
        <!--          <v-btn @click="page += 1">-->
        <!--            More results-->
        <!--          </v-btn>-->
        <!--        </div>-->
      </v-col>
    </v-row>
    <v-dialog scrollable v-model="isPropSelectorDialogOpen">
      <prop-selector :entity-type="'works'" />
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
      results: {
        header: [],
        body: []
      },
      apiUrl: "",
      isPropSelectorDialogOpen: true,
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
    async getResults() {
      // if (!this.$route.query.q) return
      this.$store.state.isLoading = true
      this.apiUrl = `https://api.openalex.org/searches/${this.$route.params.id}`
      try {
        const resp = await axios.get(this.apiUrl)
        if (!resp.data.is_ready) {
          console.log("getResults: not ready, waiting")
          await sleep(1000)
          return this.getResults()
        }
        this.setEverythingFromApiResp(resp)
        this.$store.state.isLoading = false
      } catch (e) {
        this.clearEverything()
        this.snackbar({msg: "Error fetching results", color: "error"})
        console.error(e)
        this.$store.state.isLoading = false
      }

    },
    setEverythingFromApiResp(resp) {
      console.log("setEverythingFromApiResp", resp.data)
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
    // page(){
    //   this.getResults(true)
    // }


  }
}
</script>

<style scoped lang="scss">

</style>