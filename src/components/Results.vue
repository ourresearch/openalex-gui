<template>
  <v-container fluid class="pt-0">
    <v-row>
      <v-col>
        <OqlBox
            @setQueryString="setQueryString"
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
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import OqlBox from "@/components/OqlBox.vue";
import {ret1} from "@/data/mockResults1";
import ResultsTable from "@/components/Results/ResultsTable.vue";
import axios from "axios";

export default {
  name: "Template",
  components: {
    OqlBox,
    ResultsTable,
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
    ...mapActions([]),
    ...mapActions("user", []),
    async setQueryString(newQueryString) {
      const normalizeNewlines = (str) => str.replace(/\r\n|\r|\n/g, '\n');
      const removeRedundantSpaces = (str) => str.replace(/[^\S\n]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
      const q = removeRedundantSpaces(
          normalizeNewlines(newQueryString)
      )
      // const q = (newQueryString) ?
      //     newQueryString :
      //     undefined
      const newRoute = {name: "results", query: {q}}
      console.log("Results.setQueryString", q, newRoute)
      await this.$router.push(newRoute)
          .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
              throw e
            }
          })
    },
    async getResults(concat) {
      // if (!this.$route.query.q) return
      this.$store.state.isLoading = true
      this.apiUrl = "https://api.openalex.org/entities?"
          + (this.$route.query.q ?
                  "q=" + this.$route.query.q.replace(/(\r\n|\n|\r)/g, " ") :
                  ""
          )
          + "&format=ui"
          + "&page=" + this.page

      try {
        const resp = await axios.get(this.apiUrl)
        this.setEverythingFromApiResp(resp, concat)
      } catch (e) {
        this.clearEverything()
        this.snackbar({msg: "Error fetching results", color: "error"})
        console.error(e)
        return
      } finally {
        this.$store.state.isLoading = false
      }

      this.$store.state.isLoading = false
    },
    setEverythingFromApiResp(resp, concat = false) {
      const body = concat ? this.resultsBody.concat(resp.data.results.body) : resp.data.results.body
      this.resultsMeta = resp.data.meta
      this.resultsBody = body
      this.resultsHeader = resp.data.results.header

      // const hackCanonicalQueryString = (str) => {
      //   return this.isLocalEnv ? str.replace("using works\n", "") : str
      // }
      // this.canonicalQueryString = hackCanonicalQueryString(resp.data.meta.oql)
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
      this.setQueryString(newQueryString)
    },
    setSort({id, direction}) {
      if (!["asc", "desc"].includes(direction)) {
        console.error("setSort: invalid direction", direction)
        throw new Error("setSort: invalid direction")
      }
      const replaceSortBy = (query, sortField, isAscending) => query.replace(/sort by.*/, `sort by ${sortField} ${direction}`);
      const newQueryString = replaceSortBy(this.canonicalQueryString, id, direction)
      console.log("setSort", id, direction, newQueryString)
      this.setQueryString(newQueryString)
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.query.q": {
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