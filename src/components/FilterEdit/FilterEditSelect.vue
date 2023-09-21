<template>
    <v-card flat class="">
<!--      <v-toolbar flat dense>-->
<!--      <v-icon left>{{ myConfig.icon }}</v-icon>-->
<!--      <v-toolbar-title>-->
<!--        {{ myConfig.displayName }}-->
<!--      </v-toolbar-title>-->
<!--    </v-toolbar>-->
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
      <v-list>
        <v-list-item @click="$emit('click')">
          one
        </v-list-item>
        <v-list-item @click="$emit('click')">
          two
        </v-list-item>
        <v-list-item @click="$emit('click')">
          three
        </v-list-item>
      </v-list>

<!--      <v-card-text class="pt-0">-->
<!--        <v-autocomplete-->
<!--            chips-->
<!--            dense-->
<!--            small-chips-->
<!--            multiple-->
<!--            outlined-->
<!--            hide-details-->
<!--            :items="options"-->
<!--            v-model="selectedOptions"-->
<!--            :search-input.sync="searchString"-->
<!--            item-text="display_name"-->
<!--            item-value="id"-->
<!--        >-->
<!--          <template v-slot:selection="data">-->
<!--            <v-chip-->
<!--                small-->
<!--                v-bind="data.attrs"-->
<!--                :input-value="data.selected"-->
<!--                close-->
<!--                @click="data.select"-->
<!--                class="mt-2"-->
<!--                @click:close="remove(data.item.id)"-->
<!--            >-->
<!--              {{ data.item.display_name | truncate(50) }}-->
<!--            </v-chip>-->
<!--          </template>-->
<!--        </v-autocomplete>-->

<!--      </v-card-text>-->
      <v-card-actions>
      <v-spacer />
      <v-btn text color="primary" @click="update">Update</v-btn>
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
      // if (this.mySelectedValueString){
      //   console.log("this.mySelectedValueString", this.mySelectedValueString)
      // }
      // else {
      //   this.$emit("delete")
      // }
    },
    setSelectedMatchMode(newMode) {
      this.selectedMatchMode = newMode
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