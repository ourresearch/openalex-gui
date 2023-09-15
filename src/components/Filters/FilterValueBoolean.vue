<template>
  <v-card flat class="">
    <v-toolbar color="transparent" flat dense>
      <v-icon left small>{{ myFilterConfig.icon}}</v-icon>
      {{ myFilterConfig.displayName }}
      <v-spacer></v-spacer>
      <v-btn icon small @click="$emit('delete', filterKey)">
        <v-icon small>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card-text class="pt-0">
      <div class="d-flex align-center">
        <span>
        <span class="text-capitalize">
        {{ entityType | pluralize(1)}}
        </span>
          <span>is</span>
          <span v-if="!selectedValue" class="font-weight-bold"> NOT</span>
        {{ myFilterConfig.displayName }}

        </span>
        <v-spacer/>
        <v-switch

            :disabled="disabled"
            class="ma-0 pa-0"
            v-model="selectedValue"
            hide-details
            @change="$emit('update', selectedValue)"
        />
      </div>


    </v-card-text>


  </v-card>

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