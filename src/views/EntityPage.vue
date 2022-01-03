<template>
  <v-container class="entity-page">
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

            <entity-work v-if="entityType==='works'" :data="apiResp"/>
            <entity-author v-if="entityType==='authors'" :data="apiResp"/>
            <entity-venue v-if="entityType==='venues'" :data="apiResp"/>
            <entity-institution v-if="entityType==='institutions'" :data="apiResp"/>
            <entity-concept v-if="entityType==='concepts'" :data="apiResp"/>
      <!--      <works-entity :data="apiResp"/>-->

    </div>
  </v-container>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {api} from "../api";
import EntityWork from "../components/EntityWork";
import EntityAuthor from "../components/EntityAuthor";
import EntityVenue from "../components/EntityVenue";
import EntityInstitution from "../components/EntityInstitution";
import EntityConcept from "../components/EntityConcept";

export default {
  name: "EntityPage",
  metaInfo() {
    return {
      title: `${this.entityId}`
    }
  },
  components: {
    EntityWork,
    EntityAuthor,
    EntityVenue,
    EntityInstitution,
    EntityConcept,
    // VueJsonPretty,
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
  created() {
  },
  async mounted() {
    this.loading = true
    this.apiResp = await api.get(this.apiUrl)
    this.loading = false

  },
  watch: {}
}
</script>

<style scoped>

</style>