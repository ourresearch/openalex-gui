<template>
  <v-container fluid class="pt-0">
    <v-row>
      <v-col>
        <OqlBox/>
      </v-col>
    </v-row>
    <div v-if="!$store.state.isLoading">
      1-{{ results.body.length }} of {{ meta?.count > 10000 ? "about " : "" }}{{ meta?.count | toPrecision }} results
    </div>
    <v-row>
      <v-col>
        <results-table :results="results" />

        <div v-if="results.body.length >= 20" class="d-flex py-1">
          <v-btn @click="page += 1">
            More results
          </v-btn>
        </div>


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
      meta: {},
      results: {
        header: [],
        body: []
      },
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
    async getResults(concat){
      // if (!this.$route.query.q) return
      this.$store.state.isLoading = true
      const myUrl = "https://api.openalex.org/results?"
          + (this.$route.query.q ? "q=" + this.$route.query.q : "")
          + "&format=ui"
          + "&page=" + this.page

      const resp = await axios.get(myUrl)
      console.log("getResults", resp.data, this.$route.query.q)
      const body = concat ? this.results.body.concat(resp.data.results.body) : resp.data.results.body
      this.meta = resp.data.meta,
      this.results = {
        header: resp.data.results.header,
        body
      }

      this.$store.state.isLoading = false





      // setTimeout(() => {
      //   this.results = _.cloneDeep(ret1.results)
      //   this.$store.state.isLoading = false
      // }, 500)
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
    page(){
      this.getResults(true)
    }


  }
}
</script>

<style scoped lang="scss">

</style>