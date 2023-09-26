<template>
  <v-list-item
    @click="$emit('edit')"
  >
    <v-list-item-icon>
      <v-icon>mdi-filter-outline</v-icon>
      <!--          <v-icon>{{ myFilterConfig.icon }}</v-icon>-->
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>
        {{ myFilterValue }}
      </v-list-item-title>
      <v-list-item-subtitle>
        {{ myFilterConfig.displayName }}
      </v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action>
      <v-btn icon @click="$emit('delete', filterKey)">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-list-item-action>
  </v-list-item>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "@/facetConfigs";
import FilterEditRange from "@/components/FilterEdit/FilterEditRange.vue";

export default {
  name: "FilterValueRange",
  components: {
    FilterEditRange,
  },
  props: {
    filterKey: String,
    filterValue: String,
  },
  data() {
    // const splitValue = (this.filterValue) ? this.filterValue.split("-") : ["", ""]
    return {
      foo: 42,
      // start: String(splitValue[0]),
      // end: String(splitValue[1]),

      myFilterValue: this.filterValue,
      myFilterKey: this.filterKey,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    asStr() {
      return this.start + "-" + this.end
    },
    myFilterConfig() {
      return facetConfigs().find(c => c.key === this.filterKey)
    },

  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>