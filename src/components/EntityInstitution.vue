<template>
  <v-container>
    <div class="">
      <strong>
        🏫 Institution
      </strong>
    </div>
<!--      <a :href="data.id" class="black&#45;&#45;text body-2">{{ data.id }}</a>-->
    <h1 class="text-h3">{{ data.display_name }}</h1>
    <div>Type: {{ data.type }}</div>
    <div class="mt-4">
      <link-concept
            v-for="concept in data.x_concepts"
            :key="concept.id"
            :data="concept"
        />
    </div>

    <div class="mt-8 pb-12">
      <v-btn class="mr-4" :href="apiUrl" target="_blank">
        View in API
      </v-btn>
      <v-btn v-if="data.homepage_url" :href="data.homepage_url" class="mr-4">
        View webpage
      </v-btn>
    </div>

    <div class="text-h4">Identifiers</div>
    <id-list :data="data.ids" />

    <div class="mt-12" v-if="data.associated_insitutions.length">
      <div class="text-h4">Associated Institutions</div>
      <ul>
        <li
          v-for="institution in data.associated_insitutions"
          :key="institution.id"
        >
          <a :href="institution.id | idLink">{{ institution.display_name }}</a> ({{ institution.relationship}})
        </li>
      </ul>
    </div>

    <div class="text-h4 mt-12">
      {{data.works_count}} affiliated works
    </div>
    Click to view in API: <a :href="data.works_api_url" target="_blank">{{data.works_api_url}}</a>

    <div class="text-h4 mt-12">
      Location
    </div>
    <ul>
      <li v-for="property in geoList" :key="property.k">
        <strong>{{property.k}}: </strong> {{ property.v}}
      </li>
    </ul>


    <div class="mt-12">
      <div class="text-h4">Alternate names</div>
      <div v-if="data.display_name_acroynyms.length" class="mb-4">
        <div class="text-h6">Initialisms</div>
        <ul>
          <li v-for="v in data.display_name_acroynyms" :key="v">{{ v }}</li>
        </ul>
      </div>

      <div v-if="data.display_name_alternatives.length" class="mb-4">
        <div class="text-h6">Other names</div>
        <ul>
          <li v-for="v in data.display_name_alternatives" :key="v">{{ v }}</li>
        </ul>
      </div>

      <div v-if="data.international.display_name" class="mb-4">
        <div class="text-h6">International</div>
        <ul>
          <li v-for="v, k in data.international.display_name" :key="k">
            <strong>{{ k }}: </strong>
            {{ v }}
          </li>
        </ul>
      </div>

    </div>



  </v-container>


</template>


<script>
import LinkConcept from "./LinkConcept";
import IdList from "./IdList";

export default {
  name: "EntityInstitution",
  components: {
    LinkConcept,
    IdList,
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
    geoList(){
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
    apiUrl() {
      return this.data.id + ".json"
      const shortId = this.data.id.replace("https://openalex.org/", "")
      return `https://api.openalex.org/institutions/${shortId}`
    }
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