<template>
  <v-container>
    <div class="">
      📄 <strong>Work</strong>
      <template v-if="data.type"> ({{ data.type }})</template>
      <a :href="data.id" class="black--text d-block body-2">{{ data.id }}</a>
    </div>

    <h1 class="text-h3 my-6">{{ data.title }}</h1>

    <div class="">
      {{ data.publication_year }}
      <a :href="data.host_venue.id">
        {{ data.host_venue.display_name }}.
      </a>
    </div>
    <a :href="data.ids.doi" class="grey--text body-2 d-block">
      {{ data.ids.doi }}
    </a>

    <div class="mt-2">
      <link-concept
          v-for="concept in data.concepts"
          :key="concept.id"
          :data="concept"
      />
    </div>
    <div class="mt-2">
      <div v-if="!data.open_access.is_oa">
        <v-icon small>mdi-lock-outline</v-icon>
        Closed access
      </div>
      <div v-if="data.open_access.is_oa" class="text-capitalize">
        <v-icon small>mdi-lock-open-outline</v-icon>
        {{ data.open_access.oa_status}}
        Open Access
      </div>

    </div>

    <div class="mt-8">
      <div
          v-for="authorship in data.authorships"
          :key="authorship.author.id"
          class="authorship"
      >
        <link-author :data="authorship.author" class=""/>
        <span class="ml-2 institutions-list body-2">
          (<template v-for="(institution, i) in authorship.institutions">
              <template v-if="i > 0">, </template><link-institution
            :key="institution.id"
            :data="institution"
        />
            </template>)

        </span>

      </div>
    </div>
    <div class="mt-8">
      <v-btn class="mr-4" :href="apiUrl" target="_blank">
        View in API
      </v-btn>
      <v-btn class="mr-4">
        <v-icon left v-if="workIsFreeAtPublisher">mdi-lock-open-outline</v-icon>
        <v-icon left v-if="!workIsFreeAtPublisher">mdi-lock-outline</v-icon>
        View work
      </v-btn>
      <v-btn v-if="data.open_access.oa_status==='green'">
        <v-icon left>mdi-lock-open-outline</v-icon>
        View free copy
      </v-btn>
    </div>

  </v-container>


</template>


<script>
import LinkAuthor from "./LinkAuthor";
import LinkInstitution from "./LinkInstitution";
import LinkConcept from "./LinkConcept";

export default {
  name: "EntityWork",
  components: {
    LinkAuthor,
    LinkInstitution,
    LinkConcept,

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
    workIsFreeAtPublisher() {
      return this.data.open_access.is_oa && this.data.open_access.oa_status !== "green"
    },
    apiUrl() {
      return this.data.id + ".json"
      const shortId = this.data.id.replace("https://openalex.org/", "")
      return `https://api.openalex.org/work/${shortId}`
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