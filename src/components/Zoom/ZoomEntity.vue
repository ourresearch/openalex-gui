<template>
  <div v-if="entityId">


      <v-card flat v-if="data">
        <div class="card-header py-3 px-6 d-flex align-start">

          <div>

            <div class="text-h5 font-weight-medium mt-0"
                 style=" line-height: 1.3;"
                 v-html="$prettyTitle(data.display_name)"

            >
            </div>

            <div class="card-header-top-row text-capitalize ">
                    <entity-icon small class="mr-1" :type="entityType" />

              <span>{{ myEntityConfig.displayNameSingular }}</span>

              <span v-if="entityType === 'works' && data.type">
                ({{ data.type.replace("-", " ") }})
              </span>
              <span v-if="entityType=== 'institutions' && data.type">
                 ({{ data.type.replace("-", " ") }})
              </span>
              <span v-if="entityType=== 'concepts'">
                 (Level {{ data.level }})
              </span>
              <span v-if="entityType=== 'sources' && data.type">
                 ({{ data.type }})
              </span>
            </div>

          </div>


          <v-spacer/>

        </div>
        <v-divider></v-divider>
        <v-card-text class="pt-6" style="font-size: 16px;">

          <entity-work v-if="entityType==='works'" :data="data"/>
          <entity-author v-if="entityType==='authors'" :data="data"/>
          <entity-venue v-if="entityType==='sources'" :data="data"/>
          <entity-institution v-if="entityType==='institutions'" :data="data"/>
          <entity-concept v-if="entityType==='concepts'" :data="data"/>

        </v-card-text>
        <v-divider/>
        <v-card-actions class="py-3 px-5">

          <!--        just for works-->
          <template v-if="entityType==='works'">
            <div>

              <!--              Green open access-->
              <v-menu
                  v-if="isGreenOa"
              >
                <template v-slot:activator="{on, attrs}">
                  <v-btn
                      color="primary"
                      v-bind="attrs"
                      v-on="on"
                  >
                    Open Access
                    <v-icon small right>mdi-menu-down</v-icon>
                  </v-btn>
                </template>
                <v-list
                >
                  <v-list-item :href="oaUrl" target="_blank" color="primary" :input-value="true">
                    <v-list-item-title>
                      <span class="font-weight-bold">Open Access</span> via repository
                    </v-list-item-title>
                    <v-icon right small>mdi-open-in-new</v-icon>

                  </v-list-item>
                  <v-list-item target="_blank" :href="data.primary_location.source.url">
                    <v-list-item-title>
                      <span class="font-weight-bold">Paywalled</span> at publisher
                    </v-list-item-title>
                    <v-icon right small>mdi-open-in-new</v-icon>

                  </v-list-item>
                </v-list>
              </v-menu>


              <!--   Open Access at publisher -->
              <v-btn
                  :href="oaUrl"
                  target="_blank"
                  color="primary"
                  v-if="isOaAtPublisher"
              >
                Open Access
                <v-icon right small>mdi-open-in-new</v-icon>
              </v-btn>

              <!--   Paywalled at publisher-->
              <v-btn
                  :href="data.primary_location.source.url"
                  target="_blank"
                  color="primary"
                  outlined
                  v-if="!isOaAtPublisher && !isGreenOa"
              >
                <v-icon left small>mdi-open-in-new</v-icon>
                Paywalled
              </v-btn>
            </div>
          </template>


          <!--        everything except for works-->
          <template v-if="0">
            <div>
              <v-btn
                  :to="linkToWorksSearch"
                  class=""
                  color="primary"
                  outlined
                  exact
              >
                <v-icon left>mdi-file-document-multiple-outline</v-icon>
                View works
              </v-btn>

              <v-btn
                  :href="linkoutUrl"
                  target="_blank"
                  class="ml-3"
                  v-if="linkoutUrl"
                  color="primary"
                  text
              >
                <v-icon left>mdi-open-in-new</v-icon>
                {{ linkoutButtonText }}
              </v-btn>
            </div>
          </template>

          <v-spacer/>
          <v-menu>
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on">
                <v-icon left>mdi-tray-arrow-down</v-icon>
              </v-btn>
            </template>
            <v-list dense>
              <v-subheader>Export data as</v-subheader>
              <v-divider></v-divider>
              <v-list-item :href="apiUrl + '.bib'" target="_blank" v-if="entityType==='works'">
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


        </v-card-actions>


      </v-card>
  </div>

</template>


<script>
import EntityWork from "../EntityWork";
import EntityAuthor from "../EntityAuthor";
import EntityVenue from "../EntityVenue";
import EntityInstitution from "../EntityInstitution";
import EntityConcept from "../EntityConcept";
import EntityIcon from "../EntityIcon";
import {entityConfigs} from "../../entityConfigs";

import {entityTypeFromId} from "../../util";
import {createDisplayFilter, createSimpleFilter} from "../../filterConfigs";

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "../../api";

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
  name: "ZoomEntity",
  metaInfo() {
    return {title: this.data?.display_name}
  },
  components: {
    EntityWork,
    EntityAuthor,
    EntityVenue,
    EntityInstitution,
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
    zoomIsOpen: {
      get() {
        return true
      },
      set(newVal) {
        // this.$router.push(this.currentUrlWithoutZoom)
        console.log("close entity zoom")
        this.$router.push({name: "Serp", query: {...this.$route.query}})
      }
    },
    myEntityConfig() {
      return entityConfigs[this.entityType]
    },
    entityType() {
      if (!this.entityId) return
      return entityTypeFromId(this.entityId)
    },
    linkoutUrl() {
      if (this.entityType === "sources") return this.data.homepage_url
      if (this.entityType === "institutions") return this.data.homepage_url
      if (this.entityType === "concepts") return this.data.ids.wikipedia
    },
    linkoutButtonText() {
      if (this.entityType === "sources") return "Homepage"
      if (this.entityType === "institutions") return "Homepage"
      if (this.entityType === "concepts") return "Wikipedia"
    },
    currentUrlWithoutZoom() {
      const newQuery = {...this.$route.query}
      newQuery.zoom = undefined
      return {
        name: this.$route.name,
        params: this.$route.params,
        query: newQuery,
      }
    },
    filterIsApplied() {
      return this.resultsFilters.map(f => f.asStr).includes(this.filterToShowWorks.asStr)
    },
    filterToShowWorks() {
      if (this.entityType === "works") return
      return createSimpleFilter(
          "works",
          this.myEntityConfig.filterKey,
          this.entityId,
      )
    },
    linkToWorksSearch() {
      if (this.entityType === "works") return
      const filter = this.filterToShowWorks
      return {
        name: "Serp",
        params: {entityType: "works"},
        query: {filter: filter.asStr},
      }
    },
    addWorksFilter() {

    },
    removeWorksFilter() {

    },
    greenUrl() {
      if (this.entityType !== "works") return
      if (this.data.open_access.oa_status !== "green") return
      return this.data.open_access.oa_url
    },
    oaUrl() {
      if (this.entityType !== "works") return
      return this.data.open_access.oa_url
    },
    isGreenOa() {
      if (this.entityType !== "works") return
      return this.data.open_access?.oa_status === 'green'
    },
    isOaAtPublisher() {
      if (this.entityType !== "works") return
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
    ...mapActions([
    ]),
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
      const pathName = this.entityType + "/" + this.entityId
      this.data = null
      console.log("zoomentity getting data for", this.entityId)

      api.get(pathName).then(resp => {
        console.log("zoomEntity resp", resp)
        this.data = resp
      })
    },
    
  },
  created() {
  },
  mounted() {

  },
  watch: {
    "$route.params.id": function (to, from) {
      // this.getData()
    },
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