<template>
  <v-card
      flat
      rounded
      class="button-card pa-4 d-flex align-end"
      height="100"
      @click="clickCard"
  >
    <bar-graph
        :bars="countsByYear.map(y => {return {key: y.year, count: y.cited_by_count}})"
        style="height: 100%;"
        class="flex-grow-1"
        @click="clickBar"

    />
    <v-divider vertical class="mx-3"></v-divider>
    <div class="">
      <div class="text-h3">
        {{ filters.toPrecision(citedByCount) }}
      </div>
      <div class="text-right">Citations</div>
    </div>


  </v-card>
</template>

<script>

import {mapGetters} from "vuex";

import {url} from "@/url";
import filters from "@/filters";
import {createSimpleFilter} from "@/filterConfigs";
import {shortenOpenAlexId} from "@/util";

import BarGraph from "@/components/BarGraph.vue";

export default {
  name: "CitationsGraph",
  components: {
    BarGraph,
  },
  props: {
    countsByYear: Array,
    citedByCount: Number,
    id: String,
  },
  data() {
    return {
      filters,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    citesFilter() {
      const shortId = shortenOpenAlexId(this.id)
      return createSimpleFilter(this.entityType, "cites", shortId)
    }
  },
  methods: {
    clickCard() {
      url.pushNewFilters([this.citesFilter])
    },
    clickBar(barKey) {
      const yearFilter = createSimpleFilter(this.entityType, "publication_year", barKey)
      url.pushNewFilters([this.citesFilter, yearFilter])
    }
  },
}
</script>

<style scoped lang="scss">

</style>