<template>
  <div class="">
    <v-container>
      <v-row>
        <v-col>
          <div class="body-2">

          </div>
          <div class="text-h2">
            {{ data.display_name }}
          </div>
          <div class="d-inline-flex align-baseline">
            <link-entity-roles-list :roles="data.roles" selected="funder" />
          </div>
          <div class="d-flex mt-6">
            <v-btn
                :to="data.id | entityWorksLink"
                color="primary"
                class="mr-3"
                rounded
            >
              Funded works
            </v-btn>
            <v-btn
                :href="data.homepage_url"
                v-if="data.homepage_url"
                icon
                target="_blank"
            >
              <v-icon>mdi-open-in-new</v-icon>
            </v-btn>

          </div>

        </v-col>
      </v-row>
      <entity-body :data="data" />


    </v-container>
  </div>
</template>


<script>
import ConceptsList from "../ConceptsList.vue";
import LinkEntityRolesList from "@/components/LinkEntityRolesList.vue";
import {getEntityConfig} from "../../entityConfigs";
import EntityBody from "@/components/Entity/EntityBody.vue";

const countryCodeLookup = require('country-code-lookup')


export default {
  name: "EntityFunder",
  components: {
    EntityBody,
    ConceptsList,
    LinkEntityRolesList
  },
  props: {
    data: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {getEntityConfig},
  computed: {
    locationStr() {
      const countryResult = countryCodeLookup.byIso(this.data.country_code)
      return countryResult.country
    },
    capitalizedDescription() {
      return _.capitalize(this.data.description)
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
  span.font-weight-bold {
    white-space: nowrap;
    vertical-align: top;
    color: #555;
    font-size: 15px;
    padding-right: 5px;
  }
}

</style>