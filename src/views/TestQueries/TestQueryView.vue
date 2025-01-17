<template>
  <v-container>
    <div>
      <v-btn color="primary" class="ma-4" @click="runSearch += 1">Run Searches</v-btn>
    </div>
    <test-query
        v-if="myQueryConfig"
        :config="myQueryConfig"
        :run-search="runSearch"
    />
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import TestQuery from "@/components/TestQuery/TestQuery.vue";

export default {
  name: "TestQueryView",
  components: {
    TestQuery,
  },
  props: {},
  data() {
    return {
      runSearch: 0,
      myQueryConfig: null,
    }
  },
  computed: {
  },
  methods: {
  },
  created() {
  },
  async mounted() {
    const ret = await getTestQuery(
        this.$route.params.testSuiteId,
        this.$route.params.queryId,
    )
    this.myQueryConfig =ret
  },
  watch: {}
}
</script>


<style scoped lang="scss">

</style>