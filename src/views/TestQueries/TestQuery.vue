<template>
  <div>
    <div>
      <v-checkbox
          label="run searche"
          v-model="runSearch"
      />
    </div>
    <test-query
        v-if="myQueryConfig"
        :config="myQueryConfig"
        :run-search="runSearch"
    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import TestQuery from "@/components/TestQuery/TestQuery.vue";
import {getTestQuery} from "@/components/TestQuery/testQuery";

export default {
  name: "Template",
  components: {
    TestQuery,
  },
  props: {},
  data() {
    return {
      foo: 42,
      runSearch: false,
      myQueryConfig: null,
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


  },
  created() {
  },
  mounted() {
    this.myQueryConfig = getTestQuery(this.$route.params.testSuiteId, this.$route.params.queryId)
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>