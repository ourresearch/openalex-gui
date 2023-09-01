<template>
  <div class="d-flex flex-wrap">
    <filter-value-chip
        v-for="value in mySelectedValues"
        :key="value"
        :filter-key="filterKey"
        :filter-value="value"
        :close="mySelectedValues.length > 1"
        @remove="removeSelectedValue(value)"
    />
    <span style="visibility: hidden;">|</span>
    <v-menu max-height="90vh">
      <template v-slot:activator="{on}">
        <v-btn
            text
            color="primary"
            rounded
            v-on="on"
            :icon="mySelectedValues.length > 0"
        >
          <template v-if="mySelectedValues.length === 0">
            Select
            <v-icon right>mdi-menu-down</v-icon>
          </template>
          <v-icon v-else>mdi-plus</v-icon>
        </v-btn>
      </template>
      <v-card max-height="90vh">
        <v-text-field
            v-model="searchString"
            autofocus
            clearable
            hide-details
            class="mx-2"
            prepend-inner-icon="mdi-magnify"
        />
        <div style="overflow-y: scroll; max-height: calc(90vh - 120px)">
          <v-list>
            <v-list-item
                v-for="option in options"
                :key="option.id"
                @click="addSelectedValue(option.id)"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ option.display_name }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </div>

      </v-card>
    </v-menu>
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
    readonly: Boolean,
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
        this.options = await api.getAutocompleteResponses(
            this.myFilterConfig.entityId,
            this.filterKey,
            this.searchString,
        )
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