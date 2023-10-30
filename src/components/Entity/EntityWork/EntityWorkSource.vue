<template>
  <v-list-item
      :href="loc.landing_page_url"
      target="_blank"
  >
    <v-list-item-icon>
      <v-icon>
        {{ loc.is_oa ? 'mdi-lock-open-variant-outline' : 'mdi-lock-outline' }}
      </v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>
        {{ displayName }}
      </v-list-item-title>
      <v-list-item-subtitle>
        <span v-if="isCanonical">Canonical</span>
<!--        <span class="text-capitalize">{{ myVersion }}</span>-->
      </v-list-item-subtitle>

    </v-list-item-content>
    <v-list-item-action>
      <v-btn
          icon
          v-if="loc.pdf_url"
          :href="loc.pdf_url"
          target="_blank"
      >
        <v-icon>mdi-file-pdf-box</v-icon>
      </v-btn>

      <v-list-item-action-text>
        {{ myVersion }}
      </v-list-item-action-text>
    </v-list-item-action>
    <v-list-item-action>
      <v-btn
          icon
          :href="loc.landing_page_url"
          target="_blank"
      >
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-list-item-action>


  </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "EntityWorkSource",
  components: {},
  props: {
    loc: Object,
    isCanonical: Boolean,
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
    displayName() {
      return (this.loc.source && this.loc.source.display_name) ?
          this.loc.source.display_name.replace(/\(.+?\)/, "") :
          "Unknown source"
    },
    myVersion() {
      return this.loc?.version?.replace("Version", "")
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