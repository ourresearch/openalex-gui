<template>
  <div style="width: 100%; position: relative; z-index: 6;" class="filter-bar">
    <!--    {{ focusNumberLine }}-->

    <v-menu
        :close-on-content-click="false"
        rounded
        content-class="filter-bar-menu"
        v-model="isMenuOpen"
        nudge-top="2"
    >
      <template v-slot:activator="{on}">
        <v-btn
            v-on="on"
            rounded
            outlined
            class="font-weight-regular white"
            :class="{'py-7': !dense}"
            :large="dense"
            :x-large="!dense"
            style="width: 100%; border-color: #ccc; cursor: text;"
        >
          <v-icon class="mr-2 ml-2 dark">mdi-magnify</v-icon>
          <span
              class=""
              v-if="searchString"
          >
            {{ searchString }}
          </span>
          <span v-else class="grey--text">
            <template v-if="$route.name === 'Home' && !$vuetify.breakpoint.mobile">
              Search and analyze the world's research ecosystem
            </template>
            <template v-else>
              Search and filter works
            </template>
          </span>
          <v-spacer/>
        </v-btn>
      </template>
      <div style="background: #fff; ">
        <v-progress-linear :height="4" v-if="isLoading"  indeterminate />
        <div v-else style="height: 4px;"></div>
        <v-text-field
            hide-details
            v-model="searchString"
            ref="facetBarSearchBox"
            prepend-inner-icon="mdi-magnify"
            rounded
            :dense="dense"
            outlined
            class="pa-0"
            style="margin: 2px 6px 6px;"
            @keyup.enter="onEnter"
            placeholder="search and filter works"
            autofocus
        />
        <div
            class="px-3 py-3 d-flex"
            v-if="!searchString"
        >
          <div class="mr-2 caption">Try: </div>
          <div>
            <v-chip
                small
                outlined
                label
                v-for="example in exampleSearches"
                :key="example"
                class="mr-1 mb-1"
                @click="searchString = example"
            >
              {{ example }}
            </v-chip>

          </div>

        </div>
        <v-list v-if="autocompleteSuggestions?.length">
          <v-list-item
              v-for="(suggestion, i) in autocompleteSuggestions"
              :key="i"
              class=" suggestion d-flex align-start py-2"
              :class="{'has-focus': myFocusIndex === i}"
              @click="clickSuggestion(suggestion.id)"
          >
            <div>
              <v-icon left>{{ suggestion.icon }}</v-icon>
            </div>
            <div>
              <div class="">
                {{ suggestion.display_name }}
              </div>
              <div class="body-2" style="color: #777;">
                {{ suggestion.hint }}
              </div>
            </div>
            <v-spacer class="mx-2"/>
            <div v-if="suggestion.entity_type === 'work'">
              <v-icon>mdi-arrow-right</v-icon>
            </div>
            <div v-else class="grey--text">
              {{ suggestion.works_count | toPrecision }} works
            </div>

          </v-list-item>
        </v-list>

      </div>
    </v-menu>
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
import {entityTypeFromId, isOpenAlexId, shortenOpenAlexId} from "@/util";

const exampleSearches = [
  "Tim Berners-Lee",
  "Sorbonne",
  "Solar power",
  "doi:10.7717/peerj.4375",
]

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
  props: {
    dense: Boolean,
  },
  data() {
    return {
      foo: 42,
      searchString: "",
      isLoading: false,
      url,
      activeFilterKey: null,
      focusNumberLine: 0,
      myFocusIndex: 0,
      isMenuOpen: false,
      exampleSearches,
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
    },

  },
  asyncComputed: {
    async autocompleteSuggestions() {

      if (!this.searchString) return []


      const myEntityType = (this.entityType === "works") ?
          null :
          this.entityType
      const autocompleteUrl = url.makeAutocompleteUrl(myEntityType, this.searchString)
      this.isLoading = true
      const resp = await api.getUrl(autocompleteUrl)
      this.isLoading = false


      const ret = resp.results
          .filter(r => !!r.id)
          .map(result => {
            const entityConfig = getEntityConfig(result.entity_type)

            const hint = (entityConfig.name === "works") ?
                "Shortcut to work" :
                _.capitalize(entityConfig.displayNameSingular) + " filter"

            // let hint
            // if (result.hint) {
            //   if (entityConfig.name === "works") hint = "Work by " + result.hint
            //
            //   else if (entityConfig.name === "authors") hint = "Author at " + result.hint
            //   else if (entityConfig.name === "sources") hint = "Journal published by " + result.hint
            //   else if (entityConfig.name === "institutions") hint = "Institution in " + result.hint
            //   else if (entityConfig.name === "concepts") hint = result.hint
            //
            //   else hint = _.capitalize(entityConfig.displayNameSingular)
            // } else {
            //   hint = _.capitalize(entityConfig.displayNameSingular) + " filter"
            // }


            return {
              ...result,
              icon: entityConfig.icon,
              hint

            }
          })
      const everySuggestionIsAWork = ret.every(f => f.entity_type === "work")
      const cleaned = everySuggestionIsAWork ?
          ret.slice(0, 3) :
          ret.filter(r => r.entity_type !== "work").slice(0, 5)

      return cleaned

    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    clickSuggestion(id) {
      const entityType = entityTypeFromId(id)
      if (entityType === this.entityType) {
        this.goToEntityPage(id)
      } else {
        this.filterByEntity(id)
      }

    },
    filterByEntity(id) {
      const entityId = shortenOpenAlexId(id)
      const entityType = entityTypeFromId(entityId)
      const filterKey = getEntityConfig(entityType)?.filterKey
      url.upsertFilter(this.entityType, filterKey, id)
    },
    goToEntityPage(id) {
      const entityId = shortenOpenAlexId(id)
      const entityType = entityTypeFromId(entityId)
      this.$router.push({
        name: "EntityPage",
        params: {
          entityType,
          entityId,
        },
      })

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
      } else if (isOpenAlexId(this.searchString)) {
        this.clickSuggestion(this.searchString)
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
    onBlur() {
      setTimeout(() => {
        this.searchString = ""
      })
    },
    onUpArrow() {
      console.log("up arrow")
      this.focusNumberLine--
    },
    onDownArrow() {
      console.log("down arrow")
      this.focusNumberLine++
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    '$route': {
      immediate: true,
      handler(to) {
        this.isMenuOpen = false
        if (to.params?.entityId) {
          this.searchString = "openalex:" + shortenOpenAlexId(to.params.entityId)
        } else {
          this.searchString = ""
          // const searchFilter = url.readFilter(this.entityType, "default.search")
          // this.searchString = searchFilter?.value ?? ""
        }

        // if (!to) return
        // const inputId = "input." + to
        // setTimeout(() => {
        //   // document.getElementById(inputId).focus()
        //
        // }, 0)
      }
    }
  }
}
</script>

<style lang="scss">
.filter-bar-menu {
  &.top {
    top: 5px !important;

  }

  border-radius: 50px !important;
  background: #fff;
}

.filter-bar-suggestions {
  .suggestion {
    cursor: default;
    line-height: 1;

    &:hover {
      background: #fafafa;
    }
  }
}

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