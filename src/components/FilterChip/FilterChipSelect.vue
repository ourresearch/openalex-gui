<template>
  <v-chip
      @click="$emit('edit')"
      close
      color="primary"
      close-icon="mdi-close"
      @click:close="$emit('delete')"
  >
    <filter-select-value-as-string
        :filter-key="filterKey"
    />
  </v-chip>
</template>
<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {shortenOpenAlexId} from "@/util";
import {getFacetConfig} from "@/facetConfigs";
import {
  makeSelectFilterValue
} from "@/filterConfigs";
import Template from "@/components/Filters/FilterKeySelector.vue";
import FilterEditSelect from "../FilterEdit/FilterEditSelect.vue";
import FilterSelectValueAsString from "../Filters/FilterSelectValueAsString.vue";

export default {
  name: "FilterValueSelect",
  components: {
    FilterEditSelect,
    FilterSelectValueAsString,
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