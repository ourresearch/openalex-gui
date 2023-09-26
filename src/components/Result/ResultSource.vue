<template>
  <v-list-item :to="data.id | entityZoomLink">
<!--    <v-list-item-icon>-->
<!--      <v-icon>mdi-book-open-outline</v-icon>-->
<!--    </v-list-item-icon>-->
    <v-list-item-content>
      <v-list-item-title class="primary--text">
        {{ data.display_name }}
      </v-list-item-title>
      <v-list-item-subtitle v-if="data.host_organization_name" class="">
        {{ data.host_organization_name }}
      </v-list-item-subtitle>
      <!--      <v-list-item-subtitle>-->
      <!--        <concepts-list :concepts="data.x_concepts"/>-->
      <!--      </v-list-item-subtitle>-->
      <v-list-item-subtitle>
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
    <!--    <div class="align-self-start mt-3">-->
    <!--      <a-->
    <!--                  v-if="fulltextLinkObj"-->
    <!--                  :href="fulltextLinkObj.href"-->
    <!--                  target="_blank"-->
    <!--                  class="text-decoration-none"-->
    <!--          >-->
    <!--            <v-icon color="primary"  >-->
    <!--              {{ fulltextLinkObj.icon }}-->
    <!--            </v-icon>-->
    <!--&lt;!&ndash;            [{{ fulltextLinkObj.text }}]&ndash;&gt;-->
    <!--          </a>-->
    <!--    </div>-->

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