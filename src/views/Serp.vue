<template>
  <v-container class="entity-page">
    <h3>hola serp</h3>
<!--    <h1 class="text-h3 my-12">{{ entityType }} entity: {{ this.entityId }}</h1>-->
    <div class="loading" v-if="!apiResp.id">
      loading....
    </div>
    <div class="loaded" v-if="apiResp.id">


<!--      <v-card class="pa-5" color="#fafafa">-->
<!--        <div class="text-h4">-->
<!--          JSON data-->
<!--        </div>-->
<!--        <div class="body-2 mb-9">(click brackets to collapse/expand objects)</div>-->
<!--        <vue-json-pretty :data="apiResp"/>-->
<!--      </v-card>-->

    </div>
  </v-container>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {api} from "../api";
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import SearchBox from "../components/SearchBox";

export default {
  name: "EntityPage",
  metaInfo() {
    return {
      title: `${this.entityId}`
    }
  },
  components: {
    SearchBox,
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
    ]),},
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