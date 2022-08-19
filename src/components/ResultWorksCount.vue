<template>
  <span class="body-1">
      <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <span
                v-bind="attrs"
                v-on="on"
            >
              <v-icon small :color="(formatAsLink) ? 'primary' : '#333'">{{icon}}</v-icon>
              <router-link
                  :to="linkToWorks"
                  class="text-decoration-none"
                  v-if="formatAsLink"
              >
                {{ worksCount.toLocaleString() }}
              </router-link>
              <span class="" v-else>
                {{ worksCount.toLocaleString() }}
              </span>
            </span>
          </template>
          <span>
            <template v-if="entityType=='works'">
              Related works
            </template>
            <template v-if="entityType=='authors'">
              Works created by this person
            </template>
            <template v-if="entityType=='venues'">
              Works published in this venue
            </template>
            <template v-if="entityType=='institutions'">
              Works published by people at this institution
            </template>
            <template v-if="entityType=='concepts'">
              Works tagged with this concept
            </template>
          </span>
        </v-tooltip>

  </span>
</template>

<script>
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {entityConfigs} from "../entityConfigs";

export default {
  name: "ResultWorksCount",
  components: {},
  props: {
    worksCount: Number,
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
      return this.id && this.entityType && this.worksCount > 0
    },
    icon(){
      return entityConfigs.works.icon
    },
    iconColor(){
      if (this.id && this.entityType && this.worksCount > 0) return "primary"
      return "#333333"
    },
    linkToWorks() {
      if (!this.id || !this.entityType) return false

      const shortId = this.id.replace("https://openalex.org/", "")
      const filterName = entityConfigs[this.entityType].filterName + ".id"
      return {
        name: "Serp",
        params: {entityType: "works"},
        query: {filter: `${filterName}:${shortId}`}
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