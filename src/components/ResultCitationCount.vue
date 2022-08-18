<template>
  <span class="body-1">
      <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <span
                v-bind="attrs"
                v-on="on"
            >
              <v-icon small :color="(citedByCount) ? 'primary' : 'grey'">mdi-format-quote-close</v-icon>
              <router-link
                  :to="linkToCitingPapers"
                  class="text-decoration-none"
                  v-if="citedByCount"
              >
                {{ citedByCount.toLocaleString() }}
              </router-link>
              <span class="ml-1" v-else>0</span>
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
  },
  data() {
    return {
      loading: false,
    }
  },
  computed: {
    ...mapGetters([]),
    linkToCitingPapers() {
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