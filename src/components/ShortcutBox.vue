<template>
  <div>
    <v-autocomplete
        v-model="select"
        :items="suggestions"
        :search-input.sync="searchString"
        :filter="(item, queryText, itemText) => true"
        :menu-props="{maxHeight: 600,}"
        item-text="displayValue"
        return-object
        rounded
        :dense="dense"
        filled
        clearable
        hide-no-data
        hide-details
        class="shortcut-box"
        :placeholder="placeholder"
        prepend-inner-icon="mdi-magnify"
        ref="shortcutBox"
        :autofocus="autofocus"
        :loading="isLoading"

        @change="onChange"
        @click:clear="clickClear"
        @keydown.enter="isEnterPressed = true"
        @keyup.enter="onEnterKeyup"
    >
<!--        @blur="clear"-->
      <template v-slot:prepend-inner>
        <v-chip
            v-if="newFilter"
            close
            @click:close="clear"
            class="pa-5"
            style="margin: -9px 0 0 -9px; border-radius: 30px;"
        >
          <v-icon left>
            {{ newFilter.icon }}

          </v-icon>
          {{ newFilter?.displayName }}
        </v-chip>
      </template>


      <template v-slot:item="data">
        <v-list-item-icon>
          <v-icon>{{ data.item.icon }}</v-icon>
        </v-list-item-icon>
        <template v-if="data.item.isFilterLink">
          <v-list-item-content>
            <v-list-item-title>
              <span class="font-weight-bold">{{ data.item.displayValue | capitalize }}</span>
            </v-list-item-title>
            <v-list-item-subtitle>
              Filter by {{ data.item.displayValue }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-icon>
            <v-icon>mdi-filter-plus</v-icon>
          </v-list-item-icon>
        </template>
        <template v-else>
          <v-list-item-content>
            <v-list-item-title
                v-html="$prettyTitle(data.item.displayValue)"
                style="white-space: normal;"
            />
            <v-list-item-subtitle style="white-space: normal;">
              {{ data.item.displayName |capitalize }}
              <span v-if="data.item.hint">
                {{ data.item.hint | truncate(100)}}
              </span>
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action v-if="data.item.entityId" @click="goToEntity(data.item.value)">
            <v-btn icon>
              <v-icon>mdi-information-outline</v-icon>
            </v-btn>
          </v-list-item-action>
          <!--          <v-list-item-action-->
          <!--              v-if="data.item.entityId !== 'works' && data.item.count"-->
          <!--              class=""-->
          <!--          >-->
          <!--            <v-btn-->
          <!--                rounded-->
          <!--                text-->
          <!--                class="font-weight-regular grey&#45;&#45;text"-->
          <!--                @click.stop="viewWorks(data.item.value)"-->
          <!--            >-->
          <!--              {{ data.item.count | toPrecision }} works-->
          <!--            </v-btn>-->
          <!--          </v-list-item-action>-->

        </template>

        <!--        {{ data.item }}-->
      </template>
    </v-autocomplete>
    <!--    <div class="ml-2 mt-2" v-if="showExamples">-->
    <!--      <span>Try:</span>-->
    <!--      <v-chip-->
    <!--          color="white"-->
    <!--          v-for="search in searchesToTry"-->
    <!--          :key="search"-->
    <!--          @click="trySearch(search)"-->
    <!--          class="body-1"-->
    <!--      >-->
    <!--        {{ search }}-->
    <!--      </v-chip>-->
    <!--    </div>-->
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {api} from "@/api";
import {createSimpleFilter, filtersFromUrlStr} from "@/filterConfigs";
import {entityConfigs, externalEntityTypeFromId, getEntityConfig, urlPartsFromId} from "@/entityConfigs";
import {findFacetConfig, findFacetConfigs, getFacetConfig} from "@/facetConfigs";
import {entityTypeFromId, shortenOpenAlexId} from "@/util";

import _ from "lodash"


export default {
  name: "Template",
  components: {},
  props: {
    dense: Boolean,
    showExamples: Boolean,
    autofocus: Boolean,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      searchString: "",
      suggestions: [],
      newFilter: null,
      select: null,
      interval: null,

      isEnterPressed: false,

      selectStorage: null,
      searchesToTry: [
        "Albert Einstein",
        "Solar power",
        "Author",
      ]
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    filterSuggestions() {
      const suggestionsMatchingSearchString = findFacetConfigs(this.entityType, this.searchString)
          .filter(f => {
            return f.actions.includes("filter")
          })
          .map(f => {
            return {
              ...f,
              isFilterLink: true,
              displayValue: f.displayName,
              isDisabled: url.isFilterKeyAvailableToCreate(this.$route, this.entityType, f.key)
            }
          })

      suggestionsMatchingSearchString.sort((a, b)=> {
        return (a.displayName.length > b.displayName.length) ? 1 : -1
      })

      return this.searchString?.length >= 3 ?
          suggestionsMatchingSearchString :
          []
    },
    placeholder() {
      const displayName = this.newFilter?.displayName
      const pluralizedDisplayName = displayName ?
          this.$pluralize(displayName, 2) :
          null
      if (!this.newFilter) {
        return "Search OpenAlex"
      }
      else if (this.newFilter.key === "publication_year") {
        return "Enter year or range of years"
      }
      else if (this.newFilter.type === "range") {
        return "Enter number or range"
      }
      else if (this.newFilter.type === "search") {
        return "Search within " + pluralizedDisplayName
      }
      else {
        return "Search " + pluralizedDisplayName
      }
    },

  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    clear() {
      this.searchString = ""
      this.suggestions = []
      this.newFilter = null

    },
    clickClear(){
      this.suggestions = []
      if (this.searchString){
        this.searchString = ""
      }
      else {
        this.searchString = ""
        this.newFilter = null
      }
    },
    selectFilter(filter) {
      console.log("selectFilter()", filter)
      if (filter.type === "boolean") {
        const oldFilters = url.readFilters(this.$route)
        console.log("push new filter", filter)
        const newFilter = createSimpleFilter(
            this.entityType,
            filter.key,
            true
        )
        filter.value = true
        url.pushNewFilters([
          ...oldFilters,
          newFilter,
        ])
      } else {
        this.newFilter = filter
      }
    },
    onChange(e) {
      console.log('onChange()', e, this.select)
      if (this.select) this.isEnterPressed = false
      if (e?.isFilterLink) this.selectFilter(e)
      else if (e?.value) this.viewWorks(e.value)
      setTimeout(()=> { // no idea why this is necessary but it is
        this.searchString = ""
        this.select = null
        this.suggestions = []
      })
    },
    onEnterKeyup() {
      if (!this.isEnterPressed) return
      if (!this.searchString && this.showExamples) {
        // we're on the landing page or something like it
        url.pushToRoute(this.$router, {name: "Serp", params: {entityType: this.entityType}})
        return
      }

      const filterKey = this.newFilter?.key ?? "default.search"
      url.createFilter(this.entityType, filterKey, this.searchString)
      this.isEnterPressed = false
    },
    submitSearchString() {
      console.log("submitSearchString")
      if (!this.searchString) {
        url.pushToRoute(this.$router, {name: "Serp", params: {entityType: this.entityType}})
      } else {
        const searchFilter = createSimpleFilter(this.entityType, "default.search", this.searchString)
        url.pushNewFilters([
          ...url.readFilters(this.$route),
          searchFilter
        ])
      }
    },
    viewWorks(id) {
      console.log("view my works", id)
      const entityType = entityTypeFromId(id)
      if (!id || !entityType) return

      const filter = createSimpleFilter(
          "works",
          entityConfigs[entityType].filterKey,
          id,
      )
      url.pushNewFilters([
        ...url.readFilters(this.$route),
        filter,
      ])
      this.clear()

    },
    goToEntity(id) {
      console.log("goToEntity()", id)
      url.pushToRoute(this.$router, {
        name: "EntityPage",
        params: urlPartsFromId(id)
      })

    },
    trySearch(str) {
      this.searchString = str
      setTimeout(() => {
        this.$refs.shortcutBox.focus()
      }, 100)
    },

    getSuggestions: _.debounce(async function() {
      this.isLoading = true
      if (this.newFilter && !this.searchString){
        this.suggestions = await api.getGroups(this.entityType, this.newFilter.key)
        this.isLoading = false
        return
      }
      if (!this.newFilter && !this.searchString){
        this.suggestions = [] // doesn't seem to work
        this.isLoading = false
        return // this is very important!!!!
      }
      const apiSuggestions = await api.getSuggestions(
          "works",
          this.newFilter?.key,
          this.searchString,
          url.readFilters(this.$route)
      )
      this.isLoading = false

      const ret = [
        ...(this.newFilter ? [] : this.filterSuggestions),
        ...apiSuggestions,
      ]
      const everySuggestionIsAWork = ret.every(f => f.entityId === "works")
      const cleaned = everySuggestionIsAWork ?
          ret.slice(0, 3) :
          ret.filter(f => f.entityId !== "works").slice(0, 5)

      this.suggestions = cleaned
    }, 100),

    onKeyPress(event) {
      if (event.key !== "/") {
        return;
      }

      if (document.activeElement === this.$refs.shortcutBox) {
        return;
      }

      event.preventDefault();
      this.$refs.shortcutBox.focus();
    }


  },
  created() {
  },
  mounted() {
    window.addEventListener("keypress", this.onKeyPress);
    this.interval = setInterval(()=>{
      if (!this.newFilter && !this.searchString && this.suggestions.length) {
        console.log("setInterval hackily clearing any leftover suggestions")
        this.suggestions = []
      }
    }, 10)
  },
  beforeDestroy() {
    clearInterval(this.interval)
    window.removeEventListener("keypress", this.onKeyPress);
  },
  watch: {
    searchString: function(to) {
      if (this.newFilter && this.newFilter?.type !== "select") return
      this.getSuggestions()
    },
    "$route": {
      handler(to, from) {
        this.clear()
      }
    },
    async select(to) {

    }
  },
}
</script>

<style lang="scss">

.v-autocomplete__content {
  max-width: 400px !important;
}


.shortcut-box {
  .v-input__append-inner:last-of-type {
    display: none !important; // hide the down-caret icon
  }

}

</style>