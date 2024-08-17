<template>
  <span>
    <v-chip
        label
        @click="toggleSummarize"
        :color="query.summarize ? 'primary' : null"
    >
      <v-icon left>mdi-arrow-collapse-vertical</v-icon>
      Summarize
    </v-chip>
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
    ]),
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
    ...mapMutations("search", [
        "toggleSummarize",
    ]),
    ...mapActions("search", []),
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