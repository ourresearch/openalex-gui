<template>

  <v-list-group
      :value="isExpanded"
      color="#333"
      append-icon="$expand"
  >
    <template v-slot:activator>
      <v-list-item-title
      >

        {{ config.displayName }}

        <!--      <v-list-item-action>-->
        <!--        <v-chip-->
        <!--            color="green "-->
        <!--            v-if="showCollapsed"-->
        <!--            dark-->
        <!--            x-small-->
        <!--            outlined-->
        <!--            class="mr-1 count-chip my-0"-->
        <!--        >-->
        <!--          {{ myResultsFilters.length }}-->
        <!--        </v-chip>-->
        <!--        &lt;!&ndash;          <span class="body-2 grey&#45;&#45;text font-weight-bold">&ndash;&gt;-->
        <!--        &lt;!&ndash;            {{ myResultsFilters.length }}&ndash;&gt;-->
        <!--        &lt;!&ndash;          </span>&ndash;&gt;-->
        <!--      </v-list-item-action>-->

      </v-list-item-title>

    </template>

    <v-list
        class="filter-type-list-item  my-0 py-0"
    >
      <v-slide-y-transition group>
        <facet-option
            v-for="liveFilter in filtersToShow"
            :filter="liveFilter"
            :key="liveFilter.asStr"
            class="ml-3 mr-2"

            @click-checkbox="clickCheckbox"

        />
      </v-slide-y-transition>


    </v-list>

  </v-list-group>
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
      isExpanded: false,
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
      } else {
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

<style  lang="scss">

.v-list-group--active > .v-list-group__header > .v-list-group__header__prepend-icon .v-icon {
  transform: rotate(-180deg);
}

//.filter-type-list-item {
//  border-radius: 5px;
//
//  .v-chip {
//    padding: 0 8px !important;
//  }
//
//  &.has-focus {
//    //background-color: #eee !important;
//  }
//
//  &.disabled {
//    .card-header-name {
//      opacity: .5;
//    }
//
//    .count-chip {
//      opacity: .7;
//      filter: grayscale(100%);
//    }
//  }
//}
</style>