<template>
  <v-list-item
      @click.stop="(facetZoom) ? setFacetZoom(null) : setFacetZoom(facetKey)"
      :disabled="isDisabled"
  >
    <v-list-item-title class="d-flex align-center">
      <v-icon  :disabled="isDisabled" class="mr-4" style="opacity: .7;">{{ config.icon }}</v-icon>
    {{ config.displayName }}

    </v-list-item-title>
  </v-list-item>
</template>

<script>


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";


export default {
  name: "Facet",
  components: {
  },
  props: {
    facetKey: String,
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "resultsFilters",
      "entityType",
      "facetZoom",
      "textSearch",
    ]),
    isDisabled() {
      return !!this.facetZoom // && this.facetZoom !== this.facetKey
    },
    config() {
      return getFacetConfig(this.facetKey)
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
    ...mapActions([
      "removeInputFilters",
      "addInputFilters",
    ]),
  },

  created() {
  },
  async mounted() {
  },
  watch: {
  }
}
</script>

<style lang="scss">

.v-list-group--active > .v-list-group__header > .v-list-group__header__prepend-icon .v-icon {
}

.theme--dark.v-list-item--disabled.v-list-item--active {
  color: rgba(255, 255, 255, 0.5);
}

.v-list-group__header.v-list-item--active .count-chip {
  //opacity: 0;
}

.v-list-group__header.v-list-item {
  min-height: 35px;
}

.v-list-group--active {
  .expand-indicator {
    transform: rotate(-180deg);

  }
}

.v-list-group--active > .v-list-group__header {
  font-weight: bold;
}
</style>