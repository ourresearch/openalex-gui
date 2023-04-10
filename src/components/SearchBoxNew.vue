<template>
  <div>
    <v-menu :value="!!searchString" offset-y content-class="no-highlight" min-width="150">
      <template v-slot:activator="{on}">
        <v-text-field
            v-on="on"
            v-model="searchString"
            class="mr-12"
            solo
            dense
            hide-details
            clearable
            append-icon="mdi-magnify"
            rounded
            style="width: 100%;"
            placeholder="Search filters"
            @change="setSearch"
        />
      </template>
      <v-list v-if="!!searchString">
        <v-list-item @click="setSearch">
          <v-list-item-icon>
            <v-icon>mdi-magnify</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              "{{ searchString }}"
            </v-list-item-title>
            <v-list-item-subtitle>
              Title search
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-chip sm outlined style="border-radius: 5px">
              ⏎ Enter
            </v-chip>
          </v-list-item-action>
        </v-list-item>
        <v-divider></v-divider>

        <v-list-item
            @click="setFilter(suggestion)"
            v-for="suggestion in filterSuggestions"
            :key="suggestion.id"
        >
          <v-list-item-icon>
            <v-icon>{{ suggestion.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              <div class="text-wrap">
              {{ suggestion.displayValue }}

              </div>
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ suggestion.displayName }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import axios from "axios";
import {createSimpleFilter, createDisplayFilter} from "@/filterConfigs";
import {entityConfigs} from "@/entityConfigs";
import {url} from "@/url";

export default {
  name: "SearchBoxNew",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
      searchString: "",

    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    autocompleteUrl() {
      const url = new URL("https://api.openalex.org")
      url.pathname = "autocomplete"

      url.searchParams.set("email", "team@ourresearch.org")
      url.searchParams.set("q", this.searchString)
      return url.toString()
    },
    isOpen: {
      get() {
        if (!this.$vuetify.breakpoint.mobile) return true
        return this.$store.state.showFiltersDrawer
      },
      set(val) {
        if (!this.$vuetify.breakpoint.mobile) return // you can't falsify isOpen on desktop
        this.$store.state.showFiltersDrawer = val
      },
    },
  },
  asyncComputed: {
    async filterSuggestions() {
      if (!this.searchString) return []

      const resp = await axios.get(this.autocompleteUrl)
      console.log("filterSuggestsion() results", resp)
      // return resp.data.results

      return resp.data.results.map(r => {
        const pluralEntityName = this.$pluralize(r.entity_type, 2)
        const myEntityConfig = entityConfigs[pluralEntityName]

        return createDisplayFilter(
            "works",
            myEntityConfig.filterKey,
            r.id,
            false,
            r.display_name,
        )
      })

    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    setFilter(filter) {
      console.log("setFilter")

      url.setFilters("works", [...this.resultsFilters, filter], false)
      this.searchString = ""
    },
    setSearch() {
      const filter = createSimpleFilter(
          "works",
          "title.search",
          this.searchString
      )
      url.setFilters("works", [...this.resultsFilters, filter], false)

      // console.log("setSearch")
      // url.setSearch(this.entityType, this.searchString)
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">

</style>