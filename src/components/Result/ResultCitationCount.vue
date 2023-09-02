<template>
  <v-btn
      text
      :disabled="!formatAsLink"
      class="px-1"
      style="font-weight: normal !important;"
      :to="linkToCitingPapers"
      @click.stop="$emit('click')"
      color="primary"
  >
    <v-icon
        left
        :color="(formatAsLink) ? null : 'grey'"
    >
      mdi-format-quote-close
    </v-icon>
    Cited by {{ citedByCount | toPrecision }}
  </v-btn>
</template>

<script>
import {mapGetters, mapMutations, mapActions,} from 'vuex'

export default {
  name: "ResultCitationCount",
  components: {},
  props: {
    citedByCount: Number,
    id: String,
    entityType: String,
    linkToSearch: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      loading: false,
    }
  },
  computed: {
    ...mapGetters([]),
    formatAsLink() {
      return this.id && this.entityType && this.citedByCount > 0
    },
    iconColor() {
      if (this.id && this.entityType && this.citedByCount > 0) return "primary"
      return "#333333"
    },
    linkToCitingPapers() {
      if (!this.id || !this.entityType) return ""

      const shortId = this.id.replace("https://openalex.org/", "")
      return {
        name: "Serp",
        params: {entityType: "works"},
        query: {filter: `cites:${shortId}`}
      }
    },
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([]),
  },

  created() {
  },
  async mounted() {
  },
  watch: {}
}
</script>

<style scoped>

</style>