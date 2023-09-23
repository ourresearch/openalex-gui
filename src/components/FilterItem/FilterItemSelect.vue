<template>
  <span>
    <v-menu :close-on-content-click="true" max-width="350" rounded>
      <template v-slot:activator="{on}">
        <a v-on="on">
          {{ myFilterConfig.displayName | pluralize(mySelectedIds.length) }}
        </a>
      </template>
      <v-card>
        <v-card-title class="capitalize-first-letter">{{ myFilterConfig.displayName }}</v-card-title>
        <v-card-text>{{ myFilterConfig.docstring }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text rounded color="error" @click="$emit('delete')">
            Delete all
          </v-btn>
          <v-btn rounded color="primary" @click="$emit('delete')">
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
        <!--          <div>{{ options }}</div>-->
        <filter-value-chip
            v-for="id in mySelectedIds"
            :key="id"
            :filter-key="myFilterConfig.key"
            :filter-value="id"
        />

  </span>
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
import {
  getMatchModeFromSelectFilterValue,
  getItemsFromSelectFilterValue,
  makeSelectFilterValue
} from "@/filterConfigs";
import Template from "@/components/Filters/FilterKeySelector.vue";
import FilterEditSelect from "../FilterEdit/FilterEditSelect.vue";

export default {
  name: "FilterValueSelect",
  components: {
    FilterValueChip,
    FilterEditSelect,
  },
  props: {
    disabled: Boolean,
    filterKey: String,
    filterValue: String,
  },
  data() {
    return {
      foo: 42,
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
    mySelectedIds() {
      return getItemsFromSelectFilterValue(this.filterValue)
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
    },
    setSelectedMatchMode(newMode) {
    },
    remove(id) {
    },


  },
  created() {
  },
  async mounted() {
  },
  watch: {
    searchString: {
      immediate: true,
      handler: async function (newVal, oldVal) {
      },
    },

  }
}
</script>

<style  lang="scss">

</style>