<template>
  <div v-if="data">
    <v-btn
        rounded
        :href="data.primary_location.landing_page_url"
        target="_blank"
        :color="data.primary_location?.is_oa ? 'primary' : 'grey darken-1'"
        :dark="!data.primary_location?.is_oa"
        class="mr-3"
    >
<!--      <v-icon left>mdi-web</v-icon>-->
      <template v-if="data.primary_location?.source?.display_name === 'PubMed'">
        PubMed
      </template>
      <template v-else-if="isOaAtPublisher">
        HTML
      </template>
      <template v-else>
        <v-icon left>mdi-lock</v-icon>
        HTML
      </template>
      <v-icon small class="ml-1">mdi-open-in-new</v-icon>
    </v-btn>


    <!--   PDF anywhere -->
    <v-btn
        rounded
        color="primary"
        :href="pdfUrl"
        target="_blank"
        class="mr-3"
        v-if="pdfUrl"
    >
      PDF
    </v-btn>



  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
  props: {
    data: Object,
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

    oaUrl() {
      return this.data.open_access.oa_url
    },
    pdfUrl() {
      return this.data.best_oa_location?.pdf_url
    },
    htmlUrl() {
      return this.data.best_oa_location.landing_page_url
    },
    isGreenOa() {
      return this.data.open_access?.oa_status === 'green'
    },
    isOaAtPublisher() {
      return this.data.open_access?.is_oa && this.data.open_access?.oa_status !== 'green'
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
  watch: {}
}
</script>

<style scoped lang="scss">

</style>