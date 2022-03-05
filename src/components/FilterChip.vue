<template>
  <v-chip
    outlined
    close
    close-icon="mdi-close"
  >
    {{ getFacetConfig(filterKey, "displayName") }}: {{filterDispayName}}
  </v-chip>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import { getFacetConfig} from "../facetConfigs";


export default {
  name: "FilterChip",
  components: {
  },
  props: {
    filter: null,
    filterKey: String,
    filterValue: String,
    filterDispayName: String,
  },
  data() {
    return {
      loading: false,
      getFacetConfig,
    }
  },
  computed: {
    ...mapGetters([

    ]),
    page: {
      get() {
        return this.$store.state.page
      },
      set(val) {
        this.$store.dispatch("setPage", val)
      }
    },
  },
  methods: {
    ...mapMutations([

    ]),
    ...mapActions([

    ]),
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