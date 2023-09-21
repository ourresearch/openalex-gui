<template>
  <v-card flat class="">
    <v-toolbar flat dense>
      <v-icon left>{{ myConfig.icon }}</v-icon>
      <v-toolbar-title>
        {{ myConfig.displayName }}
      </v-toolbar-title>
    </v-toolbar>
    <v-toolbar flat class="">
      <v-text-field
          autofocus
          v-model="searchString"
          hide-details
          prepend-inner-icon="mdi-magnify"
          clearable
          full-width
          dense
          rounded
          outlined
          :placeholder="'Search ' + myConfig.displayName | pluralize(2)"
      />
    </v-toolbar>
    <v-list
    >
      <v-subheader v-if="selectedOptions.length">Selected values</v-subheader>
        <v-list-item
            v-for="option in selectedOptions"
            :key="'selected' + option.id"
            @click="unselectOption(option)"
        >
          <v-list-item-action>
            <v-icon>mdi-checkbox-marked</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              {{ option.display_name }}
            </v-list-item-title>
<!--            <v-list-item-subtitle>-->
<!--              {{ option.works_count }}-->
<!--            </v-list-item-subtitle>-->
          </v-list-item-content>
        </v-list-item>

      <v-subheader v-if="unselectedOptions.length">Values</v-subheader>
      <v-list-item
            v-for="option in unselectedOptions"
            :key="'unselected' + option.id"
            @click="selectOption(option)"
        >
        <v-list-item-action>
            <v-icon>mdi-checkbox-blank-outline</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              {{ option.display_name }}
            </v-list-item-title>
<!--            <v-list-item-subtitle>-->
<!--              {{ option.works_count }}-->
<!--            </v-list-item-subtitle>-->
          </v-list-item-content>
        </v-list-item>

    </v-list>
    <v-card-actions>
      <v-spacer/>
      <v-btn text rounded @click="update">Cancel</v-btn>
      <v-btn  rounded  color="primary" @click="update">
        {{ createMode ? "Add filter" : "Update filter"}}
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
    mySelectedValueString() {
      const items = this.selectedOptions.map(o => o.id)
      return makeSelectFilterValue(items, this.selectedMatchMode)
    },
    myConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    update() {
      this.$emit("update", this.mySelectedValueString)
    },
    setSelectedMatchMode(newMode) {
      this.selectedMatchMode = newMode
    },
    selectOption(option){
      this.unselectedOptions = this.unselectedOptions.filter(o => o.id !== option.id)
      this.selectedOptions.push(option)
      this.searchString = ""
    },
    unselectOption(option){
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
        }).slice(0, 5)

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
  },
  watch: {
    searchString: {
      immediate: true,
      handler: async function (newVal, oldVal) {
        await this.fetchOptions()
      },
    },

  }
}
</script>

<style scoped lang="scss">

</style>