<template>
  <div>
    <v-menu location="top left" :offset="[-60, 0]" location-strategy="connected" close-on-content-click="false">
      <template v-slot:activator="{props}">
        <v-fab-transition>
          <v-btn
              v-if="isFabShowing"
              v-bind="props"
              icon
              size="large"
              color="primary"
              class="rounded-circle"
          >
            <v-icon>mdi-plus-thick</v-icon>
          </v-btn>
        </v-fab-transition>
      </template>

      <v-card class="add-filter-menu-card rounded-o pr-5">
        <v-text-field
          v-model="searchString"
          variant="default"
          rounded="xl"
          bg-color="white"
          prepend-inner-icon="mdi-magnify"
          hide-details
          autofocus
          placeholder="Search all filters"
          @keyup.enter="onEnter"
        />
        <v-divider/>
        <v-list v-if="searchString">
          <v-list-item
              v-for="filter in potentialFiltersSearchResults"
              :key="filter.key"
              @click="setNewFilterKey(filter.key)"
              :disabled="filter.disabled"
          >
            <template #prepend>
              <v-icon :disabled="filter.disabled">{{ filter.icon }}</v-icon>
            </template>
            <v-list-item-title>
              {{ filters.titleCase(filter.displayName) }}
            </v-list-item-title>        
          </v-list-item>
        </v-list>

        <v-list v-if="!searchString">
          <v-list-item
              v-for="filter in potentialFiltersPopular"
              :key="filter.key"
              @click="setNewFilterKey(filter.key)"
              :disabled="filter.disabled"
          >
            <template #prepend>
              <v-icon :disabled="filter.disabled">{{ filter.icon }}</v-icon>
            </template>
            <v-list-item-title>
              {{ filters.titleCase(filter.displayName) }}
            </v-list-item-title>
          </v-list-item>
          <v-divider/>
          <v-list-item
              key="more-filters"
              @click="isDialogOpen = true"
          >
            <template #prepend>
              <v-icon>mdi-dots-horizontal</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">
              More
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>

    <v-dialog
      v-model="isDialogOpen"
      width="800"
      scrollable
    >
      <v-card class="rounded-o">
        <v-text-field
            v-model="searchString"
            variant="default"
            bg-color="white"
            :prepend-inner-icon="prependIcon"
            hide-details
            autofocus
            :placeholder="placeholder"
            style=""
            class="add-filter-text-field mr-4 py-3 text-lg-h5 font-weight-regular"
            append-icon="mdi-close"
            @keyup.enter="onEnter"
            @click:append="clickCloseSearch"
            @click:prepend-inner="clickPrependIcon"
        />
        <v-divider/>

        <v-card-text :style="{height: dialogBodyHeight}" class="add-filter-dialog-body pa-0">
          <!-- Filter selected, user entering value -->
          <div v-if="newFilterKey" class="">
            <filter-card-range v-if="newFilterConfig.type === 'range'" :filter-key="newFilterKey"/>
            <filter-card-search v-if="newFilterConfig.type === 'search'" :filter-key="newFilterKey"/>
            <filter-select-add-option
                v-if="newFilterConfig.type === 'select'"
                :filter-key="newFilterKey"
                :is-open="isMenuOpen"
                :search-string="searchString"
                :filters="url.readFilters($route)"
            />
          </div>

          <!-- No filter selected yet, what are my options? -->
          <div v-else>
            <v-list-subheader class="pl-5">
              {{ searchString ? "Search results" : "All filters" }}
              ({{ potentialFiltersSearchResults.length }})
            </v-list-subheader>
            <v-list class="d-flex flex-wrap" nav>
              <v-list-item
                  v-for="filter in potentialFiltersSearchResults"
                  :key="filter.key"
                  @click="setNewFilterKey(filter.key)"
                  :disabled="filter.disabled"
                  style="        
                    flex: 0 1 250px; 
                    min-width: 0;
                    align-items: flex-start;"
              >
                <template #prepend> 
                  <v-icon :disabled="filter.disabled">{{ filter.icon }}</v-icon>
                </template>
                <v-list-item-title class="filter-list-item-title">
                  {{ filters.titleCase(filter.displayName) }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>

import {mapGetters} from "vuex";

import {facetConfigs, getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";
import filters from "@/filters";
import {createSimpleFilter} from "@/filterConfigs";

import FilterCardRange from "@/components/FilterCard/FilterCardRange.vue";
import FilterCardSearch from "@/components/FilterCard/FilterCardSearch.vue";
import FilterSelectAddOption from "@/components/Filter/FilterSelectAddOption.vue";


export default {
  name: "AddFilter",
  components: {
    FilterCardRange,
    FilterCardSearch,
    FilterSelectAddOption,
  },
  props: {
    includeChips: Boolean,
  },
  data() {
    return {
      searchString: "",
      isMenuOpen: false,
      isDialogOpen: false,
      newFilterKey: null,
      isFabShowing: false,
      url,
      filters,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    dialogBodyHeight() {
      const fullHeight = !this.newFilterKey || this.newFilterConfig.type === "select"
      return fullHeight ? "80vh" : 0
    },
    prependIcon() {
      return this.newFilterKey ?
          "mdi-arrow-left" :
          "mdi-magnify"
    },
    potentialFilters() {
      return facetConfigs(this.entityType)
          .filter(conf => conf.actions?.includes("filter"))
          .map(f => {
            return {
              ...f,
              disabled: !url.isFilterKeyAvailableToCreate(this.$route, this.entityType, f.key)
            }
          })
    },
    potentialFiltersPopular() {
      return this.potentialFilters.filter(f => f.actionsPopular?.includes("filter"))
    },
    potentialFiltersMore() {
      return this.potentialFilters.filter(f => !f.actionsPopular?.includes("filter"))
    },
    potentialFiltersSearchResults() {
      const mySearchString = this.searchString?.toString()?.toLowerCase() ?? ""
      //console.log("mySearchString " + mySearchString)
      const filters = this.potentialFilters.filter(f => {
        return f.displayName.toLowerCase().includes(mySearchString)
      })
      //console.log("potentialFilters:")
      //console.log(this.potentialFilters)
      //console.log("filteredFilters:")
      //console.log(filters)
      return filters
    },
    newFilterConfig() {
      if (!this.newFilterKey) return
      return getFacetConfig(this.entityType, this.newFilterKey)
    },
    placeholder() {
      const displayName = this.newFilterConfig?.displayName
      const pluralizedDisplayName = displayName ?
          filters.pluralize(displayName, 2) :
          null
      if (!this.newFilterKey) {
        return "Search all filters"
      } else if (this.newFilterKey === "publication_year") {
        return "Enter year or range of years"
      } else if (this.newFilterConfig.type === "range") {
        return "Enter number or range"
      } else if (this.newFilterConfig.type === "search") {
        return "Search within " + pluralizedDisplayName
      } else {
        return "Search " + pluralizedDisplayName
      }
    },
  },
  methods: {
    onEnter() {
      console.log("onEnter", this.searchString, this.entityType)
      if (["search", "range"].includes(this.newFilterConfig?.type) && this.searchString) {
        url.createFilter(this.entityType, this.newFilterKey, this.searchString)
      }
    },
    setNewFilterKey(filterKey) {
      console.log("AddFilter setNewFilterKey", filterKey)

      const myConfig = getFacetConfig(this.entityType, filterKey)
      if (myConfig.type === "boolean") {
        const oldFilters = url.readFilters(this.$route)
        const newFilter = createSimpleFilter(
            this.entityType,
            filterKey,
            true
        )
        url.pushNewFilters([
          ...oldFilters,
          newFilter,
        ])

      } else {
        this.newFilterKey = filterKey
        if (filterKey) this.isDialogOpen = true
      }
      // this.isMenuOpen = false
      // this.$emit("select", filterKey)
    },
    clickCloseSearch() {
      console.log("clickCloseSearch()")
      this.searchString ?
          this.searchString = "" :
          this.closeDialog()
    },
    closeDialog() {
      this.searchString = ""
      this.isDialogOpen = false
      this.newFilterKey = null
    },
    clickPrependIcon() {
      if (this.newFilterKey) {
        this.newFilterKey = null
        this.searchString = ""
      }
    }
  },
  mounted() {
    setTimeout(()=> {
      this.isFabShowing = true
    }, 1)
  },
  watch: {
    isDialogOpen(to) {
      if (!to) {
        this.searchString = ""
        this.newFilterKey = null
      }

      setTimeout(() => {
      }, 10)
    },
    newFilterKey() {
      this.searchString = ""
    },
    "$route": {
      deep: true,
      handler() {
        this.closeDialog()
      }
    }
  }
}
</script>


<style lang="scss">
.add-filter-menu-card {
  width: auto;
}
.add-filter-dialog-body {
  transition: height 300ms !important;
}
.v-list-item-title.filter-list-item-title {
  font-weight: normal !important;
  font-size: 16px !important;
  white-space: normal;
  overflow-wrap: break-word;
}
</style>