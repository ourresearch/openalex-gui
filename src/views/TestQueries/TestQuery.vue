<template>
  <v-row>
    <test-query v-if="myConfig" :config="myConfig" />
  </v-row>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import TestQuery from "@/components/TestQuery/TestQuery.vue";

export default {
  name: "TestQueryView",
  components: {
    TestQuery,
  },
  props: {
  },
  data() {
    return {
      foo: 42,
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
    myConfig(){
      return this.$store.state.testQueries[this.$route.params.id]
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


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>