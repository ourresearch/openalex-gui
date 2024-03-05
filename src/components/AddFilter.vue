<template>
  <div class="d-flex align-center">
    <template>
      <v-btn v-if="small" icon @click="isDialogOpen = true">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-btn
          v-else
          rounded
          text
          color="primary"
          @click="isDialogOpen = true"
      >
        <v-icon left color="">mdi-filter-menu</v-icon>
        All filters
        <!--        <v-icon color="" class="ml-1">mdi-menu-down</v-icon>-->
      </v-btn>
    </template>

    <template v-if="includeChips">
      <v-chip
          v-for="filter in potentialFiltersPopular"
          :key="filter.id"
          class="ml-2"
          color="white"
          @click="setNewFilterKey(filter.key)"
          :disabled="!url.isFilterKeyAvailableToCreate($route, entityType, filter.key)"
      >
        <v-icon left small>{{ filter.icon }}</v-icon>
        {{ filter.displayName }}
      </v-chip>
      <v-chip color="white" class="ml-2" key="more" @click="isDialogOpen = true">
        <v-icon left small>mdi-dots-horizontal</v-icon>
        more
      </v-chip>
    </template>


    <v-dialog
        v-model="isDialogOpen"
        :fullscreen="$vuetify.breakpoint.mobile"
        width="800"
        scrollable
    >
      <v-card rounded>
        <v-text-field
            v-model="searchString"
            filled
            rounded
            background-color="white"
            :prepend-inner-icon="prependIcon"
            hide-details
            autofocus
            :placeholder="placeholder"
            style=""
            class="add-filter-text-field mr-4 py-3 text-h5 font-weight-regular"
            append-outer-icon="mdi-close"

            @keyup.enter="onEnter"
            @click:append-outer="clickCloseSearch"
            @click:prepend-inner="clickPrependIcon"

        />
        <v-divider/>

        <v-card-text :style="{height: dialogBodyHeight}" class="add-filter-dialog-body pa-0">
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

          <!--          POTENTIAL FILTERS-->
          <div v-else>
            <v-subheader>
              {{ searchString ? "Search results" : "All filters" }}
              ({{ potentialFiltersSearchResults.length }})
            </v-subheader>
            <v-list class="d-flex flex-wrap" nav>
              <v-list-item
                  v-for="filter in potentialFiltersSearchResults"
                  :key="filter.key"
                  @click="setNewFilterKey(filter.key)"
                  :disabled="filter.disabled"
                  style="flex-basis: 250px;"
              >
                <v-list-item-icon>
                  <v-icon :disabled="filter.disabled">{{ filter.icon }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ filter.displayName }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>

      </v-card>

    </v-dialog>


  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs, getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";

import FilterCardRange from "@/components/FilterCard/FilterCardRange.vue";
import FilterCardSearch from "@/components/FilterCard/FilterCardSearch.vue";
import FilterCardSelect from "@/components/FilterCard/FilterCardSelect.vue";

import FilterSelectAddOption from "@/components/Filter/FilterSelectAddOption.vue";
import {createSimpleFilter} from "@/filterConfigs";

export default {
  name: "Template",
  components: {
    FilterCardRange,
    FilterCardSearch,
    FilterCardSelect,
    FilterSelectAddOption,
  },
  props: {
    includeChips: Boolean,
    small: Boolean,
  },
  data() {
    return {
      foo: 42,
      searchString: "",
      isMenuOpen: false,
      isDialogOpen: false,
      newFilterKey: null,
      url,
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
    dialogBodyHeight(){
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
      return this.potentialFilters.filter(f => {
        return f.displayName.toLowerCase().includes(mySearchString)
        // const filterKeyWords = f.displayName.split(" ").map(w => w.toLowerCase())
        // return filterKeyWords.some(w => {
        //   return w.indexOf(mySearchString) === 0
        // })
      })
    },

    newFilterConfig() {
      if (!this.newFilterKey) return
      return getFacetConfig(this.entityType, this.newFilterKey)
    },
    placeholder() {
      const displayName = this.newFilterConfig?.displayName
      const pluralizedDisplayName = displayName ?
          this.$pluralize(displayName, 2) :
          null
      if (!this.newFilterKey) {
        return "Search filters"
      }
      else if (this.newFilterKey === "publication_year") {
        return "Enter year or range of years"
      }
      else if (this.newFilterConfig.type === "range") {
        return "Enter number or range"
      }
      else if (this.newFilterConfig.type === "search") {
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
    onEnter(){
      console.log("onEnter", this.searchString)
      if (["search", "range"].includes(this.newFilterConfig?.type)) {
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
  created() {
  },
  mounted() {
  },
  watch: {
    isDialogOpen(to) {
      if (!to){
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
.add-filter-dialog-body {
  transition: height 300ms !important;
}

</style>