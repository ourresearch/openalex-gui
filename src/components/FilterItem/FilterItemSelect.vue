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
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
        <!--          <div>{{ options }}</div>-->
        <filter-value-chip
            v-for="(id, i) in mySelectedIds"
            :key="id"
            :filter-key="myFilterConfig.key"
            :filter-value="id"
            :is-first="i === 0"
            :has-siblings="mySelectedIds.length > 1"
            :append-separator="appendSeparator"
            @delete="$emit('delete')"
            @add-another="openAddOptionDialog"
        />

    <v-dialog v-model="isAddOptionDialogOpen" fullscreen scrollable>
      <filter-edit-select
        :filter-key="filterKey"
        @select="(newOptionValue) => $emit('update', )"
      />
    </v-dialog>

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
import app from "../../App.vue";
import {filter} from "core-js/internals/array-iteration";

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
    appendSeparator: Boolean,
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

      isAddOptionDialogOpen: false,
    }
  },
  computed: {
    app() {
      return app
    },
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
    filter,
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
    openAddOptionDialog(){
      this.isAddOptionDialogOpen = true
    },
    addSelectedOption(){
      this.$emit()  //jason priem pick up here!
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
      },
    },

  }
}
</script>

<style  lang="scss">

</style>