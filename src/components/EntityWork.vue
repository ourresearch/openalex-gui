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
      <!--      <view-in-api-button :id="data.id" />-->

      <v-btn
          :href="fulltextUrl"
          target="_blank"
          class="mr-3"
          v-if="fulltextUrl"
          color="primary"
          small
      >
        <v-icon left>mdi-open-in-new</v-icon>
        Fulltext {{ (workIsFreeAtPublisher) ? "via publisher" : "online" }}
      </v-btn>

      <v-btn
          :href="data.host_venue.url"
          target="_blank"
          class="mr-3"
          v-if="data.host_venue.url"
          small
      >
        <v-icon left >mdi-open-in-new</v-icon>
        Paywalled at publisher
      </v-btn>
      <v-btn
          :href="apiUrl + '.bib'"
          class="mx-2 text-initial"
          small
          text
      >
        <v-icon small left>mdi-download-outline</v-icon>
        BibTeX
      </v-btn>
      <v-btn
          :href="apiUrl"
          target="_blank"
          class="mx-2 text-initial"
          small
          text
      >
        <v-icon small left>mdi-cog-outline</v-icon>
        API
      </v-btn>
      <v-btn
          @click="copyPermalinkToClipboard"
          class="mx-2 text-initial"
          small
          text
      >
        <v-icon small left>mdi-content-copy</v-icon>
        Permalink
      </v-btn>
    </div>
    <v-divider class="mt-12 pt-12"/>

    <div class="text-h4">Identifiers</div>
    <id-list :data="data.ids"/>

  </v-container>


</template>


<script>
import LinkAuthor from "./LinkAuthor";
import LinkInstitution from "./LinkInstitution";
import LinkConcept from "./LinkConcept";
import IdList from "./IdList";
import ViewInApiButton from "./ViewInApiButton";
import {mapActions, mapMutations, mapGetters} from "vuex";

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
  methods: {
    ...mapMutations([
        "snackbar"
    ]),
    ...mapActions([
    ]),
    async copyPermalinkToClipboard(){
      await navigator.clipboard.writeText(this.data.id);
      this.snackbar("Permalink copied to clipboard.")
      // alert('Copied!');
    }
  },
  computed: {
    ...mapGetters([
    ]),
    workIsFreeAtPublisher() {
      return ["gold", "bronze", "hybrid"].includes(this.data.open_access.oa_status)
    },
    fulltextUrl() {
      // this is kind of hacky because the oa data we get back from the api has weird holes.
      if (this.data.open_access.oa_url) return this.data.open_access.oa_url
      else if (this.data.open_access.is_oa) return this.data.host_venue.url
      else return null
    },
    apiUrl() {
      const shortId = this.data.id.replace("https://openalex.org/", "")
      return `https://api.openalex.org/works/${shortId}`
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