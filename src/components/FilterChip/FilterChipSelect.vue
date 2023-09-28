<template>
  <v-chip
      @click="$emit('edit')"
      close
      label
      color="primary"
      close-icon="mdi-close"
      @click:close="$emit('delete')"
  >
        <filter-value-chip
            v-for="id in mySelectedIds.slice(0, 1)"
            :key="id"
            :filter-key="myFilterConfig.key"
            :filter-value="id"
        />
      <span class="font-weight-bold ml-1" v-if="mySelectedIds.length > 1">
            +{{ mySelectedIds.length - 1 }}
          </span>
  </v-chip>
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

<style scoped lang="scss">

</style>