<template>
  <v-container>
    <div class="">
      📄 <strong>Work</strong>
<!--      <a :href="data.id" class="black&#45;&#45;text d-block body-2">{{ data.id }}</a>-->
    </div>

    <h1 class="text-h3">{{ data.title }}</h1>

    <div class="">
      {{ data.publication_year }}
      <span v-if="data.type">{{ data.type.replace("-", " ") }}</span>
      <span v-if="data.host_venue.display_name">
        published by
        <a :href="data.host_venue.id | idLink">
          {{ data.host_venue.display_name }}.
        </a>
      </span>

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
    <div class="mt-2">
      <link-concept
          v-for="concept in data.concepts"
          :key="concept.id"
          :data="concept"
      />
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
      <view-in-api-button :id="data.id" />
      <v-btn :href="data.host_venue.url" class="mr-4">
        <v-icon left v-if="workIsFreeAtPublisher">mdi-lock-open-outline</v-icon>
        <v-icon left v-if="!workIsFreeAtPublisher">mdi-lock-outline</v-icon>
        View work
      </v-btn>
      <v-btn :href="data.open_access.oa_url" v-if="data.open_access.oa_status==='green'">
        <v-icon left>mdi-lock-open-outline</v-icon>
        View free copy
      </v-btn>
    </div>
    <v-divider class="mt-12 pt-12" />

    <div class="text-h4">Identifiers</div>
    <id-list :data="data.ids" />

  </v-container>


</template>


<script>
import LinkAuthor from "./LinkAuthor";
import LinkInstitution from "./LinkInstitution";
import LinkConcept from "./LinkConcept";
import IdList from "./IdList";
import ViewInApiButton from "./ViewInApiButton";

export default {
  name: "EntityWork",
  components: {
    LinkAuthor,
    LinkInstitution,
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
    workIsFreeAtPublisher() {
      return this.data.open_access.is_oa && this.data.open_access.oa_status !== "green"
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