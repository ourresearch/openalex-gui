<template>
  <v-list-item
      @click.stop="(facetZoom) ? setFacetZoom(null) : setFacetZoom(facetKey)"
      :disabled="isDisabled"
      class="d-flex align-center pr-0"
      style="min-height: 34px;"
  >
    <v-row class="pa-0 ma-0">
      <v-col cols="5" class="pa-0">
        <v-icon :disabled="isDisabled" class="mr-4">{{ config.icon }}</v-icon>
        {{ config.displayName }}
      </v-col>
      <v-col cols="7" class="pa-0 d-flex  justify-end">
        <div class="green--text ">
          <span class="font-weight-bold" v-if="myResultsFilters.length === 1">
            <span v-if="myResultsFilters[0].isNegated" class="red--text">
              {{ prettyTitle(myResultsFilters[0].displayValue, facetKey) | truncate(50) }}
            </span>
            <span v-else class="green--text">
              {{ prettyTitle(myResultsFilters[0].displayValue, facetKey) | truncate(50) }}
            </span>
          </span>
          <span v-if="myResultsFilters.length > 1">
            {{ myResultsFilters.length }} filters
          </span>
        </div>
        <v-btn style="margin: 2px 0 0 5px;" color="green" :disabled="isDisabled"
               v-if="!!myResultsFilters.length" x-small icon @click.stop="removeInputFiltersByKey(facetKey)">
          <v-icon small>mdi-close</v-icon>
        </v-btn>
      </v-col>
    </v-row>


  </v-list-item>
</template>

<script>


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";
import {prettyTitle} from "../../util";


export default {
  name: "Facet",
  components: {},
  props: {
    facetKey: String,
  },
  data() {
    return {}
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
      "removeInputFiltersByKey"
    ]),
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