<template>
  <div class="">
    <v-autocomplete
        :label="myFilterConfig.displayName"
        chips
        dense
        small-chips
        multiple
        outlined
        hide-details
        :items="options"
        v-model="selectedOptions"
        :search-input.sync="searchString"
        item-text="display_name"
        item-value="id"
        @input="input"
    >
      <template v-slot:selection="data">
        <v-chip
            small
            v-bind="data.attrs"
            :input-value="data.selected"
            close
            @click="data.select"
            class="mt-2"
            @click:close="remove(data.item.id)"
        >
          {{ data.item.display_name | truncate(30)}}
        </v-chip>
      </template>
    </v-autocomplete>
  </div>
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
      return this.selectedOptions
          .map(optionId => {
            return shortenOpenAlexId(optionId)
          })
          .join("|")
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
    remove(id){
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
    if (this.filterValue && this.myFilterConfig.isEntity) {
      const newIds = this.filterValue.split("|")
      this.selectedOptions = newIds

      const makeAutocompleteResponseFromId = async function (id) {
        const displayName = await api.getEntityDisplayName(id)
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