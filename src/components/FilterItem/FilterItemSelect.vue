<template>
  <v-menu offset-x :close-on-content-click="false">
    <template v-slot:activator="{on}">
      <v-list-item v-on="on">

      <v-list-item-icon>
        <v-icon>{{ myFilterConfig.icon }}</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>
<!--          <div>{{ options }}</div>-->
          <filter-value-chip
            v-for="id in mySelectedIds.slice(0, 1)"
            :key="id"
            :filter-key="myFilterConfig.key"
            :filter-value="id"
            />
          <span v-if="mySelectedIds.length > 1">
            +{{ mySelectedIds.length - 1}}
          </span>

        </v-list-item-title>
        <v-list-item-subtitle>
          {{ myFilterConfig.displayName | pluralize(mySelectedIds.length) }}
        </v-list-item-subtitle>
<!--        <v-list-item-subtitle>-->
<!--          Exclude all-->
<!--        </v-list-item-subtitle>-->
      </v-list-item-content>
      <v-list-item-action>
        <v-btn icon @click="$emit('delete', myFilterConfig.id)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>
    </template>
    <filter-edit-select
        :filter-key="filterKey"
        :filter-value="filterValue"
        @update="(newValue) =>  $emit('update', newValue)"
    />
  </v-menu>
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
    mySelectedIds(){
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

<style scoped lang="scss">

</style>