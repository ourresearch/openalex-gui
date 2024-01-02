<template>
  <div>


    <!--   PDF anywhere -->
    <v-btn
        :href="pdfUrl"
        target="_blank"
        color="primary"
        class="mr-3"
        v-if="pdfUrl"
        rounded
    >
      <v-icon left>mdi-file-pdf-box</v-icon>
      PDF
    </v-btn>


    <!--       Has-PDF linkout -->
    <v-btn
        :href="data.primary_location.landing_page_url"
        target="_blank"
        v-if="pdfUrl"
        icon
    >
      <v-icon>mdi-open-in-new</v-icon>
    </v-btn>

    <!--       No-PDF linkout -->
    <v-btn
        :href="data.primary_location.landing_page_url"
        target="_blank"
        v-if="!pdfUrl"
        rounded
        outlined
    >
      Paywalled
      <v-icon right>mdi-open-in-new</v-icon>
    </v-btn>


    <!--   HTML at repository, paywalled at publisher -->
    <!--          <v-btn-->
    <!--              :href="htmlUrl"-->
    <!--              target="_blank"-->
    <!--              color="primary"-->
    <!--              class="mr-3"-->
    <!--              icon-->
    <!--              rounded-->
    <!--              v-if="isGreenOa && !pdfUrl"-->
    <!--          >-->
    <!--            <v-icon>mdi-file-document</v-icon>-->
    <!--          </v-btn>-->

    <!--   HTML  at publisher -->
    <!--          <v-btn-->
    <!--              :href="htmlUrl"-->
    <!--              target="_blank"-->
    <!--              color="primary"-->
    <!--              icon-->
    <!--              v-if="isOaAtPublisher"-->
    <!--          >-->
    <!--            <v-icon>mdi-file-document</v-icon>-->
    <!--          </v-btn>-->


    <!--   Paywalled at publisher-->
    <!--          <v-btn-->
    <!--              :href="data.primary_location.landing_page_url"-->
    <!--              target="_blank"-->
    <!--              icon-->
    <!--              v-if="!isOaAtPublisher"-->
    <!--          >-->
    <!--            <v-icon>mdi-lock-outline</v-icon>-->
    <!--          </v-btn>-->

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