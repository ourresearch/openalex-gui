<template>
  <!--  <div class="entity-zoom-container">-->
  <div class="">
    <div class="padded-part pa-4">
      <v-alert type="error" prominent v-if="data.is_retracted">
        <v-row align="center">
          <v-col class="grow">
            This work has been <strong>retracted.</strong>

          </v-col>
          <v-col class="shrink">
            <v-btn icon href="https://en.wikipedia.org/wiki/Retraction_in_academic_publishing" target="_blank">
              <v-icon>mdi-information-outline</v-icon>
            </v-btn>

          </v-col>
        </v-row>
      </v-alert>

      <v-alert v-if="authorshipsToShow >= 100" type="warning" dense text>

        <strong>More than 100 authors.</strong> Only the top 100 are shown below.
      </v-alert>


      <div v-if="data.publication_year">
      <span class="font-weight-bold">
          Published:
        </span>
        <span>
          {{ data.publication_year }}
        </span>
      </div>

      <div class="">
        <div v-if="data.primary_location.source && data.primary_location.source.display_name">
          <!--    source and year-->
          <div v-if="data.primary_location.source.display_name">
        <span class="font-weight-bold">
          Source:
        </span>
            <link-to-entity :entity="data.primary_location.source"/>
          </div>
        </div>


        <!--    Author list-->
        <div v-if="authorshipsToShow.length">

        <span class="font-weight-bold">
          {{ "Author" | pluralize(authorshipsToShow.length) }}:
        </span>
          <span>
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

            <!--                    <a-->
            <!--                        v-if="truncatedAuthorshipsCount"-->
            <!--                        @click="showAuthorDetails = !showAuthorDetails"-->
            <!--                        class="font-weight-bold"-->
            <!--                    >+ {{truncatedAuthorshipsCount}} more-->

            <!--                    </a>-->
          </template>
        </span>
        </div>


        <!--    Concepts list-->
        <div v-if="data.concepts.length">
        <span class="font-weight-bold">
          Concepts:
        </span>
          <span>
          <concepts-list :concepts="data.concepts" :is-clickable="true"/>
        </span>
        </div>



        <!--    Cited By  -->
        <div class="mt-3">
        <span class="pt-6 font-weight-bold">
          <span>Cited by: </span>
        </span>
          <span class="pt-6">
          <link-to-search
                  :count="data.cited_by_count"
                  entity-type="works"
                  filter-key="cites"
                  :filter-value="data.id"
          />
        </span>
        </div>

        <!--    References  -->
        <div>
        <span class="font-weight-bold">
          <span>Cites: </span>
        </span>
          <span class="">
          <link-to-search
                  :count="data.referenced_works.length"
                  entity-type="works"
                  filter-key="cited_by"
                  :filter-value="data.id"
          />
        </span>
        </div>
        <!--    Related works  -->
        <div>
        <span class="font-weight-bold">
          <span>Related: </span>
        </span>
          <span class="">
          <link-to-search
                  :count="data.related_works.length"
                  entity-type="works"
                  filter-key="related_to"
                  :filter-value="data.id"
          />
        </span>
        </div>


      </div>
    </div>


    <v-expansion-panels flat accordion multiple>
      <v-expansion-panel v-if="abstract">
        <v-divider />
        <v-expansion-panel-header>
          Abstract
        </v-expansion-panel-header>
        <v-expansion-panel-content class="body-1">
          {{ abstract }}
        </v-expansion-panel-content>
      </v-expansion-panel>


      <v-expansion-panel>
        <v-divider/>
        <v-expansion-panel-header>
          Locations <span class="caption ml-1">({{ data.locations.length }})</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-list nav dense  class="pa-0">
            <v-list-item
                    v-for="(loc, i) in data.locations"
                    :key="i"
                    three-line
                    :href="loc.landing_page_url" target="_blank"
            >

              <v-list-item-content>
                <v-list-item-title>
                  {{ (loc.source) ? loc.source.display_name : "Unknown source" }}
                </v-list-item-title>
                <v-list-item-subtitle class="grey--text " style="" >
                  <span class="text-capitalize" v-if="loc.source && loc.source.host_organization_name">{{ loc.source.host_organization_name }}</span>
                  <span v-else>We don't recognize this location's source</span>
                </v-list-item-subtitle>
                <v-list-item-subtitle class="grey--text font-weight-normal" style="">
                  <span v-if="!loc.is_oa">
                    <v-icon small>mdi-lock-outline</v-icon> Paywalled
                  </span>
                  <span small outlined v-if="loc.version" class="">
                    <span class="text-capitalize">{{ loc.version.replace("Version", "") }}</span>
                  </span>
                  <span v-if="loc.version && loc.license">・</span>
                  <span small outlined class="" v-if="loc.license && loc.license !== 'implied-oa'">{{ loc.license }}</span>
                </v-list-item-subtitle>
              </v-list-item-content>
<!--              </v-list-item-action>-->
<!--              <v-list-item-action>-->
<!--                <v-btn small icon :href="loc.landing_page_url" target="_blank">-->
<!--                  <v-icon small>mdi-open-in-new</v-icon>-->
<!--                </v-btn>-->
<!--              </v-list-item-action>-->
            </v-list-item>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>

    </v-expansion-panels>

    <!--  <pre>-->
    <!--    {{ data.locations }}-->
    <!--  </pre>-->

  </div>


</template>


<script>
import ConceptsList from "./ConceptsList";
import Authorship from "./Authorship";
import EntityIcon from "./EntityIcon";

import {createSimpleFilter} from "../filterConfigs";
import LinkToSearch from "./LinkToSearch";
import {unravel, sleep} from "../util";

import {mapActions, mapMutations, mapGetters} from "vuex";
import LinkToEntity from "./LinkToEntity";
// import {url} from "../url";

export default {
    name: "EntityWork",
    components: {
        LinkToEntity,
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
            const filter = createSimpleFilter("works", "cites", this.data.id)
            this.$store.dispatch("replaceInputFilters", [filter])
        },


    },
    computed: {
        ...mapGetters([]),
        workIsFreeAtPublisher() {
            return ["gold", "bronze", "hybrid"].includes(this.data.open_access.oa_status)
        },
        abstract() {
            if (!this.data.open_access.is_oa) return
            return unravel(this.data.abstract_inverted_index)
        },
        fulltextUrl() {
            // this is kind of hacky because the oa data we get back from the api has weird holes.
            if (this.data.open_access.oa_url) return this.data.open_access.oa_url
            else if (this.data.open_access.is_oa) return this.data.primary_location.source.url
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
            const filter = createSimpleFilter("works", "cites", this.data.id)
            return {
                name: "Serp",
                params: {entityType: "works"},
                query: {filter: filter.asStr},
            }
        },
        linkToReferences() {
            const filter = createSimpleFilter("works", "cited_by", this.data.id)
            return {
                name: "Serp",
                params: {entityType: "works"},
                query: {filter: filter.asStr},
            }
        },
        linkToRelatedWorks() {
            const filter = createSimpleFilter("works", "related_to", this.data.id)
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
            return this.data.authorships.slice(0, 100)

            // if (!this.authorshipsCount) return []
            // const sliceAt = (this.showAuthorDetails) ? Infinity : this.maxAuthorshipsToShowAtFirst
            // return this.data.authorships.slice(0, sliceAt)
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
  td.font-weight-bold {
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