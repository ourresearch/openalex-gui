<template>
  <v-card flat rounded color="transparent">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card
              :to="url.makeFilterRoute(entityType, 'cited_by', data.id)"
              rounded
              outlined
              class="pa-3 text-right button-card"
          >
            <div class="text-h4">{{ data.cited_by_count | toPrecision }}</div>
            <div class="body-2">Incoming citations</div>
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

export default {
  name: "Template",
  components: {},
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