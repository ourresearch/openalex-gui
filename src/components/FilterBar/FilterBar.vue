<template>
  <div style="width: 100%; position: relative; z-index: 6;" class="filter-bar">
    <v-card outlined rounded class="px-2 py-1 d-flex" style="min-height: 40px;">
      <div class="flex-grow-1 pt-0 d-flex align-baseline">
        <component
            v-for="(filter, i) in filters"
            :key="filter.key + $route.query.filter"
            class="mr-2 mb-2"
            :is="'filter-phrase-' + filter.type"
            :filter-key="filter.key"
            :is-active="filter.key === activeFilterKey"
            @submit="focusOnSearchBox"
        />

        <component
            v-if="creatingNewFilter"
            :key="'new-filter' + $route.query.filter"
            class="mr-2 mb-2"
            :is="'filter-phrase-' + activeFilterConfig.type"
            :filter-key="activeFilterConfig.key"
            @submit="focusOnSearchBox"
        />



        <v-text-field

            hide-details
            dense
            v-model="searchString"
            ref="facetBarSearchBox"
            rounded
            class="elevation-0 ma-0 pa-0 "
            @keyup.enter="onEnter"
            @keydown.delete="onDelete"
            :placeholder="placeholder"
        />

      </div>
      <div>
        <v-btn
            v-if="url.readFiltersLength()"
            icon
            @click="clearEverything"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>


      <!--        :filter-value="filter.value"-->
      <!--        @edit="setActiveFilter(filter.key, filter.value, false)"-->
      <!--        @delete="deleteFilter(filter.key)"-->

      <!--      <filter-bar-search />-->


    </v-card>
    <v-card
        style="position: absolute; width: 100%;"
        v-if="searchString.length"
    >
      <filter-bar-suggestions
          :search-string="searchString"
          @submit="searchString = ''"
      />
    </v-card>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import FilterBarSearch from "@/components/FilterBar/FilterBarSearch.vue";
import FilterBarSuggestions from "@/components/FilterBar/FilterBarSuggestions.vue";

import FilterPhraseSearch from "@/components/FilterPhrase/FilterPhraseSearch.vue";
import FilterPhraseSelect from "@/components/FilterPhrase/FilterPhraseSelect.vue";
import FilterPhraseRange from "@/components/FilterPhrase/FilterPhraseRange.vue";
import FilterPhraseBoolean from "@/components/FilterPhrase/FilterPhraseBoolean.vue";

import {createSimpleFilter, filtersFromUrlStr} from "@/filterConfigs";
import {url} from "@/url";
import {api} from "@/api";
import {getEntityConfig} from "@/entityConfigs";
import {getFacetConfig} from "@/facetConfigs";
import {shortenOpenAlexId} from "@/util";

export default {
  name: "Template",
  components: {
    FilterPhraseSelect,
    FilterPhraseSearch,
    FilterPhraseRange,
    FilterPhraseBoolean,

    FilterBarSearch,
    FilterBarSuggestions,
  },
  props: {},
  data() {
    return {
      foo: 42,
      searchString: "",
      url,
      activeFilterKey: null,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    filters() {
      return filtersFromUrlStr(this.entityType, this.$route.query.filter)
    },
    activeFilter(){
      return this.$store.state.activeFilter
    },
    creatingNewFilter(){
      const appliedFilterKeys = this.filters.map(f => f.key)
      return this.activeFilter && !appliedFilterKeys.includes(this.activeFilter)
    },
    activeFilterConfig(){
      if (!this.$store.state.activeFilter) return
      return getFacetConfig(this.entityType, this.$store.state.activeFilter)
    },
    searchFilterConfig() {
      const searchKeyName = this.entityType === "works" ?
          "default.search" :
          "display_name.search"
      return getFacetConfig(this.entityType, searchKeyName)
    },
    placeholder() {
      return (this.filters.length) ?
          "+" :
          "search"
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    upsertFilter(newValue) {
      url.upsertFilter(this.entityType, this.activeFilterKey, newValue)
      if (this.activeFilterConfig.type !== "select") {
        this.setActiveFilter(null, null, null)
      }
    },
    focusOnSearchBox(){
      setTimeout(()=> {
        // this.$refs.facetBarSearchBox.focus()
      }, 1)
    },
    deleteFilter(key) {
      this.isActiveFilterDialogOpen = false
      console.log("FilterList deleteFilter", key)
      this.searchString = ""
      url.deleteFilter(this.entityType, key)
      this.setActiveFilter(null, null, null)
    },
    onEnter() {
      if (!this.searchString) {
        this.$router.push({name: "Serp", params: {entityType: this.entityType}})
      }
      else {
        url.upsertFilter(
            this.entityType,
            "default.search",
            this.searchString
        )
      }
      this.searchString = ""
    },
    onDelete() {
      if (this.searchString) return
      // const lastFilterKey = this.filters.at(-1)?.key
      // if (!lastFilterKey) return
      //
      // console.log("delete", lastFilterKey)
      // this.setActiveFilter(lastFilterKey)
    },
    async setActiveFilter(filterKey) {
      this.$store.state.activeFilter = filterKey
    },
    clearEverything() {
      this.$store.state.activeFilter = null
      this.searchString = ""
      url.deleteAllFilters()

    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    '$store.state.activeFilter': {
      immediate: false,
      handler(to) {
        if (!to) return
        const inputId = "input." + to
        console.log("$store.state.activeFilter changed", inputId)
        setTimeout(() => {
          // document.getElementById(inputId).focus()

        }, 0)
      }
    }
  }
}
</script>

<style lang="scss">
.filter-bar {
  .v-text-field--rounded > .v-input__control > .v-input__slot {
    padding: 0 !important;
  }

}

</style>