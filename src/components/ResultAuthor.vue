<template>
  <div>
    <div>
      <div>
        <router-link  class="text-decoration-none" :to="data.id | idLink">
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
        <span class="mr-3">{{data.works_count.toLocaleString()}} Works</span>
        <result-citation-count
            :cited-by-count="data.cited_by_count"
        />
      </div>
    </div>
  </div>
</template>


<script>
import ConceptsList from "./ConceptsList";
import ResultCitationCount from "./ResultCitationCount";


export default {
  components: {
    ConceptsList,
    ResultCitationCount,
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