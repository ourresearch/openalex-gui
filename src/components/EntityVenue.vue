<template>
  <div>
    <table>
      <tr>
        <td class="table-row-label">
          Publisher:
        </td>
        <td>
          {{ data.publisher }}
        </td>
      </tr>

      <tr v-if="data.x_concepts.length">
        <td class="table-row-label">
          Concepts:
        </td>
        <td>
          <concepts-list :concepts="data.x_concepts" :is-clickable="true"/>
        </td>
      </tr>

      <tr>
        <td class="table-row-label">
          Access:
        </td>
        <td>
          <span v-if="!data.is_oa">
            toll-access
          </span>
          <span v-else>
            Open Access
            <template v-if="doajLink">(indexed in <a target="_blank" :href="doajLink">DOAJ</a>)</template>
          </span>
        </td>
      </tr>

      <tr>
        <td class="table-row-label pt-6">
          Works
        </td>
        <td class="pt-6">
          <link-to-search
              :count="data.works_count"
              filter-key="host_venue.id"
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


      <entity-zoom-ids-row :ids="data.ids"/>

    </table>


  </div>


</template>


<script>
import LinkToSearch from "./LinkToSearch";
import LinkToEntity from "./LinkToEntity";
import EntityIcon from "./EntityIcon";
import ConceptsList from "./ConceptsList";
import EntityZoomIdsRow from "./EntityZoomIdsRow";

export default {
  name: "EntityVenue",
  components: {
    LinkToSearch,
    LinkToEntity,
    EntityIcon,
    ConceptsList,
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
    doajLink() {
      if (!this.data.issn_l) return
      return `https://doaj.org/toc/${this.data.issn_l}`
    }
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
  td.table-row-label {
    white-space: nowrap;
    vertical-align: top;
    color: #555;
    font-size: 15px;
  }
}

</style>