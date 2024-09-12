<template>
  <v-container>
      <v-row>
        <v-col cols="12" md="6" lg="4">
          <v-card class="clickable" rounded flat to="/tests/main">
            <v-card-title>
              Main
            </v-card-title>
          </v-card>
        </v-col>
        <v-col cols="12" md="6" lg="4">
          <v-card class="clickable" rounded flat to="/tests/all_columns">
            <v-card-title>
              All columns
            </v-card-title>
          </v-card>
        </v-col>
      </v-row>
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