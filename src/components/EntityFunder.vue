<template>
  <div class="pa-3">
    <div class="data-row" v-if="data.roles.length">
        <span class="font-weight-bold">
          Other roles:
        </span>
      <link-entity-roles-list
          :roles="data.roles"
          hide-role="funder"
      />
    </div>

    <div class="data-row" v-if="data.description">
        <span class="font-weight-bold">
          About:
        </span>
      <span class="">{{ capitalizedDescription }}
        </span>
    </div>

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
        </span>
    </div>

    <!--    <div class="data-row" v-if="data.x_concepts.length">-->
    <!--        <span class="font-weight-bold">-->
    <!--          Key topics:-->
    <!--        </span>-->
    <!--      <span>-->
    <!--          <concepts-list :concepts="data.x_concepts" :is-clickable="true"/>-->
    <!--        </span>-->
    <!--    </div>-->
  </div>


</template>


<script>
import ConceptsList from "./ConceptsList";
import LinkEntityRolesList from "@/components/LinkEntityRolesList.vue";

const countryCodeLookup = require('country-code-lookup')


export default {
  name: "EntityFunder",
  components: {
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
  methods: {},
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