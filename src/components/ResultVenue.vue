<template>
  <div>
    <div>
      <v-icon small v-if="!data.is_oa">mdi-lock-outline</v-icon>
      <v-icon small v-else>mdi-lock-open-variant-outline</v-icon>

      <router-link  class="text-decoration-none" :to="data.id | idLink">
        {{ data.display_name }}
      </router-link>
    </div>
<!--    <div v-if="data.publisher" class="body-2">-->
<!--      {{ data.publisher }}-->
<!--    </div>-->
    <div>
      <concepts-list :concepts="data.x_concepts"/>
    </div>
    <div class="body-1">
      <span class="mr-3">{{ data.works_count.toLocaleString() }} Works</span>
      <result-citation-count
            :cited-by-count="data.cited_by_count"
            entity-type="venues"
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