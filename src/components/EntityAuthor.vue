<template>
  <div>
    <table>
      <tr v-if="data.last_known_institution">
        <td class="table-row-label">
          <entity-icon
              type="institutions"
              expand
              singular
          />
        </td>
        <td>
          <link-to-entity
              :entity="data.last_known_institution"
          />
        </td>
      </tr>

      <tr>
        <td class="table-row-label">
          <entity-icon
              type="concepts"
              expand
          />
        </td>
        <td>
          <concepts-list :concepts="data.x_concepts" :is-clickable="true"/>
        </td>
      </tr>

      <tr>
        <td class="table-row-label">
          <entity-icon
              type="works"
              expand
          />
        </td>
        <td>
          <link-to-search
            :count="data.works_count"
            filter-key="author.id"
            :filter-value="data.id"
            entity-type="works"
          />
        </td>
      </tr>

    </table>


<!--    <id-list :data="data.ids"/>-->


  </div>


</template>


<script>
import LinkInstitution from "./LinkInstitution";
import LinkConcept from "./LinkConcept";
import IdList from "./IdList";
import ViewInApiButton from "./ViewInApiButton";
import EntityIcon from "./EntityIcon";
import ConceptsList from "./ConceptsList";
import LinkToEntity from "./LinkToEntity";
import LinkToSearch from "./LinkToSearch";

export default {
  name: "EntityAuthor",
  components: {
    LinkInstitution,
    LinkConcept,
    IdList,
    ViewInApiButton,
    EntityIcon,
    ConceptsList,
    LinkToEntity,
    LinkToSearch,
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
  }
}

</style>