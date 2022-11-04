<template>


  <v-menu
      :close-on-content-click="false"
      :value="showMenu"
      @input="checkInput"
      content-class="facet-menu"
  >
    <template v-slot:activator="{on}">
  <v-list-item
      v-on="on"
      :disabled="isDisabled"
      class="d-flex align-center pr-0"
      style="min-height: 34px;"
  >
    <v-row class="pa-0 ma-0">
      <v-col class="pa-0 grow">
        <v-icon :disabled="isDisabled" class="mr-2">{{ config.icon }}</v-icon>
        {{ config.displayName }}
      </v-col>
      <v-col class="shrink pa-0"  style="white-space: nowrap">
         <span class="font-weight-bold" v-if="0 && myResultsFilters.length === 1">
              {{ prettyTitle(myResultsFilters[0].displayValue, facetKey) | truncate(50) }}
          </span>
        <template v-if="myResultsFilters.length >= 1">
          <v-chip
              v-if="myResultsFiltersNegated.length"
              color="red"
              dark
              x-small
              class="ml-1"
              :disabled="isDisabled"
          >
            {{ myResultsFiltersNegated.length }}
          </v-chip>
          <v-chip
              v-if="myResultsFiltersAny.length"
              color="green"
              dark
              x-small
              class="ml-1"
              :disabled="isDisabled"

          >
            {{ myResultsFiltersAny.length }}
          </v-chip>
        </template>



        <v-btn  style="margin: 2px 5px 0 5px;" :color="valuesColor" :disabled="isDisabled"
               v-if="!!myResultsFilters.length" x-small icon @click.stop="removeInputFiltersByKey(facetKey)">
          <v-icon small>mdi-close</v-icon>
        </v-btn>
      </v-col>

      <v-col v-if="0" class="pa-0 d-flex shrink justify-end">
        <div :class="valuesColor + '--text'">
          <span class="font-weight-bold" v-if="myResultsFilters.length === 1">
              {{ prettyTitle(myResultsFilters[0].displayValue, facetKey) | truncate(50) }}
          </span>
          <span v-if="myResultsFilters.length > 1">
            {{ myResultsFilters.length }} filters
          </span>
        </div>
        <v-btn style="margin: 2px 0 0 5px;" :color="valuesColor" :disabled="isDisabled"
               v-if="!!myResultsFilters.length" x-small icon @click.stop="removeInputFiltersByKey(facetKey)">
          <v-icon small>mdi-close</v-icon>
        </v-btn>
      </v-col>
    </v-row>


  </v-list-item>
    </template>
    <facet-zoom :facet-key="facetKey"></facet-zoom>

  </v-menu>
</template>

<script>


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";
import FacetZoom from "./FacetZoom";
import {prettyTitle} from "../../util";


export default {
  name: "Facet",
  components: {
    FacetZoom,
  },
  props: {
    facetKey: String,
  },
  data() {
    return {
      showMenu: false,
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
    isDisabled() {
      return false
    },
    config() {
      console.log("get config", this.facetKey)
      return getFacetConfig(this.facetKey)
    },
    myResultsFilters() {
      return this.resultsFilters.filter(f => {
        return f.key === this.facetKey
      })
    },
    myResultsFiltersAny() {
      return this.resultsFiltersAny.filter(f => {
        return f.key === this.facetKey
      })
    },
    myResultsFiltersNegated() {
      return this.resultsFiltersNegated.filter(f => {
        return f.key === this.facetKey
      })
    },
    valuesColor(){
      if (this.myResultsFilters.every(f => f.isNegated)) return "red"
      else if (this.myResultsFilters.every(f => !f.isNegated)) return "green"
      else return ""
    }
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([
      "removeInputFilters",
      "addInputFilters",
      "removeInputFiltersByKey"
    ]),
    prettyTitle,
    closeMenu() {
      this.showMenu = false
    },
    checkInput(input) {
      console.log("Facet checkInput()")
      this.showMenu = input
    },
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