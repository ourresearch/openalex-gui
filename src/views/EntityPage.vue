<template>
  <v-container class="entity-page">
    <h1 class="text-h3 my-12">{{ $route.params.entityType }} entity: </h1>
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

      </v-btn>
      <works-entity v-if="$route.params.entityType==='works'" :data="apiResp"/>

    </div>
  </v-container>
</template>

<script>

import {api} from "../api";
import WorksEntity from "../components/WorksEntity";

export default {
  name: "EntityPage",
  components: {
    WorksEntity,
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
  computed: {},
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