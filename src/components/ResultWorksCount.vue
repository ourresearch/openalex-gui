<template>
  <span class="body-1">
    <v-icon small :color="(formatAsLink) ? 'primary' : '#333'" style="vertical-align: 0;">{{icon}}</v-icon>
    <router-link
        :to="linkToWorks"
        class="text-decoration-none"
        v-if="formatAsLink"
    >
      {{ worksCount | toPrecision }} works
    </router-link>
    <span class="" v-else>
      {{ worksCount | toPrecision }} works
    </span>

  </span>
</template>

<script>
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {entityConfigs} from "../entityConfigs";
import {createSimpleFilter} from "@/filterConfigs";

export default {
  name: "ResultWorksCount",
  components: {},
  props: {
    worksCount: Number,
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
      return this.id && this.entityType && this.worksCount > 0
    },
    icon() {
      return entityConfigs.works.icon
    },
    iconColor() {
      if (this.id && this.entityType && this.worksCount > 0) return "primary"
      return "#333333"
    },
    linkToWorks() {
      if (!this.id || !this.entityType) return false

      const filter = createSimpleFilter(
          "works",
          entityConfigs[this.entityType].filterKey,
          this.id,
      )
      return {
        name: "Serp",
        params: {entityType: "works"},
        query: {filter: filter.asStr},
      }



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