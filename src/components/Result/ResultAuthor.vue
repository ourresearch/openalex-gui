<template>
  <v-list-item>
    <v-list-item-content>
      <v-list-item-title class="">
        <router-link class="text-decoration-none" :to="data.id | entityZoomLink">
          {{ data.display_name }}
        </router-link>
      </v-list-item-title>
      <v-list-item-subtitle v-if="data.last_known_institution" class="text-wrap">
        <!--          <flag :squared="false" :iso="data.last_known_institution.country_code" style="height:12px; margin-right: 3px;" />-->
        {{ data.last_known_institution.display_name }}
        -
        <concepts-list :concepts="data.x_concepts"/>
      </v-list-item-subtitle>
      <v-list-item-subtitle class="">
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
    computed: {
        conceptNamesString() {
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