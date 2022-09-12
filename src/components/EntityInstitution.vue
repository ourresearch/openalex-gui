<template>
  <div>
    <div>Type: {{ data.type }}</div>
    <div class="mt-4">
      <link-concept
            v-for="concept in data.x_concepts"
            :key="concept.id"
            :data="concept"
        />
    </div>

    <div class="mt-8">
      <view-in-api-button :id="data.id" />
      <v-btn v-if="data.homepage_url" :href="data.homepage_url" class="mr-4">
        View webpage
      </v-btn>
    </div>
    <v-divider class="mt-12 pt-12" />

    <div class="text-h4">Identifiers</div>
    <id-list :data="data.ids" />

    <div class="mt-12" v-if="data.associated_institutions.length">
      <div class="text-h4">Associated Institutions</div>
      <ul>
        <li
          v-for="institution in data.associated_institutions"
          :key="institution.id"
        >
          <a :href="institution.id | idLink">{{ institution.display_name }}</a> ({{ institution.relationship}})
        </li>
      </ul>
    </div>


    <div class="text-h4 mt-12" v-if="data.works_count !== null">
      {{data.works_count.toLocaleString()}} affiliated works
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
      <div v-if="data.display_name_acronyms.length" class="mb-4">
        <div class="text-h6">Initialisms</div>
        <ul>
          <li v-for="v in data.display_name_acronyms" :key="v">{{ v }}</li>
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



  </div>


</template>


<script>
import LinkConcept from "./LinkConcept";
import IdList from "./IdList";
import ViewInApiButton from "./ViewInApiButton";

export default {
  name: "EntityInstitution",
  components: {
    LinkConcept,
    IdList,
    ViewInApiButton,
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