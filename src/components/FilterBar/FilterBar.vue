<template>
  <div style="width: 100%; position: relative; z-index: 6;" class="filter-bar">
    <!--    {{ focusNumberLine }}-->

    <v-text-field
        hide-details
        v-model="searchString"
        ref="facetBarSearchBox"
        prepend-inner-icon="mdi-magnify"
        rounded
        outlined
        class="pa-0 ma-0"
        style="font-size: 20px;"
        @keyup.enter="onEnter"
        placeholder="search OpenAlex"
        autofocus
        @keyup.up="onUpArrow"
        @keyup.down="onDownArrow"
    />
    <v-card
        style="position: absolute; width: 100%;"
        v-if="searchString.length"
        class="filter-bar-suggestions"
    >
      <div
          v-for="(suggestion, i) in autocompleteSuggestions"
          :key="i"
          class="py-2 px-2 suggestion d-flex"
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
          <div class="body-2" style="color: #777; font-size: 13px;">{{ suggestion.hint}}</div>
        </div>
      </div>

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
import {entityTypeFromId, shortenOpenAlexId} from "@/util";



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
      focusNumberLine: 0,
      myFocusIndex: 0,
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
      const resp = await api.getUrl(autocompleteUrl)



      const ret = resp.results
          .filter(r => !!r.id)
          .map(result => {
            const entityConfig = getEntityConfig(result.entity_type)

            let hint
            if (result.hint) {
              if (entityConfig.name === "works") hint = "Work by " + result.hint
              else if (entityConfig.name === "authors") hint = "Author at " + result.hint
              else if (entityConfig.name === "sources") hint = "Journal published by " + result.hint
              else if (entityConfig.name === "institutions") hint = "Institution in " + result.hint
              else if (entityConfig.name === "concepts") hint = result.hint
              else hint = _.capitalize(entityConfig.displayNameSingular)
            }
            else {
              hint = _.capitalize(entityConfig.displayNameSingular)
            }


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