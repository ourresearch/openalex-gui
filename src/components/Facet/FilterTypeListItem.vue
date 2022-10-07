<template>
  <v-list-item
      v-on="(!bold) ? {click: clickHandler} : {}"
      style="min-height: 30px; "
      class="pl-0"
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
          class="d-flex align-center"
      >
        <div class="pl-12 ml-2">
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
          :hide-bar="true"
          class="ml-0"
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

export default {
  name: "FilterTypeListItem",
  components: {
    FacetOption,
  },
  props: {
    facetKey: String,
    bold: Boolean,
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
      return this.resultsFilters.filter(f => {
        return f.key === this.facetKey
      })
    }
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    clickHandler() {
      this.$emit('select')
    },
    clickCheckbox(e){
      console.log("FilterTypeListItem clickCheckbox", e)
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
</style>