<template>
    <v-row dense>
      <v-col
          cols="12"
          sm="6"
          md="4"
          lg="3"
          v-for="(query, index) in queries"
          :key="index"
      >
        <test-query :config="query"  />
      </v-col>
    </v-row>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";
import YAML from 'yaml'
import TestQuery from "@/components/TestQuery/TestQuery.vue";

const urlBase = "https://openalex-elastic-api-herokuapp-com.global.ssl.fastly.net"

export default {
  name: "Template",
  components: {
    TestQuery,
  },
  props: {},
  data() {
    return {
      foo: 42,
      queries: [],
      isLoading: false,
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
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", []),
    ...mapActions("user", []),
    runTests() {
      console.log("runTests")
    },
    async getFromGithub() {
      console.log("getYaml")
      const url = "https://raw.githubusercontent.com/ourresearch/oqo-search-tests/main/new_tests.yaml"
      const resp = await axios.get(url)
      this.queries = YAML.parse(resp.data)
    }



  },
  created() {
  },
  mounted() {
    this.getFromGithub()
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>