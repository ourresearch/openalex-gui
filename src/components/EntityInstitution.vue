<template>
  <div class="pa-3">
    <div class="data-row">
        <span class="font-weight-bold">
          Location:
        </span>
      <span>
<!--          <flag-->
<!--              :squared="false"-->
<!--              :iso="data.country_code"-->
<!--              style="height:12px;-->
<!--              vertical-align: -2px;-->
<!--              margin-right: 1px;"-->
<!--              v-if="data.country_code"-->
<!--          />-->
          {{ locationStr }}
          <a v-if="mapLink" :href="mapLink" target="_blank" class="text-decoration-none caption">(map)</a>
        </span>
    </div>
    <div class="data-row" v-if="data.x_concepts.length">
        <span class="font-weight-bold">
          Key topics:
        </span>
      <span>
          <concepts-list :concepts="data.x_concepts" :is-clickable="true"/>
        </span>
    </div>

    <div class="data-row" v-if="data.repositories.length">
        <span class="font-weight-bold">
          Repositories:
        </span>
      <span>
          <link-repository
              v-for="(repo, i) in data.repositories"
              :key="repo.id" class="text-decoration-none"
              :repository="repo"
              :append-comma="i < data.repositories.length - 1 "
          />
        </span>
    </div>


    <!--      <div class="data-row"  v-if="data.associated_institutions.length">-->
    <!--        <span class="font-weight-bold">-->
    <!--          Associated:-->
    <!--        </span>-->
    <!--        <span>-->
    <!--            <span-->
    <!--                v-for="institution in data.associated_institutions"-->
    <!--                :key="institution.id"-->
    <!--            >-->
    <!--              <a :href="institution.id | idLink" class="text-decoration-none">-->
    <!--                {{ institution.display_name }}-->
    <!--              </a> ({{ institution.relationship }})-->
    <!--            </span>-->
    <!--        </span>-->

<!--    <div class="data-row">-->
<!--        <span class="font-weight-bold pt-6">-->
<!--          Works:-->
<!--        </span>-->
<!--      <span class="pt-6">-->
<!--          <link-to-search-->
<!--              :count="data.works_count"-->
<!--              filter-key="authorships.institutions.id"-->
<!--              :filter-value="data.id"-->
<!--              entity-type="works"-->
<!--          />-->
<!--        </span>-->
<!--    </div>-->


  </div>


</template>


<script>
import IdList from "./IdList";
import EntityIcon from "./EntityIcon";
import ConceptsList from "./ConceptsList";
import LinkToEntity from "./LinkToEntity";
import LinkToSearch from "./LinkToSearch";
import EntitySummaryStats from "@/components/EntitySummaryStats.vue";
import LinkRepository from "@/components/LinkRepository.vue";

const countryCodeLookup = require('country-code-lookup')


export default {
  name: "EntityInstitution",
  components: {
    IdList,
    EntityIcon,
    ConceptsList,
    LinkToEntity,
    LinkToSearch,
    EntitySummaryStats,
    LinkRepository,
  },
  props: {
    data: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {
  },
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
  span.font-weight-bold {
    white-space: nowrap;
    vertical-align: top;
    color: #555;
    font-size: 15px;
    padding-right: 5px;
  }
}

</style>