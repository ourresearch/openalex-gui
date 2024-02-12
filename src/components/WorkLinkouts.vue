<template>
  <div v-if="data">


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

    <!--   HTML free at publisher -->
    <v-btn
        :href="htmlUrl"
        target="_blank"
        color="primary"
        text
        class="mr-3"
        rounded
        v-if="isOaAtPublisher"
    >
      <v-icon left>mdi-web</v-icon>
      Online
    </v-btn>


    <!--   Paywalled at publisher-->
    <v-btn
        :href="data.primary_location.landing_page_url"
        target="_blank"
        class="mr-3"
        text
        rounded
        v-if="!isOaAtPublisher"
    >
      <v-icon left>mdi-web</v-icon>
      Online (pay)
    </v-btn>



    <!--       Has-PDF linkout -->
    <!--    <v-btn-->
    <!--        :href="data.primary_location.landing_page_url"-->
    <!--        target="_blank"-->
    <!--        v-if="pdfUrl"-->
    <!--        text-->
    <!--        rounded-->
    <!--    >-->
    <!--      <v-icon left>mdi-lock-open-variant-outline</v-icon>-->
    <!--      View-->
    <!--&lt;!&ndash;      <v-icon>mdi-open-in-new</v-icon>&ndash;&gt;-->
    <!--    </v-btn>-->

    <!--       No-PDF linkout -->
    <!--    <v-btn-->
    <!--        :href="data.primary_location.landing_page_url"-->
    <!--        target="_blank"-->
    <!--        v-if="!pdfUrl"-->
    <!--        rounded-->
    <!--        text-->
    <!--    >-->
    <!--      <v-icon left>mdi-lock-outline</v-icon>-->
    <!--      Read-->
    <!--    </v-btn>-->


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