<template>
  <v-chip
      @click="$emit('edit')"
      close
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
import {getFacetConfig} from "@/facetConfigs";
import FilterEditBoolean from "@/components/FilterEdit/FilterEditBoolean.vue";

export default {
  name: "FilterValueBoolean",
  components: {
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