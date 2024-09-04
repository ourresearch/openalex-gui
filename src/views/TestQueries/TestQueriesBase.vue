<template>
  <v-container class="mt-6">
    <div class="text-h3 d-flex mb-3">
      Test Queries
      <v-spacer />
    </div>
    <router-view></router-view>



  </v-container>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";
import TestQuery from "@/components/TestQuery/TestQuery.vue";


export default {
  name: "Template",
  components: {
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