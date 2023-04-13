<template>
  <v-list-item
      style="min-height: 34px;"
      @click="setFacetZoom(config.key)"
  >
    <v-icon class="mr-2">{{ config.icon }}</v-icon>
    <span v-if="myResultsFilters.length" class="font-weight-bold">
      {{ config.displayName }} ({{ myResultsFilters.length }})
    </span>
    <span v-else>
      {{ config.displayName }}
    </span>
  </v-list-item>
</template>

<script>


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";
import {prettyTitle} from "../../util";

export default {
  name: "Facet",
  components: {
  },
  props: {
    facetKey: String,
    facetEntityType: String,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "resultsFilters",
      "resultsFiltersAny",
      "resultsFiltersNegated",
      "entityType",
      "textSearch",
    ]),
    config() {
      return getFacetConfig(this.facetEntityType, this.facetKey)
    },
    myResultsFilters() {
      return this.resultsFilters.filter(f => {
        return f.key === this.facetKey
      })
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
        "setFacetZoom",
    ]),
    ...mapActions([]),
    prettyTitle,
  },

  created() {
  },
  async mounted() {
  },
  watch: {}
}
</script>

<style lang="scss">
</style>