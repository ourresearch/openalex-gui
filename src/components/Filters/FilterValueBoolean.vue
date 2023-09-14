<template>
  <v-list-item-content class="">
    <v-list-item-title style="height: 40px; margin-top:-5px;" class="d-flex align-center">
      {{ myFilterConfig.displayName }}
      <v-spacer/>
      <v-switch

          :disabled="disabled"
          class="ma-0 pa-0"
          v-model="selectedValue"
          hide-details
          @change="$emit('update', selectedValue)"
      />
    </v-list-item-title>
  </v-list-item-content>

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