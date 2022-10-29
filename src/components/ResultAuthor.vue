<template>
  <v-row>
    <v-col cols="10">
      <div>
        <router-link  class="text-decoration-none" :to="data.id | entityZoomLink">
          {{ data.display_name }}
        </router-link>
      </div>
      <div v-if="data.last_known_institution" class="d-inline-flex align-center">
        <flag :squared="false" :iso="data.last_known_institution.country_code" style="height:12px; margin-right: 3px;" />
        {{ data.last_known_institution.display_name }}
      </div>
      <div>
<!--        <v-chip-->
<!--            outlined-->
<!--            class="mr-1 mb-1"-->
<!--            v-for="concept in data.x_concepts.slice(0,4)"-->
<!--            :key="concept.id"-->
<!--        >-->
<!--          {{ concept.display_name }}-->
<!--        </v-chip>-->
        <concepts-list :concepts="data.x_concepts" />


      </div>
      <div >
        <result-works-count
            :works-count="data.works_count"
            :id="data.id"
            entity-type="authors"
            class="mr-4"
        />
        <result-citation-count
            :cited-by-count="data.cited_by_count"
            entity-type="authors"
        />
      </div>
    </v-col>
  </v-row>
</template>


<script>
import ConceptsList from "./ConceptsList";
import ResultCitationCount from "./ResultCitationCount";
import ResultWorksCount from "./ResultWorksCount";


export default {
  components: {
    ConceptsList,
    ResultCitationCount,
    ResultWorksCount,
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
    conceptNamesString(){
      return this.data.x_concepts.slice(0, 4).map(c => c.display_name).join(", ")
    }
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