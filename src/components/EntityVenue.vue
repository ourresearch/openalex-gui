<template>
  <v-container>
    <div class="font-weight-bold">📚 Venue</div>
    <h1 class="text-h3">{{ data.display_name }}</h1>
    <div>{{data.publisher}}</div>
    <div v-if="data.is_oa">
      <v-icon small>mdi-lock-open-outline</v-icon>
      Open Access<template v-if="data.is_in_doaj"> and indexed in <a href="https://doaj.org/">DOAJ</a></template>
    </div>
    <div class="mt-4">
      <link-concept
            v-for="concept in data.x_concepts"
            :key="concept.id"
            :data="concept"
        />
    </div>


    <div class="mt-8 ">
      <v-btn color="primary" class="mr-4" :href="apiUrl" target="_blank">
        View in API
      </v-btn>
      <v-btn v-if="data.homepage_url" :href="data.homepage_url" class="mr-4">
        View webpage
      </v-btn>
    </div>
    <v-divider class="mt-12 pt-12" />

    <div class="text-h4 mt-12">
      {{data.works_count.toLocaleString()}} hosted works
    </div>
    Click to view in API: <a :href="data.works_api_url" target="_blank">{{data.works_api_url}}</a>



  </v-container>


</template>


<script>
import LinkConcept from "./LinkConcept";

export default {
  name: "EntityVenue",
  components: {
    LinkConcept,
  },
  props: {
    data: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
    apiUrl() {
      const shortId = this.data.id.replace("https://openalex.org/", "")
      return `https://api.openalex.org/venues/${shortId}`
    },
  },
  created() {
  },
  mounted() {

  },
  watch: {}
}
</script>

<style lang="scss">


</style>