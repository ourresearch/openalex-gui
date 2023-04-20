<template>
  <div class="pa-3">

<!--      <div class="data-row" v-if="data.host_organization_name">-->
<!--        <span class="font-weight-bold">-->
<!--          Publisher:-->
<!--        </span>-->
<!--        <span>-->
<!--          {{ data.host_organization_name }}-->
<!--        </span>-->
<!--      </div>-->

<!--      <div class="data-row" v-if="data.x_concepts.length">-->
<!--        <span class="font-weight-bold">-->
<!--          Concepts:-->
<!--        </span>-->
<!--        <span>-->
<!--          <concepts-list :concepts="data.x_concepts" :is-clickable="true"/>-->
<!--        </span>-->
<!--      </div>-->

<!--      <div class="data-row">-->
<!--        <span class="font-weight-bold">-->
<!--          Access:-->
<!--        </span>-->
<!--        <span>-->
<!--          <span v-if="!data.is_oa">-->
<!--            toll-access-->
<!--          </span>-->
<!--          <span v-else>-->
<!--            Open Access-->
<!--            <template v-if="doajLink">(indexed in <a target="_blank" :href="doajLink">DOAJ</a>)</template>-->
<!--          </span>-->
<!--        </span>-->
<!--      </div>-->






  </div>


</template>


<script>
import LinkToSearch from "./LinkToSearch";
import LinkToEntity from "./LinkToEntity";
import EntityIcon from "./EntityIcon";
import ConceptsList from "./ConceptsList";
import EntitySummaryStats from "@/components/EntitySummaryStats.vue";

export default {
  name: "EntityPublisher",
  components: {
    LinkToSearch,
    LinkToEntity,
    EntityIcon,
    ConceptsList,
    EntitySummaryStats,
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

<style lang="scss" scoped>
table {
  span.font-weight-bold {
    white-space: nowrap;
    vertical-align: top;
    color: #555;
    font-size: 15px;
  }
}

</style>