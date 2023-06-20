<template>
  <v-card>
    <v-card-title>
      <v-icon left>mdi-content-save-plus-outline</v-icon>
      Save this search
    </v-card-title>
    <v-card-text>
      <p>Add this search to your list of
        <router-link to="/me/saved-searches">saved searches.</router-link>
      </p>
    </v-card-text>


    <v-card-actions class="py-6">
      <v-spacer></v-spacer>
      <v-btn text @click="$emit('close')">Cancel</v-btn>
      <v-btn color="primary" @click="create">Save search</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "SerpToolbarSavedSearch",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
      dialogIsOpen: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "inputFiltersAsString",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    async create() {
      const args = {
        search_url: 'https://alpha.openalex.org' + this.$route.fullPath
      }
      await this.$store.dispatch("user/createSavedSearch", args)
      this.snackbar("Search saved")
      this.$emit("close")
    }

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