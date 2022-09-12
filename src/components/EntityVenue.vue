<template>
  <div>
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
      <view-in-api-button :id="data.id" />
      <v-btn v-if="data.homepage_url" :href="data.homepage_url" class="mr-4">
        View webpage
      </v-btn>
    </div>
    <v-divider class="mt-12 pt-12" />

    <div class="text-h4 mt-12">
      {{data.works_count.toLocaleString()}} hosted works
    </div>
    Click to view in API: <a :href="data.works_api_url" target="_blank">{{data.works_api_url}}</a>



  </div>


</template>


<script>
import LinkConcept from "./LinkConcept";
import ViewInApiButton from "./ViewInApiButton";

export default {
  name: "EntityVenue",
  components: {
    LinkConcept,
    ViewInApiButton,
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