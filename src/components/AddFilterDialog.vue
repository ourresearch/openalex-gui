<template>
  <v-dialog v-model="isOpen" max-width="600" scrollable>
    <v-card
    >

      <v-toolbar extension-height="60">
        <v-btn icon v-if="selectedFilterKey" @click="selectedFilterKey = null">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-toolbar-title v-else>
          <v-icon left>mdi-filter-plus-outline</v-icon>
          Add Filter
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-tabs
              v-model="tab"
              v-if="!selectedFilterKey"
          >
            <v-tab>
              Search
            </v-tab>
            <v-tab>
              Browse
            </v-tab>
          </v-tabs>

        </v-toolbar-items>
        <template v-slot:extension v-if="!selectedFilterKey && tab !== 1">

          <!--          <div v-else>-->
          <!--            <v-toolbar-title>-->
          <!--              <v-btn-->
          <!--                  icon-->
          <!--                  @click="selectedFilterKey = null"-->
          <!--                  style="margin-left:-10px;"-->
          <!--              >-->
          <!--                <v-icon>mdi-arrow-left</v-icon>-->
          <!--              </v-btn>-->

          <!--              {{ selectedFilterConfig.displayName }}-->
          <!--            </v-toolbar-title>-->
          <!--          </div>-->
          <v-text-field
              v-model="searchString"
              outlined
              hide-details
              autofocus

          />

        </template>
      </v-toolbar>
      <v-tabs-items v-model="tab">
        <v-tab-item>

          <v-card flat tile max-height="70vh" style="overflow-y: scroll;">
            <v-list>
              <!--              <v-subheader v-if="filterOptions.length">Filter options</v-subheader>-->

              <v-list-item
                  v-for="(option, i) in filterOptions"
                  :key="'filterOption-'+i"
                  @click.stop="selectedFilterKey = option.key"
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
                <v-list-item-icon>
                  <v-icon>mdi-chevron-right</v-icon>
                </v-list-item-icon>
              </v-list-item>
            </v-list>

            <v-list>
              <!--              <v-subheader v-if="shortcutOptions.length">Filter shortcuts</v-subheader>-->
              <v-list-item
                  v-for="(option, i) in shortcutOptions"
                  :key="'shortcutOption-'+i"
                  @click.prevent="selectKeyValue(option.filter_key, option.id)"
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
          <filter-key-selector
              @select="(newKey) => selectedFilterKey = newKey"
          />
        </v-tab-item>


        <v-tab-item>
          <template v-if="selectedFilterConfig">
            <add-filter-dialog-select-value
                v-if="selectedFilterConfig.type === 'select'"
                :filter-key="selectedFilterKey"
                :filter-value="filterValueString"
                @select="(newValueStr) => filterValueString = newValueStr"
            />
            <v-card v-else>
              <v-toolbar color="transparent" flat dense>
                <v-icon left>{{ selectedFilterConfig.icon }}</v-icon>
                <v-toolbar-title>
                  {{ selectedFilterConfig.displayName }}
                </v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <v-text-field
                    autofocus
                    v-model="filterValueString"
                    placeholder="Enter filter value"
                    outlined
                    hide-details
                    @keydown.enter="selectKeyValue(selectedFilterKey, filterValueString)"
                />

              </v-card-text>

            </v-card>
          </template>

        </v-tab-item>
      </v-tabs-items>
      <v-card-actions v-if="selectedFilterKey">
        {{ filterValueString }}
        <v-spacer/>
        <v-btn text @click="selectedFilterKey = null">Cancel</v-btn>
        <v-btn
            text
            color="primary"
            :disabled="!filterValueString"
            @click="selectKeyValue(selectedFilterKey, filterValueString)">
          Apply filter
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import filterKeySelector from "./Filters/FilterKeySelector.vue";
import {getEntityConfig} from "../entityConfigs";
import {facetConfigs} from "../facetConfigs";
import axios from "axios";
import AddFilterDialogSelectValue from "./AddFilterDialogSelectValue.vue";

export default {
  name: "Template",
  components: {
    AddFilterDialogSelectValue,
    filterKeySelector,
  },
  props: {
    value: Boolean, // this is the magic Vue "value" property, NOT a filter value
    filterKey: String,
    filters: Array,
  },
  data() {
    return {
      foo: 42,
      tab: 0,
      searchString: "",
      filterValueString: "",
      shortcutOptions: [],
      getEntityConfig,
      selectedFilterKey: this.filterKey,
      selectedFilterValue: "",
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
    selectedFilterConfig() {
      return facetConfigs().find(c => c.key === this.selectedFilterKey)
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
      const searchStringIsLongEnough = this.searchString.length >= 3
      return facetConfigs(this.entityType).filter(config => {

        const configNameLc = config.displayName.toLowerCase()
        const searchNameLc = this.searchString.toLowerCase()
        const nameMatch = configNameLc.includes(searchNameLc)

        return nameMatch && searchStringIsLongEnough
      })
    },
    selectedFilterIsAlreadyApplied() {
      return !!this.filters.find(f => f.key === this.selectedFilterKey)

    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    selectKeyValue(key, value) {
      this.isOpen = false
      this.$emit("select-key-value", key, value)
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
        this.shortcutOptions = resp.data.results
            .filter(o => {
              return !!o.entity_type
            })
            .map(option => {
              if (option.filter_key) return option
              const myFilterKey = getEntityConfig(option.entity_type)?.filterKey
              return {
                ...option,
                filter_key: myFilterKey,
              }

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
    selectedFilterKey(val) {
      if (val) {
        this.tab = 2
        const myAppliedFilterValue = this.filters.find(f => f.key === this.selectedFilterKey)?.value
        this.filterValueString = myAppliedFilterValue
        this.selectedFilterValue = myAppliedFilterValue
      } else {
        this.tab = 0
        this.filterValueString = ""
      }
    },
    value(newVal) {
      console.log("addFilterDialog value change", newVal)
      this.searchString = ""
      this.filterValueString = ""
      this.shortcutOptions = []
      this.tab = 0
      this.selectedFilterKey = null
    }
  }
}
</script>

<style scoped lang="scss">

</style>