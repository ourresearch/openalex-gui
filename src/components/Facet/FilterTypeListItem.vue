<template>
  <v-list-item
      @click="$emit('select')"
      style="min-height: 30px;"
  >
    {{ config.displayName }}
  </v-list-item>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";

export default {
  name: "FilterTypeListItem",
  components: {},
  props: {
    facetKey: String,
  },
  data() {
    return {
      loading: false,
      apiResp: {},
      isChecked: this.showChecked,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
    ]),
    config() {
      return getFacetConfig(this.facetKey)
    },
    link(){
      return {
        name: "filter",
        params: {
          filterTypeKey: this.facetKey,
        },
        query: {...this.$route.query}
      }
    }
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([
    ]),
  },

  created() {
  },
  async mounted() {

  },
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>