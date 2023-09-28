<template>
  <v-chip
      @click="$emit('edit')"
      close
      label
      color="primary"
      close-icon="mdi-close"
      @click:close="$emit('delete')"
  >
    <span v-if="!filterValue" class="font-weight-bold mr-1">NOT</span>
            {{ myFilterConfig.displayName }}
  </v-chip>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {api} from "@/api";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";
import {getFacetConfig} from "@/facetConfigs";
import FilterEditBoolean from "@/components/FilterEdit/FilterEditBoolean.vue";
import FilterValueChip from "../FilterEdit/FilterValueChip.vue";

export default {
  name: "FilterValueBoolean",
  components: {
    FilterValueChip,
    FilterEditBoolean,
  },
  props: {
    disabled: Boolean,
    filterKey: String,
    filterValue: [Boolean, String],
  },
  data() {
    return {
      foo: 42,
      options: [],
      myFilterValue: this.filterValue,
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
      const negationString = (this.myFilterValue) ? "" : "NOT"
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
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>