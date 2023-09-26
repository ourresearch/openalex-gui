<template>
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
            <v-list dense>
              <template v-if="filterOptions.length">
                <v-subheader>Filter options</v-subheader>
                <v-divider/>
              </template>


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
                  <!--                  <v-list-item-subtitle>-->
                  <!--                    {{ option.type }} filter-->
                  <!--                  </v-list-item-subtitle>-->
                </v-list-item-content>
                <v-list-item-icon>
                  <v-icon>mdi-chevron-right</v-icon>
                </v-list-item-icon>
              </v-list-item>

              <template v-if="shortcutOptions.length">
                <v-subheader>Filter values</v-subheader>
                <v-divider/>
              </template>
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
                    {{ option.display_name }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-capitalize">
                    {{ option.entity_type }}
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
        <component
            class=""
            v-if="selectedFilterKey"
            :is="'filter-edit-' + selectedFilterConfig.type"
            :filter-key="selectedFilterConfig.key"
            @update="(newValue) => $emit('create', selectedFilterConfig.key, newValue)"
        />

        </v-tab-item>
      </v-tabs-items>

    </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import filterKeySelector from "./Filters/FilterKeySelector.vue";
import {getEntityConfig} from "../entityConfigs";
import {facetConfigs} from "../facetConfigs";
import axios from "axios";
import AddFilterDialogSelectValue from "./AddFilterDialogSelectValue.vue";

import FilterEditBoolean from "./FilterEdit/FilterEditBoolean.vue";
import FilterEditRange from "./FilterEdit/FilterEditRange.vue";
import FilterEditSearch from "./FilterEdit/FilterEditSearch.vue";
import FilterEditSelect from "./FilterEdit/FilterEditSelect.vue";

export default {
  name: "Template",
  components: {
    AddFilterDialogSelectValue,
    filterKeySelector,
    FilterEditBoolean,
    FilterEditRange,
    FilterEditSearch,
    FilterEditSelect,
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
        this.tab = 1
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