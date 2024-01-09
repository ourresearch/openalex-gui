<template>
  <v-card
      flat
      rounded
      class="button-card pa-4 d-flex align-end"
      height="100"
      :to="id | entityWorksLink"
  >
      <bar-graph
          :bars="countsByYear.map(y => {return {name: y.year, count: y.works_count}})"
          style="height: 100%;"
          class="flex-grow-1"

      />
      <v-divider vertical class="mx-3"></v-divider>
      <div class="">
        <div class="text-h3">
        {{ worksCount | toPrecision }}
        </div>
        <div class="text-right">Works</div>
      </div>


  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import BarGraph from "@/components/BarGraph.vue";

export default {
  name: "Template",
  components: {
    BarGraph,
  },
  props: {
    countsByYear: Array,
    worksCount: Number,
    id: String,
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
    linkObj() {

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