<template>
  <div style="width: 100%; position: relative; z-index: 6;" class="filter-bar">
    <v-text-field
        hide-details
        dense
        v-model="searchString"
        ref="facetBarSearchBox"
        prepend-inner-icon="mdi-magnify"
        rounded
        outlined
        class="elevation-0 ma-0 pa-0 "
        @keyup.enter="onEnter"
        @keydown.delete="onDelete"
        @blur="onBlur"
        placeholder="search OpenAlex"
    />
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

import FilterPhraseSearch from "@/components/Filter/FilterSearch.vue";
import FilterPhraseSelect from "@/components/Filter/FilterSelect.vue";
import FilterPhraseRange from "@/components/Filter/FilterRange.vue";
import FilterPhraseBoolean from "@/components/Filter/FilterBoolean.vue";

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
    activeFilter() {
      return this.$store.state.activeFilter
    },
    creatingNewFilter() {
      const appliedFilterKeys = this.filters.map(f => f.key)
      return this.activeFilter && !appliedFilterKeys.includes(this.activeFilter)
    },
    activeFilterConfig() {
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
    focusOnSearchBox() {
      setTimeout(() => {
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
      } else {
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

    },
    onBlur(){
      setTimeout(()=> {
        this.searchString = ""
      })
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
    //padding: 0 !important;
  }

  //font-size: 22px;

  .phrase {
    cursor: pointer;
    display: block;
    //padding: 0 2px;
    //border-radius: 5px;

    &:hover {
      text-decoration: underline;
      //background: #eee;
    }
  }
}


</style>