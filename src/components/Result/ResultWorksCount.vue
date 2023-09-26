<template>
  <v-btn
      text
      small
      :disabled="!formatAsLink"
      class="px-1"
      style="font-weight: normal !important;"
      :to="linkToWorks"
      @click.stop="$emit('click')"
      color="primary"
  >
    <v-icon
        left
        :color="(formatAsLink) ? 'primary' : '#333'" style="vertical-align: 0;"
    >
      {{ icon }}
    </v-icon>
    {{ worksCount | toPrecision }} works

  </v-btn>
</template>

<script>
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {entityConfigs} from "../../entityConfigs";
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
  watch: {
    '$route': {
      immediate: true,
      handler: function(to, from){

      }
    }
  }
}
</script>

<style scoped>

</style>