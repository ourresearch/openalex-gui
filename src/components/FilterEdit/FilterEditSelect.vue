<template>
  <v-card flat rounded class="">
    <v-toolbar flat>
      <v-toolbar-title>
        <v-icon left>mdi-filter-outline</v-icon>
        {{ myConfig.displayName }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn icon @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
      <template v-slot:extension>
        <v-text-field
            autofocus
            v-model="searchString"
            hide-details
            prepend-icon="mdi-magnify"
            clearable
            full-width
            rounded
            :placeholder="'Search ' + myConfig.displayName | pluralize(2)"
        />

      </template>

    </v-toolbar>


    <v-divider></v-divider>
    <v-card-text style="flex-grow:9999;" id="filter-edit-select-card-text">
      <v-list
      >
        <v-subheader v-if="selectedOptionsToShow.length">
          Selected
          <span class="text-lowercase mx-1">{{ myConfig.displayName | pluralize(selectedOptionsToShow) }}</span>

          ({{ selectedOptionsToShow.length }})
        </v-subheader>
        <v-list-item
            v-for="option in selectedOptionsToShow"
            :key="'selected' + option.id"
            @click="unselectOption(option)"

        >
          <v-list-item-icon>
            <v-icon>mdi-checkbox-marked</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              <div class="text-wrap">
                {{ option.display_name }}

              </div>
            </v-list-item-title>
            <v-list-item-subtitle v-if="option.entity_type">
              <span v-if="option.entity_type !== 'author'">{{ option.hint }} - </span>
              <span>{{ option.id }})</span>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-subheader v-if="unselectedOptions.length">
          <template v-if="searchString">
            Search results
          </template>
          <template v-else>
            Options
          </template>
          ({{ unselectedOptions.length < maxUnselectedOptionsCount ? unselectedOptions.length : 'many' }})
        </v-subheader>

        <v-list-item
            v-for="option in unselectedOptions"
            :key="'unselected' + option.id"
            @click="selectOption(option)"
        >
          <v-list-item-icon>
            <v-icon>mdi-checkbox-blank-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ option.display_name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              <span v-if="option.entity_type">{{ option.id }} -</span>
              <span v-if="option.entity_type !== 'author'">{{ option.hint }}</span>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>

    </v-card-text>
    <v-divider></v-divider>

    <v-card-actions>
      <v-spacer/>
      <v-btn text rounded @click="$emit('close')">Cancel</v-btn>
      <v-btn v-if="myValue" text rounded color="primary" @click="$emit('upsert', myValue)">
        {{ createMode ? "Add filter" : "Update filter" }}
      </v-btn>
      <v-btn v-else text rounded color="error" @click="$emit('delete')">
        Delete
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";
import {shortenOpenAlexId} from "@/util";
import {api} from "@/api";
import FilterValueChip from "./FilterValueChip.vue";
import {getFacetConfig} from "@/facetConfigs";
import {openAlexCountries} from "@/countries";
import {openAlexSdgs} from "@/sdgs";
import {getMatchModeFromSelectFilterValue, getItemsFromSelectFilterValue, makeSelectFilterValue} from "@/filterConfigs";
import Template from "@/components/Filters/FilterKeySelector.vue";

export default {
  name: "FilterValueSelect",
  components: {Template},
  props: {
    filterKey: String,
    filterValue: String,
    createMode: Boolean,
  },
  data() {
    return {
      foo: 42,
      maxUnselectedOptionsCount: 35,
      isLoading: false,
      selectedValue: this.filterValue,
      options: [],
      selectedOptions: [],
      unselectedOptions: [],
      matchModes: [
        "any",
        "all",
        "none",
      ],
      selectedMatchMode: "any",
      searchString: "",
      mySelectedValues: [],
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    myValue() {
      const items = this.selectedOptions.map(o => o.id)
      return makeSelectFilterValue(items, this.selectedMatchMode)
    },
    myConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    selectedOptionsToShow() {
      return this.searchString ? [] : this.selectedOptions
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    setSelectedMatchMode(newMode) {
      this.selectedMatchMode = newMode
    },
    selectOption(option) {
      this.unselectedOptions = this.unselectedOptions.filter(o => o.id !== option.id)
      this.selectedOptions.push(option)
      this.searchString = ""
    },
    unselectOption(option) {
      this.selectedOptions = this.selectedOptions.filter(o => o.id !== option.id)
      this.unselectedOptions.push(option)
      this.searchString = ""
      this.fetchOptions()
    },
    remove(id) {
      console.log("remove()", id)
      this.selectedOptions = this.selectedOptions.filter(oldId => oldId !== id)
    },
    async fetchOptions() {
      this.isLoading = true
      try {
        const apiOptions = await api.getAutocompleteResponses(
            this.entityType,
            this.filterKey,
            this.searchString,
        )

        // const newOptions = apiOptions.filter(myNewOption => {
        //   const oldOptionIds = this.options.map(o => o.id)
        //   return !oldOptionIds.includes(myNewOption.id)
        // })
        this.unselectedOptions = apiOptions.filter(o => {
          const iAmInSelectedOptions = this.selectedOptions.find(selectedOption => {
            return selectedOption.id === o.id
          })
          return !iAmInSelectedOptions
        }).slice(0, this.maxUnselectedOptionsCount)

      } catch (e) {
        console.log("fetchOptions() error:", e.message)
      } finally {
        this.isLoading = false
      }
    }


  },
  created() {
  },
  async mounted() {
    console.log("FilterEditSelect mounted")
    if (this.filterValue) {
      // const newIds = this.filterValue.split("|")
      const newIds = getItemsFromSelectFilterValue(this.filterValue)
      this.selectedMatchMode = getMatchModeFromSelectFilterValue(this.filterValue)

      const that = this


      const makeAutocompleteResponseFromId = async function (id) {
        const config = that.myConfig
        const countryConfig = openAlexCountries.find(c => c.id.toLowerCase() === id.toLowerCase())
        const sdgConfig = openAlexSdgs.find(c => c.id.toLowerCase() === id.toLowerCase())
        // const sdgConfig =

        // console.log("countryConfig", openAlexCountries, id, countryConfig)
        let displayName
        if (countryConfig) {
          displayName = countryConfig.display_name
        } else if (sdgConfig) {
          displayName = sdgConfig.display_name
        } else if (config.isEntity) {
          displayName = await api.getEntityDisplayName(id)
        } else {
          displayName = id
        }
        return {
          id,
          display_name: displayName,
        }
      }
      const autocompletePromises = newIds.map(makeAutocompleteResponseFromId)
      this.selectedOptions = await Promise.all(
          autocompletePromises
      )
    }
    await this.fetchOptions()
  },
  watch: {
    searchString: {
      immediate: true,
      handler: async function (newVal, oldVal) {
        await this.fetchOptions()
      },
    },
    myValue(to, from){

      this.$vuetify.goTo(0, {
        container: "#filter-edit-select-card-text"
      })
    }

  }
}
</script>

<style scoped lang="scss">

</style>