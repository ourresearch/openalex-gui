<template>
  <div>


          <!--   HTML at repository, paywalled at publisher -->
          <v-btn
              :href="htmlUrl"
              target="_blank"
              color="primary"
              class="mr-3"
              small
              rounded
              text
              v-if="isGreenOa && !pdfUrl"
          >
            <v-icon left small>mdi-file-document</v-icon>
            HTML
          </v-btn>


          <!--   PDF anywhere -->
          <v-btn
              :href="pdfUrl"
              target="_blank"
              color="primary"
              class="mr-3"
              small
              rounded
              text
              v-if="pdfUrl"
          >
            <v-icon left small>mdi-file-pdf-box</v-icon>
            PDF
          </v-btn>

          <!--   HTML  at publisher -->
          <v-btn
              :href="htmlUrl"
              target="_blank"
              color="primary"
              small
              rounded
              text
              v-if="isOaAtPublisher"
          >
            <v-icon left small>mdi-file-document</v-icon>
            HTML
          </v-btn>


          <!--   Paywalled at publisher-->
          <v-btn
              :href="data.primary_location.landing_page_url"
              target="_blank"
              text
              small
              rounded
              v-if="!isOaAtPublisher"
          >
            <v-icon left small>mdi-lock-outline</v-icon>
            HTML
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