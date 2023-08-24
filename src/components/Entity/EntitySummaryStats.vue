<template>
  <v-card flat>

  <v-card-text class="pa-0" style="font-size: 16px;">
    <div class="data-row">
        <span class="font-weight-bold">
          Cited by:
        </span>
      <span class="">
          {{ citedByCount.toLocaleString() }} works
        </span>
    </div>
    <div class="data-row">
        <span class="font-weight-bold">
          H-index:
        </span>
      <span class="">
          {{ (data.h_index) ? data.h_index.toLocaleString() : 0 }}
        </span>
    </div>
    <div class="data-row">
        <span class="font-weight-bold">
          i10 index:
        </span>
      <span class="">
          {{ (data.i10_index) ? data.i10_index.toLocaleString() : 0 }}
        </span>
    </div>
    <div v-if="includeImpactFactor" class="data-row">
        <span class="font-weight-bold">
          2yr mean citedness:
        </span>
      <span class="">
          {{ ((data["2yr_mean_citedness"]) ? data["2yr_mean_citedness"] : 0) | toPrecision(2) }}
        </span>
    </div>
  </v-card-text>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "EntitySummaryStats",
  components: {},
  props: {
    data: Object,
    citedByCount: Number,
    includeImpactFactor: Boolean,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    isOpen: {
      get() {
        if (!this.$vuetify.breakpoint.mobile) return true
        return this.$store.state.showFiltersDrawer
      },
      set(val) {
        if (!this.$vuetify.breakpoint.mobile) return // you can't falsify isOpen on desktop
        this.$store.state.showFiltersDrawer = val
      },
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
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">

</style>