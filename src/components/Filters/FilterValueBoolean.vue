<template>
    <v-switch
        :disabled="disabled"
        class="pt-0 mt-0"
      v-model="selectedValue"
      :label="label"
      hide-details
      @change="$emit('update', selectedValue)"
    />

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
  components: {
  },
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
    label(){
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
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>