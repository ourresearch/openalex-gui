<template>
  <v-container>
    <div class="body-2">
      📄 Work<span v-if="data.type">: {{ data.type.replace("-", " ") }}</span>
    </div>

    <h1 class="text-h4">{{ data.title }}</h1>

    <div class="">
      Published {{ data.publication_year }}
      <span v-if="data.host_venue.display_name">
        in
        <a :href="data.host_venue.id | idLink">
          {{ data.host_venue.display_name }}.
        </a>
      </span>

    </div>
<!--    <div class="mt-2">-->
<!--      <div v-if="!data.open_access.is_oa">-->
<!--        <v-icon small>mdi-lock-outline</v-icon>-->
<!--        Closed access-->
<!--      </div>-->
<!--      <div v-if="data.open_access.is_oa" class="text-capitalize">-->
<!--        <v-icon small>mdi-lock-open-variant-outline</v-icon>-->
<!--        {{ data.open_access.oa_status}}-->
<!--        Open Access-->
<!--      </div>-->

    </div>
    <div class="mt-2">
      Concepts:
      <template
          v-for="(concept, i) in data.concepts"
      >
        <link-concept
            :key="concept.id"
            :data="concept"
            :append-comma="i < data.concepts.length - 1"
            class="mr-1"
        />

      </template>
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