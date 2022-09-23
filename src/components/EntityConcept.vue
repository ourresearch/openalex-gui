<template>
  <div>
    <table>
      <tr v-if="data.description">
        <td class="table-row-label">
          <v-icon class="mr-1">mdi-text</v-icon>
          Description:
        </td>
        <td class="description">
          {{ data.description }}.
        </td>
      </tr>

      <tr v-if="parentConcepts.length">
        <td class="table-row-label">
          <entity-icon
              type="concepts"
          />
          {{"Parent" | pluralize(parentConcepts.length)}}:
        </td>
        <td>
          <concepts-list :concepts="parentConcepts" :is-clickable="true"/>
        </td>
      </tr>


      <tr v-if="data.related_concepts.length">
        <td class="table-row-label">
          <entity-icon
              type="concepts"
          />
          Related:
        </td>
        <td>
          <concepts-list :concepts="data.related_concepts" :is-clickable="true"/>
        </td>
      </tr>


      <tr>
        <td class="table-row-label pt-6">
          <entity-icon
              type="works"
              expand
          />
        </td>
        <td class="pt-6">
          <link-to-search
              :count="data.works_count"
              filter-key="concept.id"
              :filter-value="data.id"
              entity-type="works"
          />
        </td>
      </tr>
      <tr>
        <td class="table-row-label">
          <v-icon>mdi-format-quote-close</v-icon>
          Cited by:
        </td>
        <td>
          {{ data.cited_by_count.toLocaleString() }} works
        </td>
      </tr>

      <entity-zoom-ids-row :ids="data.ids" />


    </table>


  </div>


</template>


<script>
import IdList from "./IdList";
import EntityIcon from "./EntityIcon";
import ConceptsList from "./ConceptsList";
import LinkToEntity from "./LinkToEntity";
import LinkToSearch from "./LinkToSearch";
import EntityZoomIdsRow from "./EntityZoomIdsRow";

export default {
  name: "EntityConcept",
  components: {
    IdList,
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
  computed: {
    levelChar() {
      const chars = [
        "⓪",
        "①",
        "②",
        "③",
        "④",
        "⑤",
      ]
      return chars[this.data.level]
    },
    parentConcepts(){
      if (!this.data.ancestors.length) return []
      return this.data.ancestors.filter(c => {
        return c.level === this.data.level - 1
      })
    },
  },
  created() {
  },
  mounted() {


  },
  watch: {}
}
</script>

<style lang="scss">
.description {
  &:first-letter {
    text-transform: capitalize;
  }
}
table {
  td.table-row-label {
    white-space: nowrap;
    vertical-align: top;
    color: #555;
    font-size: 15px;
    padding-right: 5px;
  }
  td {
    vertical-align: top;
  }
}


</style>