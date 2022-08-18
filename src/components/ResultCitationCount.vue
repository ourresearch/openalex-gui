<template>
  <span class="body-1">
      <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <span
                v-bind="attrs"
                v-on="on"
            >
              <v-icon small :color="(formatAsLink) ? 'primary' : '#333'">mdi-format-quote-close</v-icon>
              <router-link
                  :to="linkToCitingPapers"
                  class="text-decoration-none"
                  v-if="formatAsLink"
              >
                {{ citedByCount.toLocaleString() }}
              </router-link>
              <span class="" v-else>
                {{ citedByCount.toLocaleString() }}
              </span>
            </span>
          </template>
          <span>Cited by {{ citedByCount.toLocaleString() }} works</span>
        </v-tooltip>
    
  </span>
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
      type:Boolean,
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
    formatAsLink(){
      return this.id && this.entityType && this.citedByCount > 0
    },
    iconColor(){
      if (this.id && this.entityType && this.citedByCount > 0) return "primary"
      return "#333333"
    },
    linkToCitingPapers() {
      if (!this.id || !this.entityType) return false

      const shortId = this.id.replace("https://openalex.org/", "")
      return {
        name: "Serp",
        params: {entityType: this.entityType},
        query: {filter: `referenced_works:${shortId}`}
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