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
            <link-entity-roles-list :roles="data.roles" selected="publisher"/>
          </div>
          <div class="d-flex mt-6">
            <v-btn
                :to="data.id | entityWorksLink"
                color="primary"
                class="mr-3"
                rounded
            >
              Published works
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
import LinkToSearch from "../LinkToSearch.vue";
import LinkToEntity from "../LinkToEntity.vue";
import EntityIcon from "./EntityIcon.vue";
import ConceptsList from "../ConceptsList.vue";
import EntitySummaryStats from "@/components/Entity/EntitySummaryStats.vue";
import countryCodeLookup from "country-code-lookup";
import LinkEntityRolesList from "@/components/LinkEntityRolesList.vue";
import EntityBody from "@/components/Entity/EntityBody.vue";

export default {
  name: "EntityPublisher",
  components: {
    LinkEntityRolesList,
    EntityBody,
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
    countryNamesString() {
      return this.data.country_codes.map(code => {
        return countryCodeLookup.byIso(code)?.country
      }).join(", ")

      // const countryResult = countryCodeLookup.byIso(this.data.country_code)
      // return countryResult.country
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
  }
}

</style>