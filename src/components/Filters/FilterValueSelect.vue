<template>
  <v-list-item-content class="">
    <v-list-item-title style="" class="d-flex align-center ">
      {{ myFilterConfig.displayName }}
      <v-spacer/>
      <v-menu>
        <template v-slot:activator="{on}">
          <v-btn
              rounded
              text
              class=""
              v-on="on"
              small
          >
            {{ selectedMatchMode }}
            <v-icon right>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-subheader>Match mode:</v-subheader>
          <v-list-item
              v-for="modeName in matchModes"
              :key="modeName"
              @click="setSelectedMatchMode(modeName)"
          >
            <v-list-item-icon>
              <v-icon v-if="modeName === selectedMatchMode">mdi-check</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              {{ modeName }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
<!--      <v-btn icon @click="$emit('delete', filter.key)">-->
<!--        <v-icon>mdi-delete-outline</v-icon>-->
<!--      </v-btn>-->
    </v-list-item-title>


    <!--        :label="myFilterConfig.displayName"-->
        <v-autocomplete
            chips
            autofocus
            dense
            small-chips
            multiple
            outlined
            hide-details
            :items="options"
            v-model="selectedOptions"
            :search-input.sync="searchString"
            item-text="display_name"
            item-value="id"
            @input="input"
        >
          <template v-slot:selection="data">
            <v-chip
                small
                v-bind="data.attrs"
                :input-value="data.selected"
                close
                @click="data.select"
                class="mt-2"
                @click:close="remove(data.item.id)"
            >
              {{ data.item.display_name | truncate(30) }}
            </v-chip>
          </template>
        </v-autocomplete>

  </v-list-item-content>
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

export default {
  name: "FilterValueSelect",
  components: {},
  props: {
    disabled: Boolean,
    filterKey: String,
    filterValue: String,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      selectedValue: this.filterValue,
      options: [],
      selectedOptions: [],
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
      const items = this.selectedOptions
          .map(optionId => {
            return shortenOpenAlexId(optionId)
          })
      return makeSelectFilterValue(items, this.selectedMatchMode)
    },
    myFilterConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    input() {
      this.$emit("update", this.mySelectedValueString)
      // if (this.mySelectedValueString){
      //   console.log("this.mySelectedValueString", this.mySelectedValueString)
      // }
      // else {
      //   this.$emit("delete")
      // }
    },
    setSelectedMatchMode(newMode) {
      this.selectedMatchMode = newMode
      this.$emit("update", this.mySelectedValueString)
    },
    remove(id) {
      console.log("remove()", id)
      this.selectedOptions = this.selectedOptions.filter(oldId => oldId !== id)
      return this.input()
    },
    async fetchOptions() {
      this.isLoading = true
      try {
        const apiOptions = await api.getAutocompleteResponses(
            this.entityType,
            this.filterKey,
            this.searchString,
        )

        const newOptions = apiOptions.filter(myNewOption => {
          const oldOptionIds = this.options.map(o => o.id)
          return !oldOptionIds.includes(myNewOption.id)
        })
        this.options = [
          ...this.options,
          ...newOptions
        ]


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
      this.selectedOptions = newIds
      this.selectedMatchMode = getMatchModeFromSelectFilterValue(this.filterValue)

      const that = this


      const makeAutocompleteResponseFromId = async function (id) {
        const config = that.myFilterConfig
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
      this.options = await Promise.all(
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