<template>
<!--  <div class="entity-zoom-container">-->
  <div class="">


    <!--    venue and year-->
    <div class="venue-and-year subtitle-1 d-flex align-start">
      <entity-icon
          v-if="data.host_venue.display_name"
          type="venues"
          expand
          singular
      />

      <div>
        <template v-if="data.host_venue.display_name" class="">
          <router-link
              class="font-italic text-decoration-none"
              :to="data.host_venue.id | zoomLink"
              v-if="data.host_venue.id"
          >{{ data.host_venue.display_name }}
          </router-link>
          <span
              v-else
              class="font-italic text-capitalize"
          >{{ data.host_venue.display_name }}
            </span>
          <span
              class="year ml-1"
              v-if="data.publication_year"
          >({{ data.publication_year }})
          </span>
        </template>

        <template
            v-if="!data.host_venue.display_name && data.publication_year"
        >Published in {{ data.publication_year }}
        </template>
      </div>
    </div>


    <!--    Author list-->
    <div class="authors mt-1 d-flex align-start" v-if="authorshipsToShow.length">
      <entity-icon
          type="authors"
          expand
      />
      <div>
        <!--      Single author-->
        <template v-if="authorshipsToShow.length === 1">
          <authorship
              :key="authorshipsToShow[0].author.id"
              :authorship="authorshipsToShow[0]"
              :show-institutions="true"
          />
        </template>

        <!--      Multiple authors-->
        <template v-else>
          <authorship
              v-for="(authorship, i) in authorshipsToShow"
              :key="authorship.author.id"
              :authorship="authorship"
              :append-comma="i < authorshipsToShow.length - 1"
              :show-institutions="showAuthorDetails"
              class="mr-1"
          />

          <!--        <a-->
          <!--            v-if="truncatedAuthorshipsCount"-->
          <!--            @click="showAuthorDetails = !showAuthorDetails"-->
          <!--            class="font-weight-bold"-->
          <!--        >+ {{truncatedAuthorshipsCount}} more-->

          <!--        </a>-->
        </template>

      </div>
    </div>

    <!--    Concepts list-->
    <div class="mt-1" v-if="data.concepts.length">
      <concepts-list :concepts="data.concepts" :is-clickable="true"/>
    </div>

    <div class="mt-5">
      <div>
        <v-icon class="mr-1">mdi-format-quote-close</v-icon>
        <router-link :to="linkToIncomingCitations">
          <span class="font-weight-bold">{{ data.cited_by_count }}</span>
          incoming citations
        </router-link>
<!--        <a @click="viewIncomingCitations">view</a>-->
      </div>
<!--      <div><span class="font-weight-bold">{{ data.referenced_works.length }}</span> outgoing references</div>-->
<!--      <div><span class="font-weight-bold">{{ data.related_works.length }}</span> related works</div>-->

    </div>


    <div v-if="0">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
      magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
      magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
      magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
      magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </div>


    <div class="mt-8 entity-buttons d-flex">
      <!--      <view-in-api-button :id="data.id" />-->

      <div>
        <div>
          <v-btn
              :href="fulltextUrl"
              target="_blank"
              class="mr-3 mt-3"
              v-if="fulltextUrl"
              color="primary"
              small
          >
            <v-icon left>mdi-open-in-new</v-icon>
            Fulltext {{ (workIsFreeAtPublisher) ? "via publisher" : "online" }}
          </v-btn>

        </div>
        <v-btn
            :href="data.host_venue.url"
            target="_blank"
            class="mr-3 mt-3 text-initial"
            v-if="data.host_venue.url && !workIsFreeAtPublisher"
            small
            text
        >
          <v-icon left>mdi-file-lock-outline</v-icon>
          Paywalled at publisher
        </v-btn>

      </div>

      <v-spacer></v-spacer>
      <div class="mt-3">
        <v-btn
            :href="apiUrl + '.bib'"
            class=" text-initial"
            icon
        >
          <v-icon>mdi-download-outline</v-icon>
          <!--          BibTeX-->
        </v-btn>
        <v-btn
            :href="apiUrl"
            target="_blank"
            class=" text-initial"
            icon
        >
          <v-icon>mdi-cog-outline</v-icon>
          <!--          API-->
        </v-btn>
        <v-btn
            @click="copyPermalinkToClipboard"
            class=" text-initial"
            icon
        >
          <v-icon>mdi-link</v-icon>
          <!--          Permalink-->
        </v-btn>
      </div>
    </div>


    <!--    <div class="text-h4">Identifiers</div>-->
    <!--    <id-list :data="data.ids"/>-->

  </div>


</template>


<script>
import ConceptsList from "./ConceptsList";
import Authorship from "./Authorship";
import EntityIcon from "./EntityIcon";

import {createSimpleFilter} from "../filterConfigs";

import {mapActions, mapMutations, mapGetters} from "vuex";

export default {
  name: "EntityWork",
  components: {
    ConceptsList,
    Authorship,
    EntityIcon,
  },
  props: {
    data: Object,
  },
  data() {
    return {
      showAuthorDetails: false,
      maxAuthorshipsToShowAtFirst: 10,
    }
  },
  methods: {
    ...mapMutations([
      "snackbar"
    ]),
    ...mapActions([]),
    async copyPermalinkToClipboard() {
      await navigator.clipboard.writeText(this.data.id);
      this.snackbar("Permalink copied to clipboard.")
      // alert('Copied!');
    },
    viewIncomingCitations() {
      const filter = createSimpleFilter("cites", this.data.id)
      this.$store.dispatch("replaceInputFilters", [filter])
    },


  },
  computed: {
    ...mapGetters([]),
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
    authorshipsCount() {
      return this.data.authorships.length
    },

    authorshipsHaveAtLeastOneInstitution() {
      return this.data.authorships.some(a => {
        return a.institutions.length
      })
    },
    linkToIncomingCitations() {
      const filter = createSimpleFilter("referenced_works", this.data.id)
      return {
        name: "Serp",
        params: {entityType: "works"},
        query: {filter: filter.asStr},
      }
    },

    truncatedAuthorshipsCount() {
      return Math.max(this.data.authorships.length - this.maxAuthorshipsToShowAtFirst, 0)
    },
    authorshipsToShow() {
      if (!this.authorshipsCount) return []
      const sliceAt = (this.showAuthorDetails) ? Infinity : this.maxAuthorshipsToShowAtFirst
      return this.data.authorships.slice(0, sliceAt)
    },
  },
  created() {
  },
  mounted() {

  },
  watch: {
    "data.id": function (to, from) {
      console.log("EntityWork new ID", to)
      this.showAuthorDetails = false
    }
  }
}
</script>

<style lang="scss" scoped>
.entity-buttons {
  width: 100%;
}

.entity-zoom-container {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
}


</style>