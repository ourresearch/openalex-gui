<template>
  <div>
    <v-menu
        rounded
        key="new-filter-add-button"
        max-width="300"
        max-height="400"
        content-class="add-filter-menu"
        v-model="isMenuOpen"
    >
      <template v-slot:activator="{on}">
        <v-btn
            rounded
            color="primary"
            key="asdfasdrasdf"
            class="mt-2"
            v-on="on"
        >
          <v-icon color="" class="mr-3">mdi-plus-thick</v-icon>
          Add filter
          <v-icon color="" class="ml-1">mdi-menu-down</v-icon>
        </v-btn>
      </template>
      <v-card flat max-height="400">
        <v-text-field
            v-model="searchString"
            filled
            rounded
            background-color="white"
            prepend-inner-icon="mdi-magnify"
            hide-details
            autofocus
            clearable
            placeholder="Add filter"
            style=""
            class="add-filter-text-field"
        />
        <v-divider/>
        <v-card flat max-height="340" style="overflow-y: scroll">
          <v-list v-if="searchString">
            <v-subheader>Search results ({{ potentialFiltersSearchResults.length }})</v-subheader>
            <v-list-item
                v-for="filter in potentialFiltersSearchResults"
                :key="filter.key"
                @click="setNewFilterKey(filter.key)"
                :disabled="filter.disabled"
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
          <v-list v-else>
            <v-subheader>Popular filters ({{ potentialFiltersPopular.length }})</v-subheader>
            <v-list-item
                v-for="filter in potentialFiltersPopular"
                :key="filter.key"
                @click="setNewFilterKey(filter.key)"
                :disabled="filter.disabled"
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
            <v-subheader>More filters ({{ potentialFiltersPopular.length }})</v-subheader>
            <v-list-item
                v-for="filter in potentialFiltersMore"
                :key="filter.key"
                color="primary"
                @click="setNewFilterKey(filter.key)"
                :disabled="filter.disabled"
            >
              <v-list-item-icon>
                <v-icon :disabled="filter.disabled">{{ filter.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ filter.displayName }}
                  <!--                <span v-if="filter.disabled">(applied)</span>-->
                </v-list-item-title>
              </v-list-item-content>
              <!--            <v-icon left>mdi-check</v-icon>-->
            </v-list-item>


          </v-list>
        </v-card>
      </v-card>
    </v-menu>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "@/facetConfigs";
import {url} from "@/url";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
      searchString: "",
      isMenuOpen: false,

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
      const mySearchString = this.searchString?.toString() ?? ""
      return this.potentialFilters.filter(f => {
        const filterKeyWords = f.displayName.split(" ").map(w => w.toLowerCase())
        return filterKeyWords.some(w => {
          return w.indexOf(mySearchString) === 0
        })
      })
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    setNewFilterKey(filterKey) {
      console.log("AddFilter setNewFilterKey", filterKey)
      this.isMenuOpen = false
      this.$emit("select", filterKey)
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isMenuOpen(){
      this.searchString = ""
    }
  }
}
</script>

<style lang="scss">
.add-filter-menu {
}

</style>