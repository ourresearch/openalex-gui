<template>

  <v-card rounded flat class="px-2 pb-2 ">
    <!--    main part of filters list-->
    <div
        flat
        class="d-flex  mb-2 px-4 "
        style="border-radius: 25px !important; border: 3px solid #333;"
        @click="$refs.mainTextarea.focus()"
    >
<!--        style="border-radius: 30px;"-->
      <!--        style="border: 3px solid #ccc;"-->


      <div class="pt-2 pb-1 mr-0">
        <v-icon large class="">mdi-magnify</v-icon>
      </div>
      <div class="d-flex flex-wrap">
        <!--      <v-slide-x-transition group hide-on-leave class="d-flex flex-wrap" v-if="$vuetify.breakpoint.mdAndUp">-->
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
        <v-text-field
            class="grey--text text-h6 font-weight-regular align-self-center internal-search-field"
            autofocus
            filled
            rounded
            dense
            hide-details
            background-color="transparent"
            placeholder="Search"
            v-model="searchString"
            @keydown.enter="submitTextSearch"
            ref="mainTextarea"
        >
        </v-text-field>

      </div>
      <v-spacer/>
      <div class="pt-1">
        <v-btn v-if="filters.length || searchString" large icon @click="clearEverything">
          <v-icon>mdi-close</v-icon>
        </v-btn>

      </div>

    </div>
    <div class="d-md-flex d-block  align-center pt-0">
      <!--      <div v-if="filters.length < 2" class="caption mr-2">Try:</div>-->


      <div class="d-md-flex d-block  align-center pt-2 flex-wrap" style="width: 100%;">
        <template v-for="filter in filterOptions">
          <v-chip
              v-if="!filter.value"
              :key="filter.key +'no-value'"
              class="mr-1 mb-1 "
              outlined
              @click="setActiveFilter(filter)"
              :disabled="filterKeys.includes(filter.key) || activeFilterKey === filter.key"
          >
            <v-icon small left>{{ filter.icon }}</v-icon>
            {{ filter.displayName }}
<!--            <v-icon small right>mdi-plus</v-icon>-->
          </v-chip>

          <v-chip
              v-if="filter.value && filter.isShortcut"
              :key="filter.key + filter.value"
              class="mr-1 mb-1 d-flex"
              color="primary"
              :to="filter.value | entityZoomLink"
              dark
              label
          >
            <v-icon small left>{{ filter.icon }}</v-icon>
            {{ filter.displayName | truncate(100) }}
            <v-spacer/>
            <v-icon small right>mdi-arrow-right</v-icon>
          </v-chip>


          <v-chip
              v-if="filter.value && !filter.isShortcut"
              :key="filter.key + filter.value"
              class="mr-1 mb-1 color-2"
              outlined
              @click="url.upsertFilterOption(entityType, filter.key, filter.value)"

          >
            <v-icon small left>{{ filter.icon }}</v-icon>
            {{ filter.displayName | truncate(100) }}
          </v-chip>

        </template>
        <v-chip
            key="search-filter"
            v-if="searchString?.length >= 3"
            class="mr-1 mb-1"
            outlined
            @click="submitTextSearch"
        >
          <v-icon small left>mdi-text-search</v-icon>
          <span class="mr-1">text</span>
          <q class="">{{ searchString }}</q>
          <span class="grey--text ml-2 text-caption">
            ⏎ ENTER
          </span>
        </v-chip>
        <v-chip
          color="white"
          class="mr-1 mb-1"
          v-if="!searchString?.length"
          key="chip-button-to-show-all-filters"
          @click="dialogs.moreFilters = true"
        >
          <v-icon small left>mdi-dots-horizontal</v-icon>
          More
        </v-chip>
        <v-spacer/>
<!--        <v-btn-->
<!--            text-->
<!--            rounded-->
<!--            key="link-to-all-filters"-->
<!--            v-if="!searchString?.length"-->
<!--            class="mr-1 mb-1"-->
<!--            @click="dialogs.moreFilters = true"-->

<!--        >-->
<!--          <v-icon small left>mdi-filter-outline</v-icon>-->
<!--          All filters-->
<!--        </v-btn>-->

      </div>
    </div>


    <v-dialog
        v-model="dialogs.moreFilters"
        scrollable
        max-width="400"
    >
      <v-card rounded>
        <v-toolbar extended extension-height="60" flat class="color-2">
          <v-toolbar-title>Add filter</v-toolbar-title>
          <v-spacer/>
          <v-btn icon @click="dialogs.moreFilters = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <template v-slot:extension>
            <v-text-field
                v-model="moreFiltersSearchString"
                filled
                rounded
                background-color="white"
                prepend-inner-icon="mdi-magnify"
                class="mx-2 mb-3"
                hide-details
                autofocus
                clearable

            />

          </template>
        </v-toolbar>
        <v-card-text class="pa-0">
          <div class="pa-6 grey--text" v-if="!moreFiltersOptions.length">
            <v-icon left>mdi-magnify-close</v-icon>
            No matching filters
          </div>
          <v-list-item
              v-for="filter in moreFiltersOptions"
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
import ExportButton from "@/components/ExportButtonOld.vue";
import SearchBar from "@/components/SearchBar.vue";
import Action from "@/components/Action/Action.vue";
import {api} from "@/api";
import {getEntityConfig} from "@/entityConfigs";

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
      moreFiltersSearchString: "",
      url,
      dialogs: {
        moreFilters: false
      },
      autocompleteResponses: [],
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    filterOptions() {
      const filtersWithoutValues = this.allFilterOptions.filter(f => {
        if (this.searchString) {
          const filterKeyWords = f.displayName.split(" ").map(w => w.toLowerCase())
          return filterKeyWords.some(w => {
            return w.toLowerCase().indexOf(this.searchString.toLowerCase()) === 0
          })
        } else {
          return f.actionsPopular?.includes("filter")
        }
      })

      const sliceTo = this.searchString ? 5 : 6
      return [
        ...filtersWithoutValues,
        ...this.autocompleteResponses,
      ].slice(0, sliceTo)
    },

    moreFiltersOptions(){
      const mySearchString = this.moreFiltersSearchString?.toString() ?? ""

      return this.allFilterOptions.filter(f => {
          const filterKeyWords = f.displayName.split(" ").map(w => w.toLowerCase())
          return filterKeyWords.some(w => {
            return w.indexOf(mySearchString) === 0
          })
      })
    },

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
      if (!this.searchString) {
        url.deleteAllFilters()
      }
      this.searchString = ""

    },
    submitTextSearch() {
      if (this.searchString) {
        url.upsertFilterOption(this.entityType, 'default.search', this.searchString)
      } else {
        if (this.$route.name !== "Serp") {
          this.$router.push({
            name: "Serp",
            params: {entityType: this.entityType}
          })
        }
      }
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
    },
    async getAutocompleteResponses() {
      if (!this.searchString) {
        this.autocompleteResponses = []
        return
      }

      const myEntityType = (this.entityType === "works") ?
          null :
          this.entityType
      const autocompleteUrl = url.makeAutocompleteUrl(myEntityType, this.searchString)
      this.isLoading = true
      const resp = await api.getUrl(autocompleteUrl)
      this.isLoading = false


      const ret = resp.results
          .filter(r => !!r.id)
          .filter(r => r.entity_type !== "filter")
          .map(result => {
            const entityConfig = getEntityConfig(result.entity_type)
            const filterConfig = getFacetConfig(this.entityType, entityConfig.filterKey)


            return {
              ...filterConfig,
              value: result.id,
              entityType: entityConfig.name,
              isShortcut: entityConfig.name === "works",
              displayName: result.display_name,
              icon: entityConfig.icon,
            }
          })
      const everySuggestionIsAWork = ret.every(f => f.entityType === "works")
      const cleaned = ret.every(r => r.isShortcut) ?
          ret.slice(0, 3) :
          ret.filter(r => !r.isShortcut).slice(0, 5)

      this.autocompleteResponses = cleaned

    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    searchString() {
      this.getAutocompleteResponses()
    },
    "dialogs.moreFilters"(to) {
      if (to) this.moreFiltersSearchString = ""
    },
    '$route': {
      immediate: true,
      handler(to, from) {
        this.activeFilterKey = null
        this.searchString = ""
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

.internal-search-field.v-text-field--rounded > .v-input__control > .v-input__slot {
  padding-left: 0 !important;
}

.filter {
  border-radius: 25px !important;

  &:hover {
    //background: #f4f9ff;
    //box-shadow: 5px 5px #000 !important;
  }

}

.filter-list {
  .v-text-field--rounded > .v-input__control > .v-input__slot {
    //padding: 0 !important;
  }
}


</style>