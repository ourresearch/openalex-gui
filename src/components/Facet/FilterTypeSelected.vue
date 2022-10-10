<template>
  <v-card
      class="filter-type-list-item  my-1 pl-2 pt-2 pr-2"
      :class="{'has-focus': hasFocus, disabled}"
      :color="myColor"
      dark
      :elevation="(hasFocus) ? 4 : 0"
      @[cardEventHandlerName]="showCollapsed = !showCollapsed"



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
      <div class=" mb-2">
        <v-btn
            icon
            small
            @click.stop="showCollapsed = !showCollapsed"
            class="mr-1"
            :disabled="hasFocus"
        >
          <v-icon v-if="showCollapsed" class="" style="opacity: 0.5;">mdi-chevron-right</v-icon>
          <v-icon v-else class="" style="opacity: 0.5;">mdi-chevron-down</v-icon>

        </v-btn>
        <!--        <v-icon v-if="hasFocus" class="pr-2" >mdi-playlist-plus</v-icon>-->


        <span
            class="card-header-name"
            :class="{'': !showCollapsed}"
        >
          {{ config.displayName }}
        </span>
      </div>
      <v-spacer></v-spacer>
      <template v-if="showCollapsed">
        <v-chip
            color="green lighten-2"
            light
            x-small
            class="px-1 mt-1 mr-2 count-chip"
        >
          {{ myResultsFilters.length }}
        </v-chip>
<!--        <span class="font-weight-bold green&#45;&#45;text text&#45;&#45;lighten-2">{{ myResultsFilters.length }}</span>-->
      </template>
      <template v-else>
        <v-btn
            v-if="!config.noOptions && !hasFocus"
            small
            icon
            class="low-key-button"
            @click.stop="$emit('toggle-select')"
            :disabled="disabled"
        >
          <v-icon small>mdi-playlist-plus</v-icon>
        </v-btn>
        <v-btn
            v-if="hasFocus"
            small
            icon
            class=""
            @click="$emit('toggle-select')"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
      </template>
    </div>

    <div class="card-body" v-if="!showCollapsed">
      <v-fade-transition group>

      <facet-option
          v-for="liveFilter in myResultsFilters"
          :filter="liveFilter"
          :key="liveFilter.asStr"
          class="ml-7 mr-3"
          :hide-bar="true"
          :hide-number="true"
          :disabled="disabled"
          :colorful="true"
          @click-checkbox="clickCheckbox"

      />
      </v-fade-transition>
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
      showCollapsed: false,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "resultsFilters"
    ]),
    cardEventHandlerName(){
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
      if (this.disabled) return "transparent"
      else if (this.hasFocus) return "#4a4a4a"
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
  watch: {
  }
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
      opacity: .7;
    }
    .count-chip {
      opacity: .1;
      filter: grayscale(100%);
    }
  }
}
</style>