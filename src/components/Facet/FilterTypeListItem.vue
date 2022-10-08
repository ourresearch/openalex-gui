<template>
  <v-list-item
      @click="clickHandler"
      style="min-height: 10px;"
      class="py-0 filter-type-list-item"
      :disabled="disabled"
  >
        <v-list-item-icon>
          <v-icon style="opacity: 0.5;">mdi-chevron-right</v-icon>
<!--          <v-chip-->
<!--              color="primary"-->
<!--              small-->
<!--              outlined-->
<!--              class="px-2"-->
<!--          >-->
<!--            {{ appliedFiltersCount }}-->
<!--          </v-chip>-->

        </v-list-item-icon>
    <v-list-item-content>
          {{ config.displayName }}


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