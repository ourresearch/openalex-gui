<template>
  <v-list-item :to="data.id | entityZoomLink">
<!--    <v-list-item-icon>-->
<!--      <v-icon>mdi-town-hall</v-icon>-->
<!--    </v-list-item-icon>-->
    <v-list-item-content>
      <v-list-item-title class="primary--text">
          {{ data.display_name }}
      </v-list-item-title>
      <v-list-item-subtitle
          v-if="data.geo.country"
          class=""
      >
<!--        <flag :squared="false" :iso="data.geo.country_code" style="height:12px; margin-right: 3px;"/>-->
        <span class="mr-1" v-if="data.geo.city">{{ data.geo.city }},    </span> {{ data.geo.country }}
      </v-list-item-subtitle>
      <!--    <div>-->
      <!--      <concepts-list :concepts="data.x_concepts"/>-->
      <!--    </div>-->
      <v-list-item-subtitle class="">
        <result-works-count
            :works-count="data.works_count"
            :id="data.id"
            entity-type="institutions"
            class="mr-4"
        />
<!--        <result-citation-count-->
<!--            :cited-by-count="data.cited_by_count"-->
<!--            entity-type="institutions"-->
<!--        />-->
      </v-list-item-subtitle>
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