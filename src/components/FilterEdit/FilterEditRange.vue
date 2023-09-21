<template>
  <v-card rounded flat>
    <v-toolbar flat >
<!--      <v-icon left>{{ myConfig.icon }}</v-icon>-->

      <v-text-field
          rounded
          dense
          autofocus
          v-model="myValue"
          :placeholder="myConfig.displayName"
          outlined
          hide-details
          @keyup.enter="$emit('upsert', myValue)"
      />


    </v-toolbar>
    <v-card-text>
      Here's some information about this filter.
    </v-card-text>
    <v-card-actions>
      <v-spacer/>
      <v-btn text rounded @click="$emit('close')">Cancel</v-btn>
      <v-btn  rounded  color="primary" @click="$emit('upsert', myValue)">
        {{ createMode ? "Add filter" : "Update filter"}}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "../../facetConfigs";

export default {
  name: "FilterEditRange",
  components: {},
  props: {
    filterKey: String,
    filterValue: String,
    createMode: Boolean,
  },
  data() {
    return {
      foo: 42,
      myValue: this.filterValue,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType"
    ]),
    myConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
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
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>