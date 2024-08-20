<template>
  <span>
<!--    <v-chip-->
<!--        @click="toggleSummarize"-->
<!--        :color="query.summarize ? 'primary' : null"-->
<!--        filter-->
<!--        :input-value="query.summarize"-->
<!--    >-->
<!--      Summarize-->
<!--    </v-chip>-->
    <v-simple-checkbox
        @click="toggleSummarize"
        label="Summarize"
        class="ml-2"
        :value="query.summarize"
    />
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
    ]),
    ...mapActions("search", [
        "toggleSummarize",

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