<template>
  <v-card flat rounded color="transparent">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card
              :to="url.makeFilterRoute(entityType, 'cited_by', data.id)"
              rounded
              class="button-card pa-4 d-flex align-end"
              height="100"
          >
            <bar-graph
                :bars="data.counts_by_year.map(y => {return {key: y.year, count: y.works_count}})"
                style="height: 100%;"
                class="flex-grow-1"
                @click="clickBar"

            />
            <v-divider vertical class="mx-3"></v-divider>
            <div>
              <div class="text-h4">{{ data.cited_by_count | toPrecision }}</div>
              <div class="body-2">Incoming citations</div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="6">
          <v-card
              :to="url.makeFilterRoute(entityType, 'cited_by', data.id)"
              rounded
              outlined
              class="pa-3 text-right button-card"
          >
            <div class="text-h4">{{ data.referenced_works_count.toLocaleString() }}</div>
            <div class="body-2">References</div>
          </v-card>
        </v-col>
        <v-col cols="6">
          <v-card
              :to="url.makeFilterRoute(entityType, 'related_to', data.id)"
              rounded
              outlined
              class="pa-3 text-right button-card"
          >
            <div class="text-h4">{{ data.related_works?.length }}</div>
            <div class="body-2">Related works</div>
          </v-card>
        </v-col>

      </v-row>
    </v-container>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import BarGraph from "@/components/BarGraph.vue";

export default {
  name: "Template",
  components: {
    BarGraph,
  },
  props: {
    data: Object,
  },
  data() {
    return {
      foo: 42,
      url,
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