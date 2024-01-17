<template>

  <v-card class="pb-2 color-2" width="100%" rounded flat>
    <!--    <search-bar class="pt-3" />-->
    <v-toolbar flat color=" " class="color-1 mb-3">
      <v-row class="align-center">
        <v-col cols="12" md="8" xl="6" class="d-flex align-center flex-grow-1">
          <v-icon left>mdi-filter-outline</v-icon>
          <v-toolbar-title class="mr-2 ">
            Filters
            <span class="font-weight-light">
            ({{ filters.length }})
            </span>

          </v-toolbar-title>
          <search-bar
              class="flex-grow-1" Ω
              style=""
              v-if="$vuetify.breakpoint.smAndUp"
          />
          <v-spacer v-else/>
          <template v-if="$vuetify.breakpoint.smAndDown">
            <Action
                class="ml-2"
                action="filter"
                @click="(key) => setActiveFilter(key)"
            />
            <v-btn icon @click="clearEverything">
              <v-icon>mdi-filter-off-outline</v-icon>
            </v-btn>
          </template>

        </v-col>
        <v-col v-if="$vuetify.breakpoint.mdAndUp" class="d-flex align-center ">
          <v-spacer/>
          <Action
              class="ml-2"
              action="filter"
              @click="(key) => setActiveFilter(key)"
          />
          <v-btn icon @click="clearEverything">
            <v-icon>mdi-filter-off-outline</v-icon>
          </v-btn>
          <v-btn icon @click="url.pushQueryParam('show_api', !$route.query.show_api)">
            <v-icon>mdi-api</v-icon>
          </v-btn>
        </v-col>
      </v-row>
      <template v-slot:extension v-if="$vuetify.breakpoint.xsOnly">
        <search-bar
            class="flex-grow-1 mb-3"
        />
      </template>

    </v-toolbar>
    <div>
      <!--      <search-bar-->
      <!--          class=""-->
      <!--          style=""-->
      <!--      />-->
    </div>

    <div class="d-flex flex-wrap mb-2   px-4">
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
          style="display: none !important;"
          :is="'filter-phrase-' + activeFilterConfig.type"
          :filter-key="activeFilterConfig.key"
          :is-active="activeFilterConfig.key === activeFilterKey"
          @delete="setActiveFilter(undefined)"
      />
    </div>

    <div class="d-md-flex d-block  align-center px-4">
      <!--      <v-icon left class="">mdi-plus</v-icon>-->
      <!--      <span class="pr-2">Add filter</span>-->
      <div v-if="filters.length < 2" class="caption mr-2">Try:</div>
      <div class="d-flex flex-wrap">
        <v-chip
            v-for="filter in popularFilterOptions"
            :key="filter.key"
            outlined
            class="mr-1 mb-1"
            @click="setActiveFilter(filter)"
            small
            :disabled="filterKeys.includes(filter.key) || activeFilterKey === filter.key"
        >
          <v-icon small left>{{ filter.icon }}</v-icon>
          {{ filter.displayName }}
        </v-chip>
      </div>
      <v-spacer/>


      <!--      <v-btn-->
      <!--          @click="dialogs.moreFilters = true"-->
      <!--          text-->
      <!--          small-->
      <!--          rounded-->
      <!--      >-->
      <!--        All filters-->
      <!--      </v-btn>-->
    </div>

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
              :disabled="url.isFilterApplied($route, entityType, filter.key)"
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
  </v-card>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

import FilterPhraseSearch from "@/components/Filter/FilterSearch.vue";
import FilterPhraseSelect from "@/components/Filter/FilterSelect.vue";
import FilterPhraseRange from "@/components/Filter/FilterRange.vue";
import FilterPhraseBoolean from "@/components/Filter/FilterBoolean.vue";


import {createSimpleFilter, filtersFromUrlStr} from "@/filterConfigs";
import {url} from "@/url";
import {facetConfigs, getFacetConfig} from "@/facetConfigs";
import SerpResultsCount from "@/components/SerpResultsCount.vue";
import ExportButton from "@/components/ExportButton.vue";
import SearchBar from "@/components/SearchBar.vue";
import Action from "@/components/Action/Action.vue";

export default {
  name: "Template",
  components: {
    Action,
    SerpResultsCount,
    SearchBar,
    FilterPhraseSelect,
    FilterPhraseSearch,
    FilterPhraseRange,
    FilterPhraseBoolean,


    ExportButton,
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
      get() {
        return this.$store.state.activeFilterKey
      },
      set(to) {
        this.$store.state.activeFilterKey = to
      }
    },
    activeFilter() {
      return this.activeFilterKey
    },
    newFilterKey() {
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

      // take a key instead of a filter
      if (typeof newFilter === "string" && getFacetConfig(this.entityType, newFilter)) {
        newFilter = getFacetConfig(this.entityType, newFilter)
      }

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
    background: #EEF5FC;
    //border: 1px solid #ddd;

    &:hover {
      //background: #f4f9ff;
      //box-shadow: 5px 5px #000 !important;
    }

  }
}


</style>