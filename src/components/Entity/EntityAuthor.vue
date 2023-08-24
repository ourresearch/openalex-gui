<template>
    <div class="pa-3">
      <div class="data-row" v-if="data.last_known_institution">
        <span class="font-weight-bold">
          Institution:
        </span>
        <span>
          <link-to-entity
              :entity="data.last_known_institution"
          />
        </span>
      </div>

      <div class="data-row" v-if="data.x_concepts.length">
        <span class="font-weight-bold">
          Research interests:
        </span>
        <span>
          <concepts-list :concepts="data.x_concepts" :is-clickable="true"/>
        </span>
      </div>
    </div>
</template>


<script>
import EntityIcon from "./EntityIcon.vue";
import ConceptsList from "../ConceptsList.vue";
import LinkToEntity from "../LinkToEntity.vue";
import LinkToSearch from "../LinkToSearch.vue";
import EntitySummaryStats from "@/components/Entity/EntitySummaryStats.vue";

export default {
  name: "EntityAuthor",
  components: {
    EntityIcon,
    ConceptsList,
    LinkToEntity,
    LinkToSearch,
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
  computed: {},
  created() {
  },
  mounted() {

  },
  watch: {}
}
</script>

<style lang="scss" scoped>


</style>