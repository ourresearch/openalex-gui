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
        {{ citedByCount | toPrecision }}
      </div>
      <div class="text-right">Citations</div>
    </div>


  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import BarGraph from "@/components/BarGraph.vue";
import {createSimpleFilter} from "@/filterConfigs";
import {entityTypeFromId, shortenOpenAlexId} from "@/util";
import {getEntityConfig} from "@/entityConfigs";
import {url} from "@/url";

export default {
  name: "Template",
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
      foo: 42,
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
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),

    clickCard() {
      url.pushNewFilters([this.citesFilter])
    },
    clickBar(barKey) {
      const yearFilter = createSimpleFilter(this.entityType, "publication_year", barKey)
      url.pushNewFilters([this.citesFilter, yearFilter])
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style lang="scss">

</style>
