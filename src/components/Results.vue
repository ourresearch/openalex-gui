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
            :results="results"
            :meta="meta"
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
      meta: {},
      results: {
        header: [],
        body: []
      },
      apiUrl: "",
    }
  },
  computed: {
    ...mapGetters([

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
      const q = (newQueryString) ?
          newQueryString :
          undefined
      const newRoute = {name: "results", query: {q}}
      console.log("Results.setQueryString", newQueryString, newRoute)
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

      const resp = await axios.get(this.apiUrl)
      const body = concat ? this.results.body.concat(resp.data.results.body) : resp.data.results.body
      this.meta = resp.data.meta,
          this.results = {
            header: resp.data.results.header,
            body
          }
      this.canonicalQueryString = resp.data.meta.oql
      this.$store.state.isLoading = false
    },
    setColumns(ids) {
      console.log("setColumns", ids)
    },
    setSort({id, isAsc}) {
      console.log("setSort", id, isAsc)
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