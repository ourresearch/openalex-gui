<template>
  <v-card flat rounded class="">
    <div class="px-4">
      <v-text-field
          autofocus
          v-model="searchString"
          hide-details
          prepend-icon="mdi-magnify"
          clearable
          full-width
          rounded
          :placeholder="'Add ' + myConfig.displayName"
      />
    </div>
    <v-divider></v-divider>
    <v-list
    >
      <v-list-item
          v-for="option in options"
          :key="'unselected' + option.id"
          @click="selectOption(option)"
      >
        <v-list-item-icon>
          <v-icon>mdi-filter-plus-outline</v-icon>
        </v-list-item-icon>
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
      searchString: "",
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
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    selectOption(option) {
      this.$emit("select", option.id)
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

  }
}
</script>

<style scoped lang="scss">

</style>