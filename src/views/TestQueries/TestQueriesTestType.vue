<template>
  <v-container>
      <v-card flat rounded>
        <v-card-text>There's no page for Test Type right now.</v-card-text>
      </v-card>
    </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {
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