<template>
  <div>
    <table>
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

      <tr v-if="data.last_known_institution">
        <td class="table-row-label">
          <entity-icon
              type="institutions"
              expand
          />
        </td>
        <td>
          <router-link
              v-if="data.last_known_institution.id"
              :to="data.last_known_institution.id | idLink"
              class="text-decoration-none"
          >
            <span class="font-weight-bold">{{ data.cited_by_count.toLocaleString() }}</span> works
          </router-link>
        </td>
      </tr>


    </table>


    <div v-if="data.last_known_institution && data.last_known_institution.id">
      <link-institution :data="data.last_known_institution"/>
    </div>

    <div class="mt-2">
      <link-concept
          v-for="concept in data.x_concepts"
          :key="concept.id"
          :data="concept"
      />
    </div>


    <div class="mt-8">
      <view-in-api-button :id="data.id" />
    </div>
    <v-divider class="mt-12 pt-12" />

    <div class="text-h4">Identifiers</div>
    <id-list :data="data.ids" />

    <div class="text-h4 mt-12">
      {{data.works_count.toLocaleString()}} created works
    </div>
    Click to view in API: <a :href="data.works_api_url" target="_blank">{{data.works_api_url}}</a>



  </div>


</template>


<script>
import LinkInstitution from "./LinkInstitution";
import LinkConcept from "./LinkConcept";
import IdList from "./IdList";
import ViewInApiButton from "./ViewInApiButton";
import EntityIcon from "./EntityIcon";
import ConceptsList from "./ConceptsList";

export default {
  name: "EntityAuthor",
  components: {
    LinkInstitution,
    LinkConcept,
    IdList,
    ViewInApiButton,
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

  },
  created() {
  },
  mounted() {

  },
  watch: {}
}
</script>

<style lang="scss">


</style>