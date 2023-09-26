<template>
  <div class="pa-3">

    <div class="data-row" v-if="data.roles.length">
        <span class="font-weight-bold">
          Other roles:
        </span>
      <link-entity-roles-list
          :roles="data.roles"
          hide-role="publisher"
      />
    </div>

      <div class="data-row">
        <span class="font-weight-bold">
          Location{{(data.country_codes.length > 1) ? "s" : ""}}:
        </span>
        <span v-if="data.country_codes.length">
          {{ countryNamesString }}
        </span>
        <span v-else>Unknown</span>
      </div>

<!--      <div class="data-row" v-if="data.x_concepts.length">-->
<!--        <span class="font-weight-bold">-->
<!--          Concepts:-->
<!--        </span>-->
<!--        <span>-->
<!--          <concepts-list :concepts="data.x_concepts" :is-clickable="true"/>-->
<!--        </span>-->
<!--      </div>-->

<!--      <div class="data-row">-->
<!--        <span class="font-weight-bold">-->
<!--          Access:-->
<!--        </span>-->
<!--        <span>-->
<!--          <span v-if="!data.is_oa">-->
<!--            toll-access-->
<!--          </span>-->
<!--          <span v-else>-->
<!--            Open Access-->
<!--            <template v-if="doajLink">(indexed in <a target="_blank" :href="doajLink">DOAJ</a>)</template>-->
<!--          </span>-->
<!--        </span>-->
<!--      </div>-->






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

export default {
  name: "EntityPublisher",
  components: {
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