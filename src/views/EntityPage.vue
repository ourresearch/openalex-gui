<template>
  <v-container class="entity-page">
    <h1 class="text-h3 my-12">{{entityType }} entity: {{this.entityId}}</h1>
    <div class="loading" v-if="loading">
      loading....
    </div>
    <div class="loaded" v-if="!loading">
      <v-btn
          color="primary"
          large
          class="mb-12"
          target="_blank"
          :href="`https://openalex-guts.herokuapp.com/${$route.params.entityType}/${$route.params.id}`"
      >
        view in API
        <v-icon right>mdi-open-in-new</v-icon>

      </v-btn>

      <v-card class="pa-5" color="#fafafa">
      <div class="text-h4">
        JSON data
      </div>
      <div class="body-2 mb-9">(click brackets to collapse/expand objects)</div>

      <vue-json-pretty :data="apiResp" />

      </v-card>


<!--      <works-entity v-if="entityType==='works'" :data="apiResp"/>-->
<!--      <works-entity :data="apiResp"/>-->

    </div>
  </v-container>
</template>

<script>

import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';



import {api} from "../api";
import WorksEntity from "../components/WorksEntity";

export default {
  name: "EntityPage",
  metaInfo() {
    return {
      title: `${this.entityId}`
    }
  },
  components: {
    WorksEntity,
    VueJsonPretty,
  },
  props: {},
  data() {
    return {
      foo: 42,
      loading: false,
      apiResp: {},
    }
  },
  methods: {},
  computed: {
    entityType(){
      return this.$route.params.entityType
    },
    entityId(){
      return this.$route.params.id
    }
  },
  created() {
  },
  async mounted() {
    this.loading = true
    this.apiResp = await api.get("/works/W2741809807")
    this.loading = false

  },
  watch: {}
}
</script>

<style scoped>

</style>