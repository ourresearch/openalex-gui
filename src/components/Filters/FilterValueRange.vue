<template>
  <v-card  flat>
    <v-toolbar  color="transparent"  flat dense>
      <v-icon small left>{{ myFilterConfig.icon }}</v-icon>
      {{ myFilterConfig.displayName }}
      <v-spacer></v-spacer>
      <v-btn icon small @click="$emit('delete', filterKey)">
        <v-icon small>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
  <v-card-text  class="pt-0 d-flex align-center">
    <v-text-field
        dense
        hide-details
        outlined
        v-model="myFilterValue"
        @keypress.enter="$emit('update', myFilterValue)"
        class="pb-0 mb-0"
        :disabled="disabled"
    />

<!--    <v-text-field-->
<!--            dense-->
<!--            hide-details-->
<!--            outlined-->
<!--            v-model="start"-->
<!--            placeholder="Min"-->
<!--            @keypress.enter="$emit('update', asStr)"-->
<!--    />-->
<!--    <span class="mx-3">&mdash;</span>-->
<!--    <v-text-field-->
<!--            dense-->
<!--            hide-details-->
<!--            outlined-->
<!--            v-model="end"-->
<!--            placeholder="Max"-->
<!--            @keypress.enter="$emit('update', asStr)"-->
<!--    />-->

  </v-card-text>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "@/facetConfigs";

export default {
  name: "FilterValueRange",
  components: {
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
    asStr(){
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
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>