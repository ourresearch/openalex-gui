<template>
  <v-card flat class=""
          @keydown.up="moveHighlight(-1)"
          @keydown.down="moveHighlight(1)"
  >
    <v-toolbar color="transparent" flat dense>
      <v-icon left>{{ myFilterConfig.icon }}</v-icon>
      <v-toolbar-title>
        {{ myFilterConfig.displayName }}

      </v-toolbar-title>
      <v-spacer/>
      <v-menu>
        <template v-slot:activator="{on}">
          <v-btn
              rounded
              text
              class=""
              v-on="on"
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
    </v-toolbar>
    <v-card-text class="pt-0">
      <v-list
          v-for="(opt, i) in selectedOptionObjects"
          :key="opt.id"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              {{ opt.display_name }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <div>
        <v-text-field
            v-model="searchString"
            outlined
            hide-details
            autofocus
        />
        <div>highlighted: {{ highlightedOption }}</div>
        <v-list>
          <v-list-item-group v-model="highlightedOption">
            <v-list-item
                v-for="(opt, i) in filteredOptions"
                :key="i"
                @click="selectOption(opt.id)"

            >
              <v-list-item-title>
                {{ opt.display_name }}
              </v-list-item-title>
            </v-list-item>

          </v-list-item-group>
        </v-list>
      </div>
      <!--        <v-autocomplete-->
      <!--            chips-->
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
      <!--        >-->
      <!--          <template v-slot:selection="data">-->
      <!--            <v-chip-->
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

    </v-card-text>


    <!--        :label="myFilterConfig.displayName"-->

  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {shortenOpenAlexId} from "@/util";
import {api} from "@/api";
import {getFacetConfig} from "@/facetConfigs";
import {openAlexCountries} from "@/countries";
import {openAlexSdgs} from "@/sdgs";
import {getMatchModeFromSelectFilterValue, getItemsFromSelectFilterValue, makeSelectFilterValue} from "@/filterConfigs";

export default {
  name: "FilterValueSelect",
  components: {},
  props: {
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
      highlightedOption: 0,
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
    selectedOptionObjects() {
      return this.options.filter(o => this.selectedOptions.includes(o.id))
    },
    filteredOptions() {
      return this.options
    }
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
    selectOption(id){
        this.selectedOptions = [
            ...this.selectedOptions,
            id
        ]
    },
    moveHighlight(amount) {
      let newIndex = this.highlightedOption + amount
      const maxIndex = this.filteredOptions.length - 1
      if (newIndex < 0) newIndex = 0
      else if (newIndex > maxIndex) newIndex = maxIndex

      this.highlightedOption = newIndex
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
        this.options = apiOptions
        return

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
      const autocompletePromises = newIds.map(api.makeAutocompleteResponseFromId)
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