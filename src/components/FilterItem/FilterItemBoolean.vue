<template>
  <v-list-item>
    <v-list-item-icon>
      <v-icon>{{ myFilterConfig.icon }}</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>
        <span class="text-capitalize">
        {{ entityType | pluralize(1)}}
        </span>
          <span>is</span>
          <span v-if="!selectedValue" class="font-weight-bold"> NOT</span>
        {{ myFilterConfig.displayName }}

      </v-list-item-title>
      <v-list-item-subtitle>
        {{ myFilterConfig.displayName }}
      </v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action>
      <v-switch

            :disabled="disabled"
            class="ma-0 pt-1"
            v-model="selectedValue"
            hide-details
            @change="$emit('update', selectedValue)"
        />
    </v-list-item-action>
    <v-list-item-action>


      <v-btn icon @click="$emit('delete', filterKey)">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-list-item-action>
  </v-list-item>



</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {api} from "@/api";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";
import {getFacetConfig} from "@/facetConfigs";

export default {
  name: "FilterValueBoolean",
  components: {},
  props: {
    disabled: Boolean,
    filterKey: String,
    filterValue: Boolean,
  },
  data() {
    return {
      foo: 42,
      options: [],
      selectedValue: this.filterValue,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    myFilterConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    label() {
      const negationString = (this.selectedValue) ? "" : "NOT"
      return `${negationString} ${this.myFilterConfig.displayName}`
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  async mounted() {
    this.options = await api.getGroups(this.entityType, this.filterKey, {})
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>