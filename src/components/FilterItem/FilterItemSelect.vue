<template>

  <div>
    <v-list-item>
      <v-list-item-icon>
        <v-icon>{{ myFilterConfig.icon }}</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>{{ myFilterConfig.displayName }}</v-list-item-title>
        <v-list-item-subtitle>
          1 selected
        </v-list-item-subtitle>
        <v-list-item-subtitle>
          Exclude all
        </v-list-item-subtitle>
      </v-list-item-content>
<!--      <v-list-item-action>-->
<!--        <v-btn icon @click="$emit('delete', myFilterConfig.id)">-->
<!--          <v-icon>mdi-close</v-icon>-->
<!--        </v-btn>-->
<!--      </v-list-item-action>-->
    </v-list-item>
    <v-list>
      <v-list-item
          class="ml-12"
          v-for="option in options"
          :key="option.value"
      >
        <v-list-item-content>
          <v-list-item-title>
            {{ option.display_name }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>


  </div>

  <!--    <v-list-item @click="$emit('click')" flat class="">-->
  <!--      <v-list-item-icon>-->
  <!--        <v-icon>{{ myFilterConfig.icon }}</v-icon>-->

  <!--      </v-list-item-icon>-->
  <!--      <v-list-item-content>-->
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
  <!--            @input="input"-->
  <!--            :label="myFilterConfig.displayName"-->
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
  <!--      </v-list-item-content>-->
  <!--      <v-list-item-action>-->
  <!--        <v-btn icon  @click="$emit('delete', myFilterConfig.id)">-->
  <!--          <v-icon >mdi-close</v-icon>-->
  <!--        </v-btn>-->
  <!--      </v-list-item-action>-->

  <!--    </v-list-item>-->
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";
import {shortenOpenAlexId} from "@/util";
import {api} from "@/api";
import FilterValueChip from "../FilterEdit/FilterValueChip.vue";
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