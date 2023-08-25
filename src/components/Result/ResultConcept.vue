<template>
  <v-list-item>
    <v-list-item-content>

      <v-list-item-title>
        <router-link class="text-decoration-none" :to="data.id | entityZoomLink">
          {{ data.display_name }}
        </router-link>
      </v-list-item-title>
      <v-list-item-subtitle v-if="data.description" class="capitalize-first-letter">
        {{ data.description }}
      </v-list-item-subtitle>
      <v-list-item-subtitle>
        <result-works-count
            :works-count="data.works_count"
            :id="data.id"
            entity-type="concepts"
            class="mr-4"
        />
        <result-citation-count
            :cited-by-count="data.cited_by_count"
            entity-type="concepts"
        />
      </v-list-item-subtitle>

    </v-list-item-content>
  </v-list-item>
</template>


<script>
import ConceptsList from "../ConceptsList.vue";
import ResultCitationCount from "./ResultCitationCount.vue";
import ResultWorksCount from "./ResultWorksCount.vue";

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