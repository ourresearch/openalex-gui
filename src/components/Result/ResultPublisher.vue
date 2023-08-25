<template>
  <v-list-item>
    <v-list-item-content>

      <v-list-item-title>
        <router-link class="text-decoration-none" :to="data.id | entityZoomLink">
          {{ data.display_name }}
        </router-link>
      </v-list-item-title>
      <!--    <div v-if="data.publisher" class="body-2">-->
      <!--      {{ data.publisher }}-->
      <!--    </div>-->
      <!--      <div>-->
      <!--        <concepts-list :concepts="data.x_concepts"/>-->
      <!--      </div>-->
      <v-list-item-subtitle class="">
        <result-works-count
            :works-count="data.works_count"
            :id="data.id"
            entity-type="sources"
            class="mr-4"
        />
        <result-citation-count
            :cited-by-count="data.cited_by_count"
            entity-type="sources"
        />
      </v-list-item-subtitle>
      <!--    <v-col cols="3" class="justify-end d-flex">-->
      <!--      <a-->
      <!--          :href="data.homepage_url"-->
      <!--          target="_blank"-->
      <!--          class="mx-3 text-decoration-none"-->
      <!--          v-if="data.homepage_url && data.is_oa"-->
      <!--      >-->
      <!--        <v-icon small color="primary">mdi-lock-open-variant-outline</v-icon>-->
      <!--        Open Access-->
      <!--      </a>-->


      <!--    </v-col>-->
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