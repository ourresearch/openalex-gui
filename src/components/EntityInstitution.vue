<template>
  <div>
    <table>
      <tr>
        <td class="table-row-label">
          Location:
        </td>
        <td>
          <flag
              :squared="false"
              :iso="data.country_code"
              style="height:12px;
              margin-right: 3px;"
              v-if="data.country_code"
          />
          {{ locationStr }}
          <a v-if="mapLink" :href="mapLink" target="_blank" class="text-decoration-none">(map)</a>
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


      <tr  v-if="data.associated_institutions.length">
        <td class="table-row-label">
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
          Works:
        </td>
        <td class="pt-6">
          <link-to-search
              :count="data.works_count"
              filter-key="authorships.institutions.id"
              :filter-value="data.id"
              entity-type="works"
          />
        </td>
      </tr>
      <tr>
        <td class="table-row-label">
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

const countryCodeLookup = require('country-code-lookup')



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
      const countryResult = countryCodeLookup.byIso(this.data.country_code)

      const locArr = [
        this.data.geo.city,
        this.data.geo.region,
        countryResult.country,
      ].filter(x => x)
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