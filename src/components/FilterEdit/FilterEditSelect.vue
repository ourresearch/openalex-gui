<template>
  <v-card class="" style="height: 100%;">
    <v-toolbar flat>
      <!--        <v-btn v-if="$vuetify.breakpoint.mobile" icon @click="$emit('close')">-->
      <!--          <v-icon>mdi-arrow-left</v-icon>-->
      <!--        </v-btn>-->
      <v-toolbar-title class="">
        {{ myConfig.displayName }}
      </v-toolbar-title>
      <v-spacer/>
      <v-menu>
        <template v-slot:activator="{on}">
          <v-chip
              v-on="on"
              color="#444"
              dark
              class="ml-1"
              :input-value="isMatchModeAnd"
              v-if="appliedOptionIds.length > 1"
              :disabled="isAnyAppliedOptionNegated"

          >
            {{ isMatchModeAnd ? "AND" : "OR" }}
          </v-chip>
        </template>
        <v-card>
            <v-list dense>
              <v-subheader>Match strategy</v-subheader>
              <v-divider />
              <v-list-item @click="isMatchModeAnd = true">
                <v-list-item-icon>
                  <v-icon v-if="isMatchModeAnd">mdi-check</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>AND</v-list-item-title>
                  <v-list-item-subtitle>Match all selected values</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-list-item @click="isMatchModeAnd = false">
                <v-list-item-icon>
                  <v-icon v-if="!isMatchModeAnd">mdi-check</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>OR</v-list-item-title>
                  <v-list-item-subtitle>Match any selected values</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
        </v-card>
      </v-menu>
      <v-btn icon @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-divider></v-divider>
    <div class="mt-1 ml-1">
      <filter-option-chip
          v-for="id in appliedOptionIds"
          :key="id"
          :filter-value="id"
          :filter-key="filterKey"
          @delete="deleteOption(id)"
          @toggle-is-negated="toggleOptionIsNegated(id)"
      />
      <v-text-field
          hide-details
          dense
          full-width
          v-model="searchString"
          rounded
          class="elevation-0 ma-0 pa-0"
          placeholder="add another"
          prepend-inner-icon="mdi-plus"
      />
    </div>
    <v-divider></v-divider>
    <v-card-text :style="{height: dialogTextHeight}" class="pa-0 overflow-y-auto">

      <div>
        <v-list>
          <v-subheader v-if="searchString && !unselectedOptions.length">
            No results
          </v-subheader>
          <v-list-item
              v-for="option in unselectedOptions"
              :key="'unselected' + option.id"
              @click="addOption(option.id)"
          >
            <v-list-item-icon>
              <v-icon>mdi-checkbox-blank-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ option.display_name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <span v-if="option.entity_type !== 'author'">{{ option.hint }}</span>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

        </v-list>
      </div>


    </v-card-text>
    <v-divider></v-divider>

    <v-card-actions>
      <v-spacer/>
      <v-btn color="primary" text rounded @click="$emit('close')">
        See {{ resultsCount | toPrecision }} works
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
import FilterOptionChip from "../Filters/FilterOptionChip.vue";

export default {
  name: "FilterValueSelect",
  components: {
    FilterOptionChip,
  },
  props: {
    filterKey: String,
    createMode: Boolean,
  },
  data() {
    return {
      foo: 42,
      maxUnselectedOptionsCount: 40,
      isLoading: false,


      selectedOptions: [],
      unselectedOptions: [],
      selectedMatchMode: "any",
      searchString: "",
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
      "resultsCount",
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
    },
    dialogTextHeight() {
      return this.$vuetify.breakpoint.mobile ? "calc(100vh - 120px)" : "50vh"
    },
    filterValue() {
      return url.readFilterValue(this.entityType, this.filterKey)
    },
    isAppliedMatchModeAnd() {
      return this.filterValue?.includes("+")
    },
    isMatchAndDisabled() {
      return this.appliedOptionIds.length < 2
    },
    matchModeString(){
      return this.isMatchModeAnd ? "all" : "any"
    },
    isAnyAppliedOptionNegated(){
      return this.appliedOptionIds.some(id => id.includes("!"))
    },
    appliedOptionIds: {
      get() {
        return this.filterValue?.split(/[|+]/) ?? []
      },
      set(to) {
        console.log("set appliedOptionIds", to)

        const isMatchModeAnd = to.some(id => id.includes("!")) ?
            true :
            this.isMatchModeAnd
        const matchModeString = isMatchModeAnd ? "all" : "any"

        const newValue = makeSelectFilterValue(to, matchModeString)
        const eventName = this.createMode ?
            "create" :
            "update"
        this.$emit(eventName, newValue)
      }
    },
    isMatchModeAnd: {
      get() {
        return this.filterValue?.includes("+")
      },
      set(to) {
        const matchModeString = to ? "all" : "any"
        const newValue = makeSelectFilterValue(this.appliedOptionIds, matchModeString)
        this.$emit("update", newValue)
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),

    addOption(id){
      this.appliedOptionIds = [...this.appliedOptionIds, id]
    },
    deleteOption(id) {
      this.appliedOptionIds = this.appliedOptionIds.filter(i => i !== id)
    },
    toggleOptionIsNegated(idToToggle){

      this.appliedOptionIds = this.appliedOptionIds.map(optionValue => {
        const optionId = optionValue.replace("!", "")
        const optionIsNegated = optionValue[0] === "!"
        const toggledOption = optionIsNegated ?
            optionId :
            "!" + optionId

        return optionValue === idToToggle ?
            toggledOption :
            optionValue // no change
      })
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
          const iAmInSelectedOptions = this.appliedOptionIds.find(appliedId => {
            return appliedId === o.id
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
  },
  watch: {
    searchString: {
      immediate: true,
      handler: async function (newVal, oldVal) {
        await this.fetchOptions()
      },
    },

    myValue(to, from) {

      // this.$vuetify.goTo(0, {
      // })
    }

  }
}
</script>

<style scoped lang="scss">

</style>