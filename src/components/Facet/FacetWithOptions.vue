<template>

  <!--  <v-list-item>-->
  <v-list
      class="pa-0 facets-panel"
      style="border-bottom: 1px solid #ddd;"
  >
    <v-list-group
        :value="resultsFiltersToShow.length"
        style="padding: 0; min-height: 0; margin-left: 0;"
    >
      <template v-slot:activator>

        <v-list-item-title class="facet-heading ma-0 pa-0">
          <div class="facet-count-container">
            <v-chip
                x-small
                class="mb-1 mr-1 px-1"
                color="primary"
                v-if="resultsFiltersToShow.length > 0"
            >
              {{ resultsFiltersToShow.length }}
            </v-chip>
          </div>
          <strong>
            {{ groupByQueryResultsCount }}:
            {{ displayName }}
          </strong>
        </v-list-item-title>
      </template>
      <div>
        <!--        <facet-option-is-oa-->
        <!--            v-if="facetKey === 'oa_status'"-->
        <!--            key="oa_statue"-->
        <!--        />-->

        <facet-option
            v-for="filter in tableItems"
            :filter="filter"
            :show-checked="filter.isResultsFilter"
            :key="filter.asStr"
        />
        <div
            class="more-link ml-5 mt-1"
            v-if="groupByQueryResultsCount > maxPotentialFiltersToShow"
            @click="isCustomFilterDialogOpen = true"
        >
          <v-btn small plain>more</v-btn>
        </div>
      </div>


    </v-list-group>

    <v-dialog v-model="isCustomFilterDialogOpen">
      <v-card>
        <v-card-title>
          Add filter
        </v-card-title>
        <div class="pa-4">
          <div class="">do the adding...</div>
        </div>
      </v-card>
    </v-dialog>

  </v-list>

</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';

import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {facetConfigs} from "../../facetConfigs";
import {filtersAsUrlStr, createDisplayFilter} from "../../filterConfigs";
import {makeFacet} from "../../facetConfigs";

import {api} from "../../api";

import FacetOption from "./FacetOption";
import FacetOptionIsOa from "./FacetOptionIsOa";

export default {
  name: "FacetWithOptions",
  components: {
    FacetOption,
    FacetOptionIsOa,
  },
  props: {
    facetKey: String,
  },
  data() {
    return {
      loading: false,
      isCustomFilterDialogOpen: false,
      facet: null,
      potentialFilterValues: [],
      groupByQueryResultsCount: null,
      maxPotentialFiltersToShow: 5,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "sortOptions",
      "appliedFilters",
      "inputFiltersAsString",
    ]),
    displayName() {
      return facetConfigs().find(c => c.key === this.facetKey).displayName
    },
    tableItems() {
      const ret = [...this.resultsFiltersToShow]

      this.potentialFilterValues.slice(0, this.maxPotentialFiltersToShow).forEach(f => {

        // only push potential filter values if they're not already loaded as
        // in a resultsFilter
        if (!ret.map(f => f.asStr).includes(f.asStr)) {
          ret.push(f)
        }
      })
      ret.sort(function (a, b) {
        return a.count > b.count
      })

      return ret
    },
    apiQuery() {
      console.log("facet apiquery", this.$store.getters.inputFiltersForUrl)

      const myFilters = this.$store.getters.inputFiltersForUrl.filter(f => f.key !== this.facetKey)
      return {
        group_by: this.facetKey,
        filter: filtersAsUrlStr(myFilters)
      }
    },
    resultsFiltersToShow() {
      return this.$store.state.resultsFilters
          .filter(f => {
            return f.key === this.facetKey
          })
          .map(f => {
            return {...f, isResultsFilter: true}
          })
    },
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([
      "updateTextSearch",
    ]),
    async setFilterValues() {
      const resp = await api.get(
          this.$store.state.entityType,
          this.apiQuery,
      )
      this.groupByQueryResultsCount = resp.meta.count
      this.potentialFilterValues = resp.group_by.map(group => {
        return createDisplayFilter(
            this.facetKey,
            group.key,
            group.key_display_name,
            group.count
        )
      })
    }
  },

  created() {
  },
  async mounted() {

  },
  watch: {
    "$store.getters.resultsFiltersAsStringToWatch": {
      immediate: false,
      handler(newVal, oldVal) {
        console.log(`Facet "${this.facetKey}" watcher: resultsFilters changed:`, newVal)
        this.setFilterValues()
      },
    },
  }
}
</script>

<style lang="scss">
.facets-panel {
  .v-list-item {
    padding: 0 !important;
  }

  .facet-heading {
    display: flex;
    margin-left: 0;
    padding-left: 0;

    .facet-count-container {
      width: 30px;
      text-align: right;
      padding-right: 6px;
    }
  }

}


</style>