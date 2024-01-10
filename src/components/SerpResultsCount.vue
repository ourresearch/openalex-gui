<template>
  <div class="d-flex pa-2 px-3">
<!--    <div v-if="$vuetify.breakpoint.mobile" class="">-->
<!--      <span v-if="!resultsObject?.meta?.count">No </span>-->
<!--      <span v-else>{{ resultsObject?.meta.count | millify }}</span> results-->
<!--    </div>-->
    <div class="grey--text">
      <span v-if="!resultsObject?.meta?.count">No </span>
      <span v-else>
                  <span v-if="resultsObject?.meta?.count >= 100">About</span>
                  <span class="font-weight-bold">
                  {{ resultsObject?.meta.count | toPrecision }}
                  </span>
                </span>
      results
      <span  class="grey--text">
        ({{resultsObject?.meta?.db_response_time_ms / 1000 | toPrecision(2) }} seconds)
      </span>
    </div>

    <v-spacer/>


  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
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