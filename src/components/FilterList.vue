<template>
  <div class=" filter-list">

<!--    <div class="d-flex py-1 px-3 align-center">-->
<!--      <div class="text-h6">-->
<!--        {{ filters.length }} {{ "Filter" | pluralize(filters.length) }}-->
<!--        <v-btn text small rounded @click="clearEverything" :disabled="!filters.length">-->
<!--          (clear all)-->
<!--        </v-btn>-->
<!--      </div>-->
<!--    </div>-->
<!--      <v-divider/>-->

    <v-container class="ml-0 main-serp-container">
      <div class="d-flex flex-wrap">
        <component
            v-for="(filter, i) in filters"
            :key="filter.key + $route.query.filter"
            class="d-block"
            :is="'filter-phrase-' + filter.type"
            :filter-key="filter.key"
            :is-active="filter.key === activeFilterKey"
            @delete="url.deleteFilter(entityType, filter.key)"
        />
        <component
            v-if="newFilterKey"
            :key="'new' + activeFilterConfig.key + $route.query.filter"
            class="d-none"
            :is="'filter-phrase-' + activeFilterConfig.type"
            :filter-key="activeFilterConfig.key"
            :is-active="activeFilterConfig.key === activeFilterKey"
            @delete="setActiveFilter(undefined)"
        />
      </div>

    </v-container>
    <v-divider  />

    <v-container class="d-flex pt-2 pl-2 main-serp-container">
      <!--      <v-icon left class="">mdi-plus</v-icon>-->
      <!--      <span class="pr-2">Add filter</span>-->
      <v-chip
          v-for="filter in popularFilterOptions"
          :key="filter.key"
          outlined
          label
          class="mr-1"
          @click="setActiveFilter(filter)"
          small
          :disabled="filterKeys.includes(filter.key) || activeFilterKey === filter.key"
      >
        {{ filter.displayName }}
      </v-chip>

      <v-btn
          @click="dialogs.moreFilters = true"
          text
          small
          rounded
      >
        More...
      </v-btn>
    </v-container>

    <v-dialog
        v-model="dialogs.moreFilters"
        scrollable
        max-width="400"
    >
      <v-card rounded>
        <v-toolbar flat>
          <v-toolbar-title>More Filter options</v-toolbar-title>
          <v-spacer/>
          <v-btn icon @click="dialogs.moreFilters = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-divider/>
        <v-card-text class="pa-0">
          <v-list-item
              v-for="filter in allFilterOptions"
              :key="filter.key"
              color="primary"
              :disabled="url.isFilterApplied(entityType, filter.key)"
              @click="setActiveFilter(filter)"
          >
            <v-list-item-icon>
              <v-icon>{{ filter.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ filter.displayName }}
              </v-list-item-title>
            </v-list-item-content>
            <!--            <v-icon left>mdi-check</v-icon>-->
          </v-list-item>

        </v-card-text>
      </v-card>
    </v-dialog>


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

import NewFilter from "@/components/NewFilter/NewFilter.vue";

import {createSimpleFilter, filtersFromUrlStr} from "@/filterConfigs";
import {url} from "@/url";
import {api} from "@/api";
import {getEntityConfig} from "@/entityConfigs";
import {facetConfigs, getFacetConfig} from "@/facetConfigs";
import {shortenOpenAlexId} from "@/util";
import FilterBar from "@/components/FilterBar/FilterBar.vue";

export default {
  name: "Template",
  components: {
    FilterBar,
    FilterPhraseSelect,
    FilterPhraseSearch,
    FilterPhraseRange,
    FilterPhraseBoolean,

    FilterBarSearch,
    FilterBarSuggestions,

    NewFilter,
  },
  props: {},
  data() {
    return {
      foo: 42,
      searchString: "",
      url,
      dialogs: {
        moreFilters: false
      },
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),

    filters() {
      return filtersFromUrlStr(this.entityType, this.$route.query.filter).filter(f => {
        return true
      })
    },
    filterKeys() {
      return this.filters.map(f => f.key)
    },
    activeFilterKey: {
      get(){
        return this.$store.state.activeFilterKey
      },
      set(to){
        this.$store.state.activeFilterKey = to
      }
    },
    activeFilter() {
      return this.activeFilterKey
    },
    newFilterKey(){
      return this.activeFilterKey && !this.filterKeys.includes(this.activeFilterKey)
    },
    creatingNewFilter() {
      const appliedFilterKeys = this.filters.map(f => f.key)
      return this.activeFilter && !appliedFilterKeys.includes(this.activeFilter)
    },
    activeFilterConfig() {
      if (!this.activeFilterKey) return
      return getFacetConfig(this.entityType, this.activeFilterKey)
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
    },
    addFilterOptions() {
      return []
    },
    popularFilterOptions() {
      return facetConfigs(this.entityType)
          .filter(conf => conf.actionsPopular?.includes("filter"))
      // .filter(f => !this.filterKeys.includes(f.key))
    },
    allFilterOptions() {
      return facetConfigs(this.entityType)
          .filter(conf => conf.actions?.includes("filter"))

    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    clearEverything() {
      this.activeFilterKey = null
      this.searchString = ""
      url.deleteAllFilters()

    },
    setActiveFilter(newFilter) {
      console.log("select filter", newFilter)
      this.dialogs.moreFilters = false
      if (!newFilter) {
        this.activeFilterKey = null
        return
      }
      if (newFilter.type === "boolean") {
        url.upsertFilter(this.entityType, newFilter.key, true)
      } else {

        this.activeFilterKey = newFilter.key
      }
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    '$route': {
      immediate: true,
      handler(to, from) {
        this.activeFilterKey = null
      }
    },
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
.filter-list {
  .v-text-field--rounded > .v-input__control > .v-input__slot {
    //padding: 0 !important;
  }

  .filter {
    //font-size: 20px;
    //background: #f5f5f5;
    //background: #eee;
    //background: #fff;
    background: #F3F7FF;
    //border: 1px solid #ddd;

    &:hover {
      background: #f4f9ff;
      //box-shadow: 5px 5px #000 !important;
    }

  }
}


</style>