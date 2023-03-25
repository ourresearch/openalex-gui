<template>
  <div>
    <div>
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

      <div class="data-row">
        <span class="font-weight-bold">
          Research interests:
        </span>
        <span>
          <concepts-list :concepts="data.x_concepts" :is-clickable="true"/>
        </span>
      </div>

      <div class="data-row">
        <span class="font-weight-bold pt-6">
          Works:
        </span>
        <span class="pt-6">
          <link-to-search
              :count="data.works_count"
              filter-key="authorships.author.id"
              :filter-value="data.id"
              entity-type="works"
          />
        </span>
      </div>

      <div class="data-row">
        <span class="font-weight-bold">
          Cited by:
        </span>
        <span class="">
          {{ data.cited_by_count.toLocaleString() }} works
        </span>
      </div>

      <entity-zoom-ids-row :ids="data.ids" />

    </div>


    <!--    <id-list :data="data.ids"/>-->


  </div>


</template>


<script>
import EntityIcon from "./EntityIcon";
import ConceptsList from "./ConceptsList";
import LinkToEntity from "./LinkToEntity";
import LinkToSearch from "./LinkToSearch";
import EntityZoomIdsRow from "./EntityZoomIdsRow";

export default {
  name: "EntityAuthor",
  components: {
    EntityIcon,
    ConceptsList,
    LinkToEntity,
    LinkToSearch,
    EntityZoomIdsRow,
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