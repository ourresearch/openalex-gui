<template>
  <v-tooltip
          bottom
          :color="testColor"
          max-width="300"
      >
        <template v-slot:activator="{ on }">
          <v-btn
              small
              icon
              v-on="on"
              :color="testColor"
              target="_blank"
          >
            <v-icon>mdi-message-text</v-icon>
          </v-btn>
        </template>
        <span>
          <span>{{ q }}</span>
        </span>
      </v-tooltip>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";
import {sleep} from "@/util";

export default {
  name: "Template",
  components: {
  },
  props: {
    q: String,
    expectedResponse: Object,
  },
  data() {
    return {
      foo: 42,
      isTestPassing: null,
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
    testColor(){
      return "grey"
    },
    isTestComplete(){
      return this.isTestPassing !== null
    },
    testColor(){
      if (this.isTestPassing === null) {
        return "grey"
      }
      return this.isTestPassing ? "green" : "red"
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", [
    ]),
    ...mapActions("search", [
    ]),
    ...mapActions("user", []),
    async run(){
      console.log("run natlang test", this.q);
      const url = `https://api.openalex.org/text/oql?natural_language=${this.q}&mailto=team@ourresearch.org`;

      const randomTimeToSleep = Math.random() * 10000 //
      await sleep(randomTimeToSleep)
      
      try {
        const resp = await axios.get(url);
        console.log("got response back from natlang test", resp);
        this.isTestPassing = resp.data === this.expectedResponse
      }
      catch (e) {
        // console.error("got error back from natlang test", e)
        this.isTestPassing = false
      }
    },


  },
  created() {
  },
  mounted() {
    this.run()
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>