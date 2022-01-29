<template>
  <div>
    <div>
      <router-link  class="text-decoration-none" :to="data.id | idLink">
        {{ data.display_name }}
      </router-link>
    </div>
<!--    <div v-if="data.last_known_institution">-->
<!--      {{ data.last_known_institution.display_name }} ({{ data.last_known_institution.country_code }})-->
<!--    </div>-->
    <div>
      <concepts-list :concepts="data.related_concepts"/>
    </div>
    <div class="body-1">
      <span class="mr-3">{{ data.works_count.toLocaleString() }} Works</span>
      <span>Cited by {{ data.cited_by_count.toLocaleString() }}</span>
    </div>
  </div>
</template>


<script>
import ConceptsList from "./ConceptsList";

export default {
  components: {
    ConceptsList,
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