<template>
  <div>
    <table>
      <tr>
        <td class="table-row-label">
          <v-icon>mdi-domain</v-icon>
          Publisher:
        </td>
        <td>
          {{ data.publisher }}
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
              filter-key="host_venue.id"
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

      <tr>
        <td class="table-row-label">
          <v-icon v-if="data.is_oa">mdi-lock-open-outline</v-icon>
          <v-icon v-else>mdi-lock-outline</v-icon>
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

    </table>


  </div>


</template>


<script>
import LinkToSearch from "./LinkToSearch";
import LinkToEntity from "./LinkToEntity";
import EntityIcon from "./EntityIcon";
import ConceptsList from "./ConceptsList";

export default {
  name: "EntityVenue",
  components: {
    LinkToSearch,
    LinkToEntity,
    EntityIcon,
    ConceptsList,
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