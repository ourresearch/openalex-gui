<template>
  <div>
    <table>
      <tr>
        <td class="table-row-label">
          <v-icon>mdi-map-marker-outline</v-icon>
          Location:
        </td>
        <td>
          {{ locationStr }}
          <a v-if="mapLink" :href="mapLink" target="_blank">(map)</a>
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


      <tr  v-if="data.associated_institutions.length">
        <td class="table-row-label">
          <entity-icon
              type="institutions"
          />
          Associated:
        </td>
        <td>
            <div
                v-for="institution in data.associated_institutions"
                :key="institution.id"
            >
              <a :href="institution.id | idLink" class="text-decoration-none">
                {{ institution.display_name }}
              </a> ({{ institution.relationship }})
            </div>
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
              filter-key="authorships.author.id"
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
  name: "EntityInstitution",
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
    locationStr() {
      const locArr = [
        this.data.geo.city,
        this.data.geo.region,
        this.data.geo.country
      ]
      return locArr.join(", ")
    },
    mapLink() {
      if (!this.data.geo.latitude || !this.data.geo.longitude) return
      return `https://www.openstreetmap.org/?mlat=${this.data.geo.latitude}&mlon=${this.data.geo.longitude}`
    },
    geoList() {
      return Object.entries(this.data.geo).map(([k, v]) => {
        return {
          k: k,
          v: v,
        }
      })
          .filter(x => {
            return x.v
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

<style lang="scss" scoped>

table {
  td.table-row-label {
    white-space: nowrap;
    vertical-align: top;
    color: #555;
    font-size: 15px;
    padding-right: 5px;
  }
}

</style>