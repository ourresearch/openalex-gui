<template>
  <v-dialog v-model="isOpen" max-width="600" scrollable>
    <v-card>
      <v-toolbar>
        <v-icon class="pr-3">mdi-filter-plus-outline</v-icon>
        <v-tabs
            v-model="tab"
        >
          <v-tab>
            Search
          </v-tab>
          <v-tab>
            Browse
          </v-tab>
        </v-tabs>
      </v-toolbar>
      <v-tabs-items v-model="tab">
        <v-tab-item>
          <v-text-field
              v-model="searchString"
              outlined
              hide-details
          />
          <v-card flat tile max-height="70vh" style="overflow-y: scroll;">
            <v-list>
              <v-subheader>Filter options</v-subheader>
              <v-list-item
                  v-for="(option, i) in filterOptions"
                  :key="'filterOption-'+i"
                  @click="select(option)"
              >
                <v-list-item-icon>
                  <v-icon>
                    {{ option.icon }}
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ option.displayName }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ option.type }} filter
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>

            <v-list>
              <v-subheader>Filter shortcuts</v-subheader>
              <v-list-item
                  v-for="(option, i) in shortcutOptions"
                  :key="'shortcutOption-'+i"
                  @click="select(option)"
              >
                <v-list-item-icon>
                  <v-icon>
                    {{ getEntityConfig(option.entity_type).icon }}
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>
                    <span class="text-capitalize">{{ option.entity_type }}: </span>
                    {{ option.display_name }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <span v-if="option.hint">{{ option.hint | truncate(50) }}</span>
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action-text>
                  {{ option.works_count | toPrecision }} works
                </v-list-item-action-text>
              </v-list-item>
            </v-list>

          </v-card>
        </v-tab-item>
        <v-tab-item>
          tab two
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </v-dialog>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import filterKeySelector from "./Filters/FilterKeySelector.vue";
import {getEntityConfig} from "../entityConfigs";
import {facetConfigs} from "../facetConfigs";
import axios from "axios";

export default {
  name: "Template",
  components: {},
  props: {
    value: Boolean,
  },
  data() {
    return {
      foo: 42,
      tab: 0,
      searchString: "",
      shortcutOptions: [],
      getEntityConfig,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    isOpen: {
      get() {
        return this.value
      },
      set(newVal) {
        this.$emit("close")
      }
    },
    autocompleteUrl() {
      const url = new URL("https://api.openalex.org")
      url.pathname = (this.entityType === "works") ?
          "autocomplete" :
          `autocomplete/${this.entityType}`

      url.searchParams.set("email", "team@ourresearch.org")
      url.searchParams.set("q", this.searchString)
      return url.toString()
    },
    filterOptions() {
      return facetConfigs(this.entityType).filter(config => {
        const configNameLc = config.displayName.toLowerCase()
        const searchNameLc = this.searchString.toLowerCase()
        const nameMatch = configNameLc.includes(searchNameLc)

        return nameMatch
      })
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    select(option) {
      console.log("AddFilterDialog select", option)
    },
    async fetchSuggestions() {
      if (!this.searchString) {
        this.shortcutOptions = []
        return
      }
      // this.isFetchingItems = true
      const resp = await axios.get(this.autocompleteUrl)
      if (!this.searchString) {
        console.log("no search string, clearing items")
        this.shortcutOptions = []
      } else {
        this.shortcutOptions = resp.data.results.filter(o => {
          return !!o.entity_type
        })
        //
        // let shortcutOptions = resp.data.results.map(r => {
        //   return (this.selectedEntityType === 'works') ? r.phrase : r.display_name
        // })
        // const uniqueItems = [...new Set(items)]
        // this.items = uniqueItems.slice(0, 5)
      }
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    searchString(val) {
      if (!val) this.items = []
      this.fetchSuggestions(val)
    },
  }
}
</script>

<style scoped lang="scss">

</style>