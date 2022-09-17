<template>
  <!--  <div class="entity-zoom-container">-->
  <div class="">


    <table class="mb-12">
      <!--    venue and year-->
      <tr>
        <td class="table-row-label">
          <entity-icon
              v-if="data.host_venue.display_name"
              type="venues"
              expand
              singular
          />
        </td>
        <td>
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
        </td>
      </tr>


      <!--    Author list-->
      <tr v-if="authorshipsToShow.length">
        <td class="table-row-label">
          <entity-icon
              type="authors"
              expand
          />
        </td>

        <td>
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
        </td>
      </tr>


      <!--    Concepts list-->
      <tr v-if="data.concepts.length">
        <td class="table-row-label">
          <entity-icon
              type="concepts"
              expand
          />
        </td>
        <td>
          <concepts-list :concepts="data.concepts" :is-clickable="true"/>
        </td>
      </tr>


      <!--    Concepts list-->
      <tr v-if="abstract">
        <td class="table-row-label">
          <v-icon class="mr-1">mdi-text</v-icon>
          <span class="body-1" style="color:#555;">Abstract: </span>
        </td>
        <td class="body-1">
          {{ abstract }}
        </td>
      </tr>

      <!--    Cited By  -->
      <tr>
        <td class="pt-6 table-row-label">
          <v-icon class="mr-1">mdi-format-quote-close</v-icon>
          <span class="body-1" style="color:#555;">Cited by: </span>
        </td>
        <td class="pt-6">
          <link-to-search
              :count="data.cited_by_count"
              entity-type="works"
              filter-key="cites"
              :filter-value="data.id"
          />
        </td>
      </tr>

      <!--    References  -->
      <tr>
        <td class="table-row-label">
          <!--          <v-icon class="mr-1">mdi-code-parentheses</v-icon>-->
          <v-icon class="mr-1">mdi-format-quote-open</v-icon>
          <span class="body-1" style="color:#555;">Cites: </span>
        </td>
        <td class="">
          <link-to-search
              :count="data.referenced_works.length"
              entity-type="works"
              filter-key="cited_by"
              :filter-value="data.id"
          />
        </td>
      </tr>
      <!--    Related works  -->
      <tr>
        <td class="table-row-label">
          <v-icon class="mr-1">mdi-file-document-multiple-outline</v-icon>
          <span class="body-1" style="color:#555;">Related: </span>
        </td>
        <td class="">
          <link-to-search
              :count="data.related_works.length"
              entity-type="works"
              filter-key="related_to"
              :filter-value="data.id"
          />
        </td>
      </tr>

    </table>


    <div class="mt-5">
      <!--        <a @click="viewIncomingCitations">view</a>-->
      <!--      <div><span class="font-weight-bold">{{ data.referenced_works.length }}</span> outgoing references</div>-->
      <!--      <div><span class="font-weight-bold">{{ data.related_works.length }}</span> related works</div>-->

    </div>

  </div>


</template>


<script>
import ConceptsList from "./ConceptsList";
import Authorship from "./Authorship";
import EntityIcon from "./EntityIcon";

import {createSimpleFilter} from "../filterConfigs";
import LinkToSearch from "./LinkToSearch";
import {unravel} from "../util";

import {mapActions, mapMutations, mapGetters} from "vuex";

export default {
  name: "EntityWork",
  components: {
    ConceptsList,
    Authorship,
    EntityIcon,
    LinkToSearch,
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
    abstract() {
      return unravel(this.data.abstract_inverted_index)
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
      const filter = createSimpleFilter("cites", this.data.id)
      return {
        name: "Serp",
        params: {entityType: "works"},
        query: {filter: filter.asStr},
      }
    },
    linkToReferences() {
      const filter = createSimpleFilter("cited_by", this.data.id)
      return {
        name: "Serp",
        params: {entityType: "works"},
        query: {filter: filter.asStr},
      }
    },
    linkToRelatedWorks() {
      const filter = createSimpleFilter("related_to", this.data.id)
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

table {
  td.table-row-label {
    white-space: nowrap;
    vertical-align: top;
    color: #555;
    font-size: 15px;
  }
}

.entity-zoom-container {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
}


</style>