<template>

  <!--  <v-list-item>-->
  <v-list>
    <v-list-group value="true">
      <template v-slot:activator>
        <v-list-item-title>
          <strong>{{ displayName }}</strong>
          <!--        <span class="ml-3 caption grey&#45;&#45;text" style="font-family: monospace !important;">{{ facetKey }}</span>-->
        </v-list-item-title>
      </template>
      <div>
        <facet-value-list-item
            v-for="filter in tableItems"
            :filter="filter"
            :show-checked="filter.isResultsFilter"
            :key="filter.asStr"
        />
      </div>


      <v-data-table
          v-if="false"
          :headers="tableHeaders"
          :items="tableItems"
          hide-default-footer
          hide-default-header
          item-key="value"
          v-model="selectedFilterValues"
          class="facet-values-table"
          dense
      >
        <template v-slot:item="row">
          <facet-value-list-item :filter="row.item"/>

          <!--          <tr>-->
          <!--          <td>{{ row.item.displayValue }}</td>-->
          <!--          <td>{{ row.item.count }}</td>-->

          <!--          </tr>-->
        </template>

      </v-data-table>
    </v-list-group>

  </v-list>

</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';

import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {facetConfigs} from "../facetConfigs";
import {filtersAsUrlStr, createDisplayFilter} from "../filterConfigs";
import {makeFacet} from "../facetConfigs";

import {api} from "../api";

import FacetValueListItem from "./FacetValueListItem";

export default {
  name: "Facet",
  components: {
    FacetValueListItem,
  },
  props: {
    facetKey: String,
  },
  data() {
    return {
      loading: false,
      facet: null,
      potentialFilterValues: [],
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
      const ret = this.resultsFiltersToShow
      this.potentialFilterValues.slice(0, 5).forEach(f => {

        // only push potential filter values if they're not already loaded as
        // in a resultsFilter
        if (!ret.map(f => f.asStr).includes(f.asStr)) {
          ret.push(f)
        }
      })

      return ret
    },
    apiQuery() {
      console.log("facet apiquery", this.$store.getters.inputFiltersForUrl)
      return {
        group_by: this.facetKey,
        filter: filtersAsUrlStr(this.$store.getters.inputFiltersForUrl, this.facetKey)
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
.v-data-table > .v-data-table__wrapper > table {
  tr {
    td {
      &:first-child {
        padding: 0 0 0 10px;
      }

      &:nth-child(2) {
        padding-left: 3px;
      }
    }

  }
}


</style>