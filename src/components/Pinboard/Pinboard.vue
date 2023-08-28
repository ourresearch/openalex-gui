<template>
  <v-card flat>
    <v-toolbar>
      <v-toolbar-title>
        Pinboard
      </v-toolbar-title>
    </v-toolbar>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Pinboard",
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
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  mounted() {
  },
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>