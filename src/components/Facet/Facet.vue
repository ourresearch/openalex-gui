<template>

  <v-list-group
      :value="isExpanded"
      color="#fff"
      append-icon=""
      multiple
  >
    <template v-slot:activator>
      <v-list-item-title
      >
<!--        <v-icon class="expand-indicator" style="opacity: .1;">mdi-chevron-down</v-icon>-->

        {{ config.displayName }}

        <!--      <v-list-item-action>-->
        <!--          {{ myResultsFilters.length }}-->
        <!--        </v-chip>-->
        <!--        &lt;!&ndash;          <span class="body-2 grey&#45;&#45;text font-weight-bold">&ndash;&gt;-->
        <!--        &lt;!&ndash;            {{ myResultsFilters.length }}&ndash;&gt;-->
        <!--        &lt;!&ndash;          </span>&ndash;&gt;-->
        <!--      </v-list-item-action>-->


      </v-list-item-title>
      <v-list-item-action style="min-width: unset;">
        <v-chip
            outlined
            small
            class="mr-1 px-2 count-chip my-0"
            v-if="myResultsFilters.length > 0"
        >
          {{ myResultsFilters.length }}
        </v-chip>
      </v-list-item-action>

    </template>

    <v-list
        class="filter-type-list-item  my-0 py-0"
    >
      <v-slide-y-transition group>
        <facet-option
            v-for="liveFilter in filtersToShow"
            :filter="liveFilter"
            :key="liveFilter.asStr"
            class="ml-6"

            @click-checkbox="clickCheckbox"

        />
      </v-slide-y-transition>
        <v-list-item class="ml-6" v-if="thereAreMoreResults" key="more-button">
          <v-btn
              small
              class="ml-7"
              text
              @click.stop="$emit('toggle-select')"
          >
<!--            <v-icon left>mdi-plus</v-icon>-->
            more
            <v-icon right>mdi-chevron-right</v-icon>
          </v-btn>
<!--          <v-list-item-icon>-->
<!--            <v-icon>mdi-plus</v-icon>-->
<!--          </v-list-item-icon>-->
<!--          <v-list-item-content>-->
<!--            More-->
<!--          </v-list-item-content>-->
        </v-list-item>


    </v-list>

  </v-list-group>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";
import {createDisplayFilter, filtersAsUrlStr, filtersFromUrlStr, makeFilterList} from "../../filterConfigs";
import FacetOption from "./FacetOption";
import {compareByCount} from "../../util";
import {api} from "../../api";

export default {
  name: "Facet",
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
      filtersFromApi: [],
      maxOptionsToShow: 5,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "resultsFilters",
      "entityType",
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
    apiUrl() {
      const url = new URL(`https://api.openalex.org`);
      url.pathname = `${this.entityType}`
      const myFilters = this.$store.state.inputFilters.filter(f => f.key !== this.facetKey)
      url.searchParams.set("filter", filtersAsUrlStr(myFilters))
      url.searchParams.set("group_by", this.facetKey)
      if (this.textSearch) url.searchParams.set("search", this.textSearch)
      url.searchParams.set("email", "team@ourresearch.org")
      return url.toString()
    },
    thereAreMoreResults() {
      return this.apiFiltersToShow.length > this.slicedApiFiltersToShow.length
    },

    apiFiltersToShow() {
      const resultsFilterStrings = this.myResultsFilters.map(f => f.asStr)
      return this.filtersFromApi
          .filter(f => {
            return !resultsFilterStrings.includes(f.asStr)
          })
          .filter(f => f.value !== "unknown")
    },
    slicedApiFiltersToShow() {
      const maxFiltersFromApiToShow = Math.max(
          0,
          (this.maxOptionsToShow) - this.myResultsFilters.length
      )
      return this.apiFiltersToShow.slice(0, maxFiltersFromApiToShow)
    },

    myResultsFilters() {
      return this.resultsFilters.filter(f => {
        return f.key === this.facetKey
      })
    },
    filtersToShow() {
      const ret = [...this.slicedApiFiltersToShow]
      ret.push(...this.myResultsFilters)
      const worksCounts = ret.map(f => f.count)
      const sumOfAllWorksCounts = worksCounts.reduce((a, b) => a + b, 0)
      ret.map(f => {
        f.countPercent = (f.count / sumOfAllWorksCounts) * 100
      })


      ret.sort(compareByCount)
      return ret
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

    async fetchFilters() {

      if (!this.config) return
      if (this.config.noOptions) return
      this.isLoading = true

      const resp = await api.getUrl(this.apiUrl)


      this.filtersFromApi = resp.group_by.map(apiData => {
        return createDisplayFilter(
            this.config.key,
            apiData.key,
            apiData.key_display_name,
            apiData.count,
        )
      })

      this.isLoading = false
    },

  },

  created() {
  },
  async mounted() {

  },
  watch: {
    "$route.query": {
      immediate: true,
      handler(newVal, oldVal) {
        this.fetchFilters()
      }
    },
  }
}
</script>

<style scoped lang="scss">

.v-list-group--active > .v-list-group__header > .v-list-group__header__prepend-icon .v-icon {
}

.v-list-group--active {
  .expand-indicator {
    transform: rotate(-180deg);

  }
}

.v-list-group--active > .v-list-group__header {
  font-weight: bold;
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