<template>
  <div>
    <v-btn icon small><v-icon small>mdi-close</v-icon></v-btn>
    <span class="grey--text">
<!--      this will break, the getFacetConfig signature has changed -->
    </span>
    <span>
      {{ filterDisplayValue }}
    </span>

  </div>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../facetConfigs";


export default {
  name: "FilterChip",
  components: {},
  props: {
    filterKey: String,
    filterValue: String,
    filterDisplayValue: String,
  },
  data() {
    return {
      loading: false,
      getFacetConfig,
    }
  },
  computed: {
    ...mapGetters([]),
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