<template>
  <div>
    <v-autocomplete
        v-model="select"
        :items="suggestions"
        item-title="displayValue"
        :search="searchString" @update:search="onSearchInputUpdate"
        :customFilter="(item, queryText, itemText) => true"
        :menu-props="{maxHeight: 600,}"
        return-object
        :density="dense ? 'compact' : undefined"
        variant="solo-filled"
        flat
        rounded="xl"
        clearable
        hide-no-data
        hide-details
        class="shortcut-box"
        :placeholder="placeholder"
        ref="shortcutBoxRef"
        :autofocus="autofocus"
        :loading="isLoading"
        @update:model-value="onChange"
        @click:clear="clickClear"
        @keydown.enter="isEnterPressed = true"
        @keyup.enter="onEnterKeyup"
        @focus="isFocused = true"
        @blur="isFocused = false"
    >
      <template v-slot:prepend-inner>
        <v-icon :color="isFocused ? 'primary' : 'grey'">mdi-magnify</v-icon>
        <v-chip
            v-if="newFilter"
            closable
            @click:close="clear"
            class="pa-5"
            style=" border-radius: 30px;"
        >
          <v-icon start>
            {{ newFilter.icon }}
          </v-icon>
          {{ newFilter?.displayName }}
        </v-chip>
      </template>

      <template v-slot:item="data">
        <v-list-item
          :value="data.item.raw?.value ?? data.item.value"
          active-class="bg-primary-lighten-4"
          :active="data.props.selected"
          @click="onChange(data.item.raw ?? data.item)"
        >
          <template #prepend>
            <v-icon>{{ data.item.raw?.icon ?? data.item.icon }}</v-icon>
          </template>

          <div>
            <!-- Filter link -->
            <template v-if="data.item.raw?.isFilterLink ?? data.item.isFilterLink">
              <v-list-item-title>
                <span class="font-weight-bold">{{ filters.capitalize(data.item.raw?.displayValue ?? data.item.displayValue) }}</span>
              </v-list-item-title>
              <v-list-item-subtitle>
                Filter by {{ data.item.raw?.displayValue ?? data.item.displayValue }}
              </v-list-item-subtitle>
            </template>

            <!-- Default search -->
            <template v-else-if="(data.item.raw?.key ?? data.item.key) === defaultSearchType">
              <v-list-item-title>
                <span class="">Search for</span>
                <span class="mx-2 font-weight-medium">"{{ searchString }}"</span>
                <span class="mr-2">in {{ filters.pluralize(entityType, 1) }} {{ data.item.raw?.displayName ?? data.item.displayName }}</span>
              </v-list-item-title>
              <v-list-item-subtitle>
                press Enter
              </v-list-item-subtitle>
            </template>

            <!-- Entity -->
            <template v-else>
              <v-list-item-title style="white-space: normal;">
                {{ filters.prettyTitle(data.item.raw?.displayValue ?? data.item.displayValue) }}
              </v-list-item-title>
              <v-list-item-subtitle style="white-space: normal;">
                {{ filters.capitalize(data.item.raw?.displayName ?? data.item.displayName) }}
                <span v-if="data.item.raw?.hint ?? data.item.hint">
                  {{ filters.truncate(data.item.raw?.hint ?? data.item.hint) }}
                </span>
              </v-list-item-subtitle>
            </template>
          </div>

          <!-- Info / Filter button -->
          <template #append>
            <v-icon v-if="data.item.raw?.isFilterLink ?? data.item.isFilterLink">
              mdi-filter-plus
            </v-icon>
            <v-btn 
              v-else-if="data.item.raw?.entityId ?? data.item.entityId" 
              icon
              variant="plain"
              @click.stop="goToEntity(data.item.raw?.value ?? data.item.value)"
              tabindex="-1"
            >
              <v-icon>mdi-information-outline</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </template>
    </v-autocomplete>
    <div class="ml-2 mt-2" v-if="showExamples">
      <span class="text-body-2 text-grey">Try:</span>
      <v-btn
          v-for="search in searchesToTry"
          :key="search"
          variant="text"
          class="font-weight-regular"
          @click="trySearch(search)"
      >
        {{ search }}
      </v-btn>
    </div>
  </div>
</template>

<script>
import _ from "lodash"
import {mapGetters} from "vuex";
import {ref} from 'vue';

import {url} from "@/url";
import {api} from "@/api";
import filters from '@/filters';
import {createSimpleFilter} from "@/filterConfigs";
import {entityConfigs, urlPartsFromId} from "@/entityConfigs";
import {findFacetConfigs} from "@/facetConfigs";
import {entityTypeFromId} from "@/util";


export default {
  name: "ShortcutBox",
  components: {},
  props: {
    dense: Boolean,
    showExamples: Boolean,
    autofocus: Boolean,
  },
  setup() {
    const shortcutBoxRef = ref(null);
    return {
      shortcutBoxRef,
    };
  },
  data() {
    return {
      isLoading: false,
      searchString: "",
      suggestions: [],
      newFilter: null,
      select: null,
      interval: null,
      isEnterPressed: false,
      selectStorage: null,
      searchesToTry: [
        "Claudia Goldin",
        "coriander OR cilantro",
        "Institution",
      ],
      isProgrammaticInput: false,
      isFocused: false,
      filters,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    cleanedSearchString() {
      return this.searchString ? this.searchString .replace(/[,:]/g, "") : this.searchString
    },
    defaultSearchType() {
      return this.entityType === "works" ? "title_and_abstract.search" : "default.search";
    },
    filterSuggestions() {
      const suggestionsMatchingSearchString = findFacetConfigs(this.entityType, this.searchString)
          .filter(f => {
            return f.actions?.includes("filter")
          })
          .map(f => {
            return {
              ...f,
              isFilterLink: true,
              displayValue: f.displayName,
              isDisabled: url.isFilterKeyAvailableToCreate(this.$route, this.entityType, f.key)
            }
          })

      suggestionsMatchingSearchString.sort((a, b) => {
        return (a.displayName.length > b.displayName.length) ? 1 : -1
      })

      return this.searchString?.length >= 3 ?
          suggestionsMatchingSearchString :
          []
    },
    placeholder() {
      const displayName = this.newFilter?.displayName
      const pluralizedDisplayName = displayName ?
          filters.pluralize(displayName, 2) :
          null
      if (!this.newFilter) {
        return this.entityType === 'works' ? "Search OpenAlex" : "Search " + this.entityType
      } else if (this.newFilter.key === "publication_year") {
        return "Enter year or range of years"
      } else if (this.newFilter.type === "range") {
        return "Enter number or range"
      } else if (this.newFilter.type === "search") {
        return "Search within " + pluralizedDisplayName
      } else {
        return "Search " + pluralizedDisplayName
      }
    },
  },
  methods: {
    clear() {
      this.searchString = ""
      this.suggestions = []
      this.newFilter = null
    },
    clickClear() {
      this.suggestions = []
      if (this.searchString) {
        this.searchString = ""
      } else {
        this.searchString = ""
        this.newFilter = null
      }
    },
    selectFilter(filter) {
      if (filter.type === "boolean") {
        const oldFilters = url.readFilters(this.$route)
        //console.log("push new filter", filter)
        const newFilter = createSimpleFilter(
            "works",
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
    onChange(myFilterData) {
      if (this.isProgrammaticInput) return;
      if (!myFilterData) return; // Don't clear if nothing was selected!
      //console.log('onChange()', myFilterData, this.select)
      if (this.select) this.isEnterPressed = false
      if (myFilterData.key === this.defaultSearchType) {
        this.submitSearchString()
      }
      else if (myFilterData?.isFilterLink) {
        this.selectFilter(myFilterData)
      }
      else if (myFilterData?.value) {
        url.pushNewFilters([
          ...url.readFilters(this.$route),
          myFilterData,
        ])
        this.clear()
      }

      setTimeout(() => {
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

      const filterKey = this.newFilter?.key ?? this.defaultSearchType
      //console.log("onEnterKeyup()", filterKey, this.cleanedSearchString)
      url.createFilter(this.entityType, filterKey, this.cleanedSearchString)
      this.isEnterPressed = false
    },
    submitSearchString() {
      if (!this.searchString) {
        url.pushToRoute(this.$router, {name: "Serp", params: {entityType: this.entityType}})
      } else {
        const searchFilter = createSimpleFilter(this.entityType, this.defaultSearchType, this.cleanedSearchString)
        url.pushNewFilters([
          ...url.readFilters(this.$route),
          searchFilter
        ])
      }
    },
    viewWorks(id) {
      //console.log("view my works", id)

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
      this.isProgrammaticInput = true;      
      // Clear any existing suggestions first
      this.suggestions = [];
      // Set both select and searchString to ensure proper display
      this.select = str;
      this.searchString = str;
      
      this.$nextTick(async () => {
        if (this.shortcutBoxRef) {
          this.shortcutBoxRef.focus();
          // Force update the input value
          const input = this.shortcutBoxRef.$el.querySelector('input');
          if (input) {
            input.value = str;
          }
          
          // Manually trigger the search for suggestions
          if (this.searchString && this.searchString.length > 0) {
            await this.getSuggestions();
          }
        }
        this.isProgrammaticInput = false;
      });
    },
    onSearchInputUpdate(val) {
      this.searchString = val;
      // Only trigger suggestions if not selecting from autocomplete
      if (this.newFilter && this.newFilter?.type !== "select") return;
      if (this.searchString && this.searchString.length > 0) {
        this.getSuggestions();
      } else {
        this.suggestions = [];
      }
    },
    getSuggestions: _.debounce(async function () {
      const fulltextSearchFilter = createSimpleFilter(this.entityType, this.defaultSearchType, this.cleanedSearchString)

      // lol hack much?
      if (this.searchString === "coriander OR cilantro") {
        this.suggestions = [fulltextSearchFilter]
        return
      }

      this.isLoading = true

      // if a filter is selected but no search yet, show the available options
      if (this.newFilter && !this.searchString) {
        this.suggestions = await api.getGroups(this.entityType, this.newFilter.key)
        this.isLoading = false
        return
      }

      // if the search is empty, clear everything and leave
      if (!this.newFilter && !this.searchString) {
        this.suggestions = [] // doesn't seem to work
        this.isLoading = false
        return // this is very important!!!!
      }

      const apiSuggestions = await api.getSuggestions(
        this.entityType,
          // "works",
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

      if (!this.newFilter) {
        cleaned.push(fulltextSearchFilter)
      }
      console.log("cleaned suggestions", cleaned)
      this.suggestions = cleaned
    }, 100),
  },
  mounted() {
    window.addEventListener("keypress", this.onKeyPress);
    this.interval = setInterval(() => {
      if (!this.newFilter && !this.searchString && this.suggestions.length) {
        //console.log("setInterval hackily clearing any leftover suggestions")
        this.suggestions = []
      }
    }, 10)
  },
  beforeUnmount() {
    clearInterval(this.interval)
    window.removeEventListener("keypress", this.onKeyPress);
  },
  watch: {
    searchString: function (to) {
      if (to === null || to === undefined) {
        return;
      }
      
      if (this.newFilter && this.newFilter.type && this.newFilter.type !== "select") {
        return;
      }
      
      this.getSuggestions();
    },
    "$route": {
      handler() {
        this.clear()
      }
    },
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