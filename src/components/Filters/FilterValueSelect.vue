<template>
  <div class="d-flex flex-wrap ml-3">
    <v-autocomplete
        chips
        multiple
        full-width
        outlined
        hide-details
        :items="options"
        v-model="selectedOptions"
        :search-input.sync="searchString"
        item-text="display_name"
        item-value="id"
    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";
import {api} from "@/api";
import FilterValueChip from "./FilterValueChip.vue";
import {getFacetConfig} from "@/facetConfigs";

export default {
  name: "FilterValueSelect",
  components: {
    FilterValueChip,
  },
  props: {
    disabled: Boolean,
    filterKey: String,
    filterValue: String,
    displayValue: String,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      selectedValue: this.filterValue,
      options: [],
      selectedOptions: [],


      searchString: "",
      mySelectedValues: [],
      mySelectedDisplayValues: [
        this.displayValue
      ]
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    mySelectedValueString() {
      return this.mySelectedValues.join("|")
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
    async addSelectedValue(filterValue) {
      this.mySelectedValues.push(filterValue)
      await this.$emit("update", this.mySelectedValueString)
    },
    async removeSelectedValue(filterValue) {
      console.log("removeSelectedValue", filterValue)
      this.mySelectedValues = this.mySelectedValues.filter(v => {
        return v !== filterValue
      })
      await this.$emit("update", this.mySelectedValueString)
    },
    async submit(filterKey) {
      this.$emit("update", this.mySelectedValueString)
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
  mounted() {
    if (this.filterValue) {
      const newValues = this.filterValue.split("|")
      this.mySelectedValues = [...this.mySelectedValues, ...newValues]
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