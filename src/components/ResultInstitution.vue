<template>
  <div>
    <div>
      <router-link class="text-decoration-none" :to="data.id | idLink">
        {{ data.display_name }}
      </router-link>
    </div>
    <div v-if="data.geo.country" class="d-inline-flex align-center">
      <flag :squared="false" :iso="data.geo.country_code" style="height:12px; margin-right: 3px;"/>
      <span class="mr-1" v-if="data.geo.city">{{data.geo.city}},    </span>     {{ data.geo.country }}
    </div>

    <div v-if="data.last_known_institution" >
      {{ data.last_known_institution.display_name }}
    </div>

    <div>
      <concepts-list :concepts="data.x_concepts"/>
    </div>
    <div class="body-1">
      <span class="mr-3">{{ data.works_count.toLocaleString() }} Works</span>
      <result-citation-count
            :cited-by-count="data.cited_by_count"
            entity-type="institutions"
        />
    </div>
  </div>
</template>


<script>
import ConceptsList from "./ConceptsList";
import ResultCitationCount from "./ResultCitationCount";

export default {
  components: {
    ConceptsList,
    ResultCitationCount
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
  computed: {},
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style lang="scss">


</style>