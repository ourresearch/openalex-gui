<template>
  <v-list
      class="filter-type-list-item  my-0 py-0"
      :class="{'has-focus': hasFocus,  disabled}"
      :elevation="hasFocus ? 3 : 0"
  >
    <v-slide-y-transition group>

      <v-list-item
          @click.stop="clickHandler"
          :key="config.id+'header'"
          :input-value="hasFocus"
      >
        <v-btn
            icon
            small
            @click.stop="showCollapsed = !showCollapsed"
            class="mr-1"
        >
          <v-icon v-if="showCollapsed" class="" style="opacity: 0.5;">mdi-chevron-right</v-icon>
          <v-icon v-else class="" style="opacity: 0.7;">mdi-chevron-down</v-icon>

        </v-btn>

        <v-list-item-content>
          <div
              class="card-header-name"
              :class="{'font-weight-bold': hasFocus || myResultsFilters.length}"
          >
            {{ config.displayName }}
          </div>

        </v-list-item-content>
        <v-list-item-action>
          <v-chip
              color="green "
              v-if="showCollapsed"
              dark
              x-small
              class="mr-1 count-chip my-0"
          >
            {{ myResultsFilters.length }}
          </v-chip>
        </v-list-item-action>

      </v-list-item>

      <facet-option
          v-for="liveFilter in filtersToShow"
          :filter="liveFilter"
          :key="liveFilter.asStr"
          class="ml-7 mr-3"
          :hide-number="true"
          icon-check
          :disabled="disabled"

          :colorful="true"
          @click-checkbox="clickCheckbox"

      />
    </v-slide-y-transition>


  </v-list>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";
import {filtersAsUrlStr, filtersFromUrlStr} from "../../filterConfigs";
import FacetOption from "./FacetOption";
import {compareByCount} from "../../util";

export default {
  name: "FilterTypeListItem",
  components: {
    FacetOption,
  },
  props: {
    facetKey: String,
    bold: Boolean,
    hasFocus: Boolean,
    disabled: Boolean,
  },
  data() {
    return {
      loading: false,
      apiResp: {},
      isChecked: this.showChecked,
      showCollapsed: false,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "resultsFilters"
    ]),
    cardEventHandlerName() {
      return this.showCollapsed ? `click` : null
    },
    appliedFiltersCount() {
      const allFilters = filtersFromUrlStr(this.$route.query.filter)
      const myFilters = allFilters.filter(f => {
        return f.key === this.facetKey
      })
      return myFilters.length
    },
    myColor() {
      return "transparent"
      if (this.disabled) return "transparent"
      else if (this.hasFocus) return "rgba(0,0,0,.05)"
      else return "rgba(0,0,0,.00)"
    },
    config() {
      return getFacetConfig(this.facetKey)
    },
    myResultsFilters() {


      const ret = this.resultsFilters.filter(f => {
        return f.key === this.facetKey
      })
      ret.sort(compareByCount)
      return ret
    },
    filtersToShow() {
      return (this.showCollapsed) ? [] : this.myResultsFilters
    }
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([
      "removeInputFilters",
      "addInputFilters",
    ]),
    clickHandler() {
      if (this.hasFocus) {
        this.showCollapsed = true
      }
      else {
        this.showCollapsed = false
      }
      this.$emit('toggle-select')
    },

    clickCheckbox(filter, isChecked, e) {
    },
    async clearAllFilters() {
      const filters = filtersFromUrlStr(this.$route.query.filter)
      const filtersToKeep = filters.filter(f => f.key !== this.facetKey)
      const filterString = filtersAsUrlStr(filtersToKeep)
      const query = {...this.$route.query}
      query.filter = filterString || undefined

      await this.$router.push({
        name: "Serp",
        query
      })
      this.snackbar("Filters removed")
    },

  },

  created() {
  },
  async mounted() {

  },
  watch: {}
}
</script>

<style scoped lang="scss">
.filter-type-list-item {
  //border: 1px solid rgba(255,255,255,.1) !important;
  //position: relative;
  //z-index: 9999;
  border-radius: 5px;
  //border: 1px solid #999;

  .v-chip {
    padding: 0 8px !important;
  }

  &.has-focus {
    //background-color: #eee !important;
  }

  &.disabled {
    .card-header-name {
      opacity: .5;
    }

    .count-chip {
      opacity: .7;
      filter: grayscale(100%);
    }
  }
}
</style>