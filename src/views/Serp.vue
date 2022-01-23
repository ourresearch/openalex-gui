<template>
  <v-container class="entity-page">
    <search-box />
    <div>
      <div
          v-for="result in $store.state.results"
          class="result-container my-4"
          :key="result.id"
      >
        <result-work :data="result" />
      </div>
    </div>
  </v-container>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {api} from "../api";
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import SearchBox from "../components/SearchBox";

import ResultWork from "../components/ResultWork";

export default {
  name: "EntityPage",
  metaInfo() {
    return {
      title: `${this.entityId}`
    }
  },
  components: {
    SearchBox,
    ResultWork,
  },
  props: {},
  data() {
    return {
      foo: 42,
      loading: false,
      apiResp: {},
    }
  },
  computed: {
    ...mapGetters([
        "searchEntityType",
        "searchFilters",
        "searchResults",
        "searchIsLoading",
    ]),
    entityType() {
      return this.$route.params.entityType
    },
    entityId() {
      return this.$route.params.id
    },
    apiUrl() {
      return `/${this.entityType}/${this.entityId}`
    },
  },
  methods: {
    ...mapMutations([
    ]),
    ...mapActions([
      "updateTextSearch",
    ]),
    getFilterValue(k){

    }
  },

  created() {
  },
  async mounted() {
    this.loading = true
    // this.apiResp = await api.get(this.apiUrl)
    this.loading = false

  },
  watch: {}
}
</script>

<style scoped>

</style>