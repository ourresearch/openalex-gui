<template>
  <v-card
      flat
      class="d-flex pa-1 px-2 align-center color-3 mr-1 hover-color-2 tab"
      :class="{'selected': isSelected}"
      @click.self="selectSerpTab(index)"
  >
    <v-icon left small v-if="id">mdi-content-save</v-icon>
    {{ name }}
    <v-btn icon small @click.stop="removeSerpTab(index)">
      <v-icon small>mdi-close</v-icon>
    </v-btn>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "SerpTab",
  components: {},
  props: {
    searchUrl: String,
    id: String,
    index: Number,
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
    ...mapGetters("user", [
      "userId",
      "userSavedSearches",
      "serpTabs",
      "serpTabIndex",
    ]),
    queryParams() {
      return Object.fromEntries(new URL(this.searchUrl).searchParams)
    },
    name() {
      return this.queryParams?.name ?? "Untitled search"
    },
    isSelected() {
      return this.serpTabIndex === this.index
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "createSerpTab",
      "setCurrentSerpTab",
    ]),
    ...mapActions("user", [
      "selectSerpTab",
      "setSerpTab",
      "removeSerpTab",
    ]),
    select() {

    },
    close() {

    }


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