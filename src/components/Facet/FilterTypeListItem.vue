<template>
  <v-list-item
      v-on="(!bold) ? {click: clickHandler} : {}"
      style="min-height: 30px;"
      class="pl-0 pr-0 filter-type-list-item"
      :class="{'has-focus': hasFocus}"
  >
    <!--    <v-list-item-icon>-->
    <!--      <v-icon v-if="appliedFiltersCount">mdi-chevron-down</v-icon>-->
    <!--      <v-icon v-else>mdi-chevron-right</v-icon>-->
    <!--      <v-chip-->
    <!--          color="primary"-->
    <!--          small-->
    <!--          outlined-->
    <!--          class="px-2"-->
    <!--      >-->
    <!--        {{ appliedFiltersCount }}-->
    <!--      </v-chip>-->

    <!--    </v-list-item-icon>-->
    <v-list-item-content>
      <div
          style="font-weight: normal; line-height: 1.2;font-size: 16px; width: 100%;"
          :class="{'font-weight-normal': bold, 'body-2': bold}"
          class="d-flex align-center pr-4 pl-6 pb-0"
      >
        <div class="">
          {{ config.displayName }}
        </div>
        <v-spacer></v-spacer>
        <div>
          <v-btn
              v-if="bold && !config.noOptions"
              small
              icon
              class="low-key-button mr-1"
              @click="$emit('select')"
          >
            <v-icon small>mdi-plus</v-icon>
          </v-btn>
          <v-btn
              v-if="bold"
              small
              icon
              class="low-key-button mr-1"
              @click.stop="clearAllFilters"
          >
            <v-icon small>mdi-delete-outline</v-icon>
          </v-btn>
        </div>
      </div>
      <facet-option
          v-for="liveFilter in myResultsFilters"
          :filter="liveFilter"
          :show-checked="true"
          :key="liveFilter.asStr"
          class="ml-0"
          :hide-bar="true"
          :hide-number="myResultsFilters.length < 2"
          @click-checkbox="clickCheckbox"
      />

    </v-list-item-content>


  </v-list-item>
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
  },
  data() {
    return {
      loading: false,
      apiResp: {},
      isChecked: this.showChecked,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "resultsFilters"
    ]),
    appliedFiltersCount() {
      const allFilters = filtersFromUrlStr(this.$route.query.filter)
      const myFilters = allFilters.filter(f => {
        return f.key === this.facetKey
      })
      return myFilters.length
    },
    config() {
      return getFacetConfig(this.facetKey)
    },
    myResultsFilters() {
      const ret = this.resultsFilters.filter(f => {
        return f.key === this.facetKey
      })
      ret.sort(compareByCount)
      const maxCount = Math.max(...ret.map(r => r.count))
      ret.forEach(f => {
        f.countNormalized = f.count / maxCount
      })

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
      this.$emit('select')
    },

    clickCheckbox(filter, isChecked, e) {
      console.log("click checkbox", filter, isChecked, e)
      if (isChecked) this.addInputFilters([filter])
      else this.removeInputFilters([filter])
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
    &.has-focus {
      background-color: #3d3d3d !important;
    }
  }
</style>