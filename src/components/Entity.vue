<template>
  <v-card outlined v-if="data">
    <v-btn
            v-if="solo"
            @click="close"
            text
            rounded
            color="primary"
            class="mt-3 ml-1"
    >
      <v-icon>mdi-arrow-left</v-icon>
      back
    </v-btn>
    <div class="d-flex pa-3">

      <div>

        <div class="text-h5 font-weight-medium mt-0"
             style=" line-height: 1.3;"
             v-html="$prettyTitle(data.display_name)"

        >
        </div>

        <div class="card-header-top-row text-capitalize body-1">
<!--          <entity-icon small class="mr-1" :type="myEntityType"/>-->

          <span>{{ myEntityConfig.displayNameSingular }}</span>

          <span v-if="myEntityType === 'works' && data.type">
                ({{ data.type.replace("-", " ") }})
              </span>
          <span v-if="myEntityType=== 'institutions' && data.type">
                 ({{ data.type.replace("-", " ") }})
              </span>
          <span v-if="myEntityType=== 'concepts'">
                 (Level {{ data.level }})
              </span>
          <span v-if="myEntityType=== 'sources' && data.type">
                ({{ data.type }})
              </span>
          <span v-if="myEntityType=== 'publishers' && data.type">
<!--                 ({{ data.type }})-->

              </span>
        </div>

      </div>


      <v-spacer/>
      <!--      <div class="d-flex align-center justify-end" style="height: 50px; width: 50px;">-->
      <!--        <v-img max-height="100%"  :src="data.image_thumbnail_url" contain />-->
      <!--      </div>-->
<!--      <div>-->
<!--        <v-btn icon @click="close">-->
<!--          <v-icon>mdi-close</v-icon>-->
<!--        </v-btn>-->
<!--      </div>-->

    </div>
    <div class="px-2 pt-3 pb-1 d-flex">
      <!--        just for works-->
      <template v-if="myEntityType==='works'">
        <div>




          <!--   HTML at repository, paywalled at publisher -->
          <v-btn
                  :href="htmlUrl"
                  target="_blank"
                  color="primary"
                  class="mr-3"
                  small
                  rounded
                  text
                  v-if="isGreenOa && !pdfUrl"
          >
            <v-icon left small>mdi-file-document</v-icon>
            HTML
          </v-btn>


          <!--   PDF anywhere -->
          <v-btn
                  :href="pdfUrl"
                  target="_blank"
                  color="primary"
                  class="mr-3"
                  small
                  rounded
                  text
                  v-if="pdfUrl"
          >
            <v-icon left small>mdi-file-pdf-box</v-icon>
            PDF
          </v-btn>

          <!--   HTML  at publisher -->
          <v-btn
                  :href="htmlUrl"
                  target="_blank"
                  color="primary"
                  small
                  rounded
                  text
                  v-if="isOaAtPublisher"
          >
            <v-icon left small>mdi-file-document</v-icon>
            HTML
          </v-btn>




          <!--   Paywalled at publisher-->
          <v-btn
                  :href="data.primary_location.landing_page_url"
                  target="_blank"
                  text
                  small
                  rounded
                  v-if="!isOaAtPublisher"
          >
            <v-icon left small>mdi-lock-outline</v-icon>
            HTML
          </v-btn>

        </div>
      </template>


      <template v-else>
        <div>
          <v-btn
                  :href="linkoutUrl"
                  target="_blank"
                  v-if="linkoutUrl"
                  color="primary"
                  rounded
                  small
                  text
          >
            <v-icon left small>mdi-open-in-new</v-icon>
            {{ linkoutButtonText }}
          </v-btn>
        </div>
      </template>


      <v-spacer/>
      <v-menu>
        <template v-slot:activator="{on}">
          <v-btn icon v-on="on" class="mr-1">
            <v-icon>mdi-tray-arrow-down</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-subheader>
            Export as:
            <!--                {{ myFacetConfig.displayName | pluralize(2) }} as:-->
          </v-subheader>
          <v-divider></v-divider>
          <v-list-item
                  :href="apiUrl + '.bib'" target="_blank"
                  v-if="myEntityType==='works'"
          >
            <v-list-item-icon>
              <v-icon>mdi-file-document-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              BibTeX (for reference managers)
            </v-list-item-title>
          </v-list-item>
          <v-list-item
                  target="_blank"
                  :href="apiUrl"
          >
            <v-list-item-icon>
              <v-icon>mdi-api</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              JSON object
            </v-list-item-title>
          </v-list-item>

        </v-list>
      </v-menu>


    </div>


    <v-divider></v-divider>
    <v-card-text class="pa-0" style="font-size: 16px;">

      <entity-work v-if="myEntityType==='works'" :data="data"/>
      <entity-author v-if="myEntityType==='authors'" :data="data"/>
      <entity-venue v-if="myEntityType==='sources'" :data="data"/>
      <entity-publisher v-if="myEntityType==='publishers'" :data="data"/>
      <entity-institution v-if="myEntityType==='institutions'" :data="data"/>
      <entity-concept v-if="myEntityType==='concepts'" :data="data"/>


    </v-card-text>

    <v-expansion-panels flat accordion multiple>

      <v-expansion-panel v-if="myEntityType !== 'works'">
        <v-divider/>
        <v-expansion-panel-header>
          Summary statistics
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <entity-summary-stats
                  :data="data.summary_stats"
                  :cited-by-count="data.cited_by_count"
                  include-impact-factor
          />
          <!--              :include-impact-factor="['sources', 'publishers'].includes(myEntityType)"-->
        </v-expansion-panel-content>
      </v-expansion-panel>
      <id-list :data="data.ids"></id-list>
    </v-expansion-panels>


  </v-card>

</template>


<script>
import {url} from "../url";

import EntityWork from "./EntityWork";
import EntityAuthor from "./EntityAuthor";
import EntityVenue from "./EntityVenue";
import EntityPublisher from "./EntityPublisher";

import EntityInstitution from "./EntityInstitution";
import EntityConcept from "./EntityConcept";
import EntityIcon from "./EntityIcon";
import {entityConfigs} from "../entityConfigs";

import {entityTypeFromId} from "../util";
import {createDisplayFilter, createSimpleFilter} from "../filterConfigs";

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "../api";
import IdList from "./IdList.vue";
import EntitySummaryStats from "@/components/EntitySummaryStats.vue";

const getWorkFulltextUrl = function (data) {
    if (data.open_access.oa_url) return data.open_access.oa_url
    else if (data.open_access.is_oa) return data.primary_location.source.url
    else return null
}

const getGreenUrl = function (data) {
    if (data.open_access.oa_status === "green") {
        return data.open_access.oa_url
    }
}


const workIsFreeAtPublisher = function (data) {
    return ["gold", "bronze", "hybrid"].includes(data.open_access.oa_status)

}


export default {
    name: "Entity",
    metaInfo() {
        return {title: this.data?.display_name}
    },
    components: {
        IdList,
        EntityWork,
        EntityAuthor,
        EntityVenue,
        EntityInstitution,
        EntityPublisher,
        EntityConcept,
        EntityIcon,
        EntitySummaryStats,

    },
    props: {
        data: Object,
        solo: Boolean,
    },
    data() {
        return {
            foo: 42,
        }
    },
    computed: {
        ...mapGetters([
            "entityZoomHistoryData",
            "resultsFilters",
        ]),
        entityId() {
            return this.data.id
        },
        myEntityConfig() {
            return entityConfigs[this.myEntityType]
        },
        myEntityType() {
            if (!this.entityId) return
            return entityTypeFromId(this.entityId)
        },
        linkoutButtonText() {
            if (this.myEntityType === "authors") return "ORCID"
            if (this.myEntityType === "sources") return "Homepage"
            if (this.myEntityType === "institutions") return "Homepage"
            if (this.myEntityType === "concepts") return "Wikipedia"
        },
        linkoutUrl() {
            if (this.myEntityType === "authors") return this.data.orcid
            if (this.myEntityType === "sources") return this.data.homepage_url
            if (this.myEntityType === "institutions") return this.data.homepage_url
            if (this.myEntityType === "concepts") return this.data.ids.wikipedia
        },
        filterIsApplied() {
            return this.resultsFilters.map(f => f.asStr).includes(this.filterToShowWorks.asStr)
        },
        myFilter() {

            return createSimpleFilter(
                "works",
                this.myEntityConfig.filterKey,
                this.entityId,
            )
        },
        filterToShowWorks() {
            if (this.myEntityType === "works") return
            return createSimpleFilter(
                "works",
                this.myEntityConfig.filterKey,
                this.entityId,
            )
        },
        linkToWorksSearch() {
            if (this.myEntityType === "works") return
            const filter = this.filterToShowWorks
            return {
                name: "Serp",
                params: {entityType: "works"},
                query: {filter: filter.asStr},
            }
        },
        greenUrl() {
            if (this.myEntityType !== "works") return
            if (this.data.open_access.oa_status !== "green") return
            return this.data.open_access.oa_url
        },
        oaUrl() {
            if (this.myEntityType !== "works") return
            return this.data.open_access.oa_url
        },
        pdfUrl() {
            if (this.myEntityType !== "works") return
            return this.data.best_oa_location?.pdf_url
        },
        htmlUrl() {
            if (this.myEntityType !== "works") return
            return this.data.best_oa_location.landing_page_url
        },
        isGreenOa() {
            if (this.myEntityType !== "works") return
            return this.data.open_access?.oa_status === 'green'
        },
        isOaAtPublisher() {
            if (this.myEntityType !== "works") return
            return this.data.open_access?.is_oa && this.data.open_access?.oa_status !== 'green'
        },
        apiUrl() {
            const shortId = this.data.id.replace("https://openalex.org/", "")
            const entityType = entityTypeFromId(shortId)
            return `https://api.openalex.org/${entityType}/${shortId}`
        },
    },
    methods: {
        ...mapMutations([
            "snackbar"
        ]),
        ...mapActions([]),
        async copyPermalinkToClipboard() {
            await navigator.clipboard.writeText(this.data.id);
            this.snackbar("URL copied to clipboard.")
            // alert('Copied!');
        },
        close() {
            console.log("remove! new filters: ", this.myFilter)
            const newFilters = this.resultsFilters.filter(f => f.asStr !== this.myFilter.asStr)
            url.setFilters(
                "works",
                newFilters
            )
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
.entity-zoom-container {
  //position: absolute;
  //top: 0;
  //right: 0;
  //left: 0;
  //bottom: 0;
}
.data-row {
  //margin-top: 20px;
}

</style>