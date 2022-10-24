<template>

  <v-list-group
      color="#fff"
      multiple
      :disabled="isDisabled"
      :id="htmlId"
      append-icon=""
      eager
      :value="value"

  >
    <template v-slot:activator>
      <v-list-item-title
          @click="clickHandler"
      >

        <v-chip
                  outlined
                  small
                  class="mr-1 px-1 px-2 count-chip my-0"
                  v-if="myResultsFilters.length > 0 && !isOpen"
                  color="green lighten-2"
              >
                {{ myResultsFilters.length }}
              </v-chip>
        <v-icon v-else class="expand-indicator mr-1" style="opacity: .2;">mdi-chevron-down</v-icon>
<!--        <span v-else style="padding-left: 33px;"></span>-->
        {{ config.displayName }}


      </v-list-item-title>
            <v-list-item-action style="min-width: unset;">

            </v-list-item-action>

    </template>
    <div v-intersect="foo">
    <facet-options-list v-if="!config.isRange" :facet-key="facetKey" />
    <facet-range v-else :facet-key="facetKey" />

    </div>



  </v-list-group>
</template>

<script>


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";
import FacetRange from "./FacetRange";
import FacetOptionsList from "./FacetOptionsList";


export default {
  name: "Facet",
  components: {
    FacetOptionsList,
    FacetRange,
  },
  props: {
    facetKey: String,
    value: Boolean,
  },
  data() {
    return {
      loading: false,
      apiResp: {},
      isChecked: this.showChecked,
      showCollapsed: false,
      filtersFromApi: [],
      maxOptionsToShow: 5,
      range: [0, 100],
      isOpen: false,
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
    htmlId() {
      const noPeriods = this.facetKey.replace(/\./g, "_")
      return "facet-" + noPeriods
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
    clickHandler() {
      this.setFacetZoom(null)
    },
    foo(a, b){
      this.isOpen = a[0].isIntersecting
    }
  },

  created() {
  },
  async mounted() {
  },
  watch: {
    isDisabled(isDisabled) {
      // const elem = document.getElementById(this.htmlId)
      const elem = document.querySelector(`#${this.htmlId} .v-list-group__header`)
      if (isDisabled) {
        elem.classList.add("v-list-item--disabled")
      } else {
        elem.classList.remove("v-list-item--disabled")
      }
    },
  }
}
</script>

<style lang="scss">

.v-list-group--active > .v-list-group__header > .v-list-group__header__prepend-icon .v-icon {
}

.theme--dark.v-list-item--disabled.v-list-item--active {
  color: rgba(255, 255, 255, 0.5);
}

.v-list-group__header.v-list-item--active  .count-chip {
  //opacity: 0;
}

.v-list-group__header.v-list-item  {
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