<template>
  <div>
    <table>
      <tr v-if="data.last_known_institution">
        <td class="table-row-label">
          Institution:
        </td>
        <td>
          <link-to-entity
              :entity="data.last_known_institution"
          />
        </td>
      </tr>

      <tr>
        <td class="table-row-label">
          Concepts:
        </td>
        <td>
          <concepts-list :concepts="data.x_concepts" :is-clickable="true"/>
        </td>
      </tr>

      <tr>
        <td class="table-row-label pt-6">
          Works:
        </td>
        <td class="pt-6">
          <link-to-search
              :count="data.works_count"
              filter-key="authorships.author.id"
              :filter-value="data.id"
              entity-type="works"
          />
        </td>
      </tr>

      <tr>
        <td class="table-row-label">
          Cited by:
        </td>
        <td class="">
          {{ data.cited_by_count.toLocaleString() }} works
        </td>
      </tr>

      <entity-zoom-ids-row :ids="data.ids" />

    </table>


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

table {
  td.table-row-label {
    white-space: nowrap;
    vertical-align: top;
    color: #555;
    font-size: 15px;
  }
}

</style>