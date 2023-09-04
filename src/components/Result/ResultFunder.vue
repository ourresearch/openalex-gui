<template>
  <v-list-item  :to="data.id | entityZoomLink">
<!--    <v-list-item-icon>-->
<!--      <v-icon>mdi-cash-multiple</v-icon>-->
<!--    </v-list-item-icon>-->
    <v-list-item-content>

      <v-list-item-title class="primary--text">
          {{ data.display_name }}
      </v-list-item-title>
      <v-list-item-subtitle v-if="data.description" class="capitalize-first-letter">
        {{ data.description }}
      </v-list-item-subtitle>
      <v-list-item-subtitle class="">
        <result-works-count
            :works-count="data.works_count"
            :id="data.id"
            entity-type="sources"
            class="mr-4"
        />
<!--        <result-citation-count-->
<!--            :cited-by-count="data.cited_by_count"-->
<!--            entity-type="sources"-->
<!--        />-->
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
    <v-list-item-action>
      <v-btn
          icon
          color="primary"
          v-if="data.homepage_url"
          :href="data.homepage_url"
          target="_blank"
          @click.stop="$emit('click')"
      >
        <v-icon small>mdi-open-in-new</v-icon>
      </v-btn>
    </v-list-item-action>

  </v-list-item>

</template>


<script>
import ConceptsList from "../ConceptsList.vue";
import ResultCitationCount from "./ResultCitationCount.vue";
import ResultWorksCount from "./ResultWorksCount.vue";

export default {
  components: {
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