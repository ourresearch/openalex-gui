<template>
  <div class="">
    <!--    <div v-if="$vuetify.breakpoint.mobile" class="">-->
    <!--      <span v-if="!resultsObject?.meta?.count">No </span>-->
    <!--      <span v-else>{{ resultsObject?.meta.count | millify }}</span> results-->
    <!--    </div>-->
    <div class="grey--text">
      Results
      (<span v-if="resultsObject?.meta?.count >= 1000">about </span><span class="font-weight-bold">{{ resultsObject?.meta.count | toPrecision }}</span>)
      <!--        ({{resultsObject?.meta?.db_response_time_ms / 1000 | toPrecision(2) }} seconds)-->
      <!--      </span>-->
    </div>

    <v-spacer/>


  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
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