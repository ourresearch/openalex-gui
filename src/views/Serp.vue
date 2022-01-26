<template>
  <v-container class="entity-page">
    <v-alert type="warning" text class="mx-3">
      jason: it's not supposed to be pretty yet.
    </v-alert>
    <search-box :allow-all-entities="false" />
    <div>
      <div
          v-for="result in $store.state.results"
          class="result-container my-4"
          :key="result.id"
      >
        <result-work v-if="$store.state.entityType === 'works'" :data="result" />
        <result-author v-if="$store.state.entityType === 'authors'" :data="result" />
        <result-venue v-if="$store.state.entityType === 'venues'" :data="result" />
        <result-institution v-if="$store.state.entityType === 'institutions'" :data="result" />
        <result-concept v-if="$store.state.entityType === 'concepts'" :data="result" />
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
import ResultAuthor from "../components/ResultAuthor";
import ResultVenue from "../components/ResultVenue";
import ResultInstitution from "../components/ResultInstitution";
import ResultConcept from "../components/ResultConcept";

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
    ResultAuthor,
    ResultVenue,
    ResultInstitution,
    ResultConcept,
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