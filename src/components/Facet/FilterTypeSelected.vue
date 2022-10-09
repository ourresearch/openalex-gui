<template>
  <v-card
      class="filter-type-list-item  my-1 pl-2 pt-2"
      :class="{'has-focus': hasFocus, disabled}"
      :color="myColor"
      dark
      :elevation="(hasFocus) ? 4 : 0"

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
    <div class="card-header d-flex">
      <div class="body-2 mb-2">
        <v-icon v-if="hasFocus" class="pr-2" >mdi-playlist-plus</v-icon>
          <v-icon v-else class="pr-2" style="opacity: 0.5;">mdi-chevron-right</v-icon>


        <span class="card-header-name">
          {{ config.displayName }}
        </span>
      </div>
      <v-spacer></v-spacer>
      <v-btn
          v-if="!config.noOptions && !hasFocus"
          small
          icon
          class="low-key-button mr-1"
          @click="$emit('toggle-select')"
          :disabled="disabled"
      >
        <v-icon small>mdi-playlist-plus</v-icon>
      </v-btn>
      <v-btn
          v-if="hasFocus"
          small
          icon
          class="mr-1"
          @click="$emit('toggle-select')"
      >
        <v-icon >mdi-chevron-left</v-icon>
      </v-btn>
    </div>

    <div class="card-body">
      <facet-option
          v-for="liveFilter in myResultsFilters"
          :filter="liveFilter"
          :show-checked="true"
          :key="liveFilter.asStr"
          class="ml-7 mr-3"
          :hide-bar="true"
          :hide-number="true"
          :disabled="disabled"
          @click-checkbox="clickCheckbox"
      />
    </div>



  </v-card>
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
    myColor(){
      if (this.disabled) return "transparent"
      else if (this.hasFocus) return "#444"
      else return "rgba(255,255,255,.04)"
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
  //border: 1px solid rgba(255,255,255,.1) !important;
  position: relative;
  z-index: 9999;
  border-radius: 5px;
  &.has-focus {
    //background-color: #3d3d3d !important;
  }
  &.disabled {
    .card-header-name {
      opacity: .75;
    }
  }
}
</style>