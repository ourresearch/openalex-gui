<template>
  <v-container class="mt-6">
    <div class="text-h3 d-flex mb-3">
      Test Queries
      <v-spacer />
    </div>
    <div v-if="$route.params.queryId">
      <v-btn text to="/test-queries" class="px-1" exact-path exact>
        {{ $route.params.queryId }}
      </v-btn>
      <v-icon>mdi-chevron-right</v-icon>
      <template v-if="$route.params.testId">

      </template>
    </div>
    <v-row dense v-if="!$route.params.testId">
      <v-col
          cols="12"
          sm="6"
          md="4"
          lg="3"
          v-for="(query, index) in $store.state.testQueries"
          :key="index"
      >
        <test-query :config="query"  />
      </v-col>
    </v-row>



  </v-container>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";
import TestQuery from "@/components/TestQuery/TestQuery.vue";


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
    ...mapActions([
      "getTestQueries",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", []),
    ...mapActions("user", []),



  },
  created() {
  },
  mounted() {
    this.getTestQueries()
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>