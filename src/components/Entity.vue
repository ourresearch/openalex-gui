<template>
  <div v-if="entityId">
    <v-card outlined v-if="data">
      <div class="card-header px-4 pl-3 pt-2 d-flex align-start">

        <div>

          <div class="text-h5 font-weight-medium mt-0"
               style=" line-height: 1.3;"
               v-html="$prettyTitle(data.display_name)"

          >
          </div>

          <div class="card-header-top-row text-capitalize ">
            <entity-icon small class="mr-1" :type="myEntityType"/>

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
        <div>
          <v-btn icon @click="close">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

      </div>
      <div class="px-4 pt-3 pb-1 d-flex">
        <!--        just for works-->
        <template v-if="myEntityType==='works'">
          <div>

            <!--              Green open access-->
<!--            <v-menu-->
<!--                v-if="isGreenOa"-->
<!--            >-->
<!--              <template v-slot:activator="{on, attrs}">-->
<!--                <v-btn-->
<!--                    color="primary"-->
<!--                    v-bind="attrs"-->
<!--                    v-on="on"-->
<!--                >-->
<!--                  Open Access-->
<!--                  <v-icon small right>mdi-menu-down</v-icon>-->
<!--                </v-btn>-->
<!--              </template>-->
<!--              <v-list-->
<!--              >-->
<!--                <v-list-item :href="oaUrl" target="_blank" color="primary" :input-value="true">-->
<!--                  <v-list-item-title>-->
<!--                    <span class="font-weight-bold">Open Access</span> via repository-->
<!--                  </v-list-item-title>-->
<!--                  <v-icon right small>mdi-open-in-new</v-icon>-->

<!--                </v-list-item>-->
<!--                <v-list-item target="_blank" :href="data.primary_location.source.url">-->
<!--                  <v-list-item-title>-->
<!--                    <span class="font-weight-bold">Paywalled</span> at publisher-->
<!--                  </v-list-item-title>-->
<!--                  <v-icon right small>mdi-open-in-new</v-icon>-->

<!--                </v-list-item>-->
<!--              </v-list>-->
<!--            </v-menu>-->


            <!--   Open Access at repository, toll-access at publisher -->
            <v-btn
                :href="oaUrl"
                target="_blank"
                color="primary"
                class="mr-3"
                small
                rounded
                v-if="isGreenOa"
            >
              Read
              <v-icon right small>mdi-open-in-new</v-icon>
            </v-btn>

            <!--   Open Access at publisher -->
            <v-btn
                :href="oaUrl"
                target="_blank"
                color="primary"
                small
                rounded
                v-if="isOaAtPublisher"
            >
              Read
              <v-icon right small>mdi-open-in-new</v-icon>
            </v-btn>

            <!--   Paywalled at publisher-->
            <v-btn
                :href="data.primary_location.source.url"
                target="_blank"
                color="primary"
                outlined
                small
                rounded
                v-if="!isOaAtPublisher"
            >
              <v-icon left small>mdi-open-in-new</v-icon>
              View
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
                outlined
                small
            >
              {{ linkoutButtonText }}
              <v-icon right small>mdi-open-in-new</v-icon>
            </v-btn>
          </div>
        </template>




        <v-spacer />
        <v-menu>
          <template v-slot:activator="{on}">
            <v-btn icon v-on="on" class="ml-2">
              <v-icon>mdi-tray-arrow-down</v-icon>
            </v-btn>
          </template>
          <v-list dense>
            <v-subheader>Export data as</v-subheader>
            <v-divider></v-divider>
            <v-list-item :href="apiUrl + '.bib'" target="_blank" v-if="myEntityType==='works'">
              <v-list-item-icon>
                <v-icon left>mdi-file-download-outline</v-icon>

              </v-list-item-icon>
              <v-list-item-title>

                BibTeX
              </v-list-item-title>
            </v-list-item>
            <v-list-item :href="apiUrl" target="_blank">
              <v-list-item-icon>

                <v-icon left>mdi-api</v-icon>
              </v-list-item-icon>
              <v-list-item-title>

                JSON object
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>


      <v-divider></v-divider>
      <v-card-text class="pt-6" style="font-size: 16px;">

        <entity-work v-if="myEntityType==='works'" :data="data"/>
        <entity-author v-if="myEntityType==='authors'" :data="data"/>
        <entity-venue v-if="myEntityType==='sources'" :data="data"/>
        <entity-publisher v-if="myEntityType==='publishers'" :data="data"/>
        <entity-institution v-if="myEntityType==='institutions'" :data="data"/>
        <entity-concept v-if="myEntityType==='concepts'" :data="data"/>

      </v-card-text>


    </v-card>
  </div>

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
    EntityWork,
    EntityAuthor,
    EntityVenue,
    EntityInstitution,
    EntityPublisher,
    EntityConcept,
    EntityIcon,
  },
  props: {
    entityId: String,
  },
  data() {
    return {
      foo: 42,
      data: null,
    }
  },
  computed: {
    ...mapGetters([
      "entityZoomHistoryData",
      "resultsFilters",
    ]),
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
    myFilter(){

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
    getEntityIconFromId(id) {
      const type = entityTypeFromId(id)
      return entityConfigs[type]?.icon
    },
    getData() {
      if (!this.entityId) return
      const pathName = this.myEntityType + "/" + this.entityId
      this.data = null
      console.log("zoomentity getting data for", this.entityId)

      api.get(pathName).then(resp => {
        console.log("zoomEntity resp", resp)
        this.data = resp
      })
    },
    close(){
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
    this.data = null
    this.getData()
  },
  watch: {
    "entityId": function (to, from) {
      this.data = null
      this.getData()
    }
  }
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

</style>