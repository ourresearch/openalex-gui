<template>
  <div class="">
    <v-container>
      <v-row>
        <v-col>
          <div class="text-h2">
            {{ data.display_name }}
          </div>
          <div class="d-inline-flex align-center">
            <link-entity-roles-list :roles="data.roles" selected="institution" />
            <span v-if="locationStr"> in {{ locationStr }}</span>
            <a v-if="mapLink" :href="mapLink" target="_blank" class="text-decoration-none ml-2"> (map).</a>
          </div>
          <div class="d-flex mt-6 ">
            <v-btn
                :to="data.id | entityWorksLink"
                color="primary"
                class="mr-3"
                rounded
            >
              Affiliated works
            </v-btn>

            <v-btn
                :href="data.homepage_url"
                v-if="data.homepage_url"
                icon
                target="_blank"
            >
              <v-icon class="mt-1">mdi-open-in-new</v-icon>
            </v-btn>

          </div>

        </v-col>
      </v-row>
      <v-row>
        <v-col cols="3">
          <v-card flat outlined>
            <v-card-title>
            </v-card-title>
            <v-list>
            </v-list>

          </v-card>
        </v-col>
      </v-row>


    </v-container>




<!--    <div class="data-row" v-if="data.roles.length">-->
<!--        <span class="font-weight-bold">-->
<!--          Other roles:-->
<!--        </span>-->
<!--      <link-entity-roles-list-->
<!--          :roles="data.roles"-->
<!--          hide-role="institution"-->
<!--      />-->
<!--    </div>-->
<!--    <div class="data-row" v-if="data.x_concepts.length">-->
<!--        <span class="font-weight-bold">-->
<!--          Key topics:-->
<!--        </span>-->
<!--      <span>-->
<!--          <concepts-list :concepts="data.x_concepts" :is-clickable="true"/>-->
<!--        </span>-->
<!--    </div>-->

<!--    <div class="data-row" v-if="data.repositories.length">-->
<!--        <span class="font-weight-bold">-->
<!--          Repositories:-->
<!--        </span>-->
<!--      <span>-->
<!--          <link-repository-->
<!--              v-for="(repo, i) in data.repositories"-->
<!--              :key="repo.id" class="text-decoration-none"-->
<!--              :repository="repo"-->
<!--              :append-comma="i < data.repositories.length - 1 "-->
<!--          />-->
<!--        </span>-->
<!--    </div>-->



  </div>


</template>


<script>
import IdList from "../IdList.vue";
import EntityIcon from "./EntityIcon.vue";
import ConceptsList from "../ConceptsList.vue";
import LinkToEntity from "../LinkToEntity.vue";
import LinkToSearch from "../LinkToSearch.vue";
import EntitySummaryStats from "@/components/Entity/EntitySummaryStats.vue";
import LinkRepository from "@/components/LinkRepository.vue";
import LinkEntityRolesList from "@/components/LinkEntityRolesList.vue";
import {getEntityConfig} from "@/entityConfigs";

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
    LinkEntityRolesList,
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
    entityConfig(){
      return getEntityConfig("institution")
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