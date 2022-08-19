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
            <strong>{{ displayName }}</strong>
          </v-list-item-title>
      </template>
      <div>
        hey man i'm a FacetSimple
      </div>

<!--      <div>-->
<!--        <facet-value-list-item-->
<!--            v-for="filter in tableItems"-->
<!--            :filter="filter"-->
<!--            :show-checked="filter.isResultsFilter"-->
<!--            :key="filter.asStr"-->
<!--        />-->
      </div>


    </v-list-group>

  </v-list>

</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';

import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {facetConfigs} from "../../facetConfigs";
import {filtersAsUrlStr, createDisplayFilter} from "../../filterConfigs";

import {api} from "../../api";

import FacetValueListItem from "./FacetOption";

export default {
  name: "FacetSimple",
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
    showMe(){

    },
    displayName() {
      return facetConfigs().find(c => c.key === this.facetKey).displayName
    },
    startDate(){

    },
    endDate(){

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
.facets-panel {
  .v-list-item {
    padding: 0 !important;
  }
  .facet-heading {
    display: flex;
    margin-left: 0;
    padding-left: 0;

    .facet-count-container {
      //width: 30px;
      text-align: right;
      //padding-right: 6px;
    }
  }

}



</style>