<template>
  <div>
    <v-dialog
        v-model="zoomIsOpen"
        scrollable
        max-width="800"
        :fullscreen="$vuetify.breakpoint.mobile"
    >


      <v-card flat v-if="data">
        <div class="card-header py-3 px-6 d-flex align-start">
          <!--          <entity-icon x-large class="mr-4" :type="entityType" />-->

          <div>
            <div class="card-header-top-row text-capitalize body-2">

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
            </div>
            <div class="text-h6 font-weight-medium mt-0"
                 style="font-weight: 450 !important; line-height: 1.5;"
                 v-html="$prettyTitle(data.display_name)"

            >
            </div>

          </div>


          <v-spacer/>
          <v-btn icon :to='{name: "Serp", query:{...$route.query}}' class="no-active">
            <v-icon>mdi-close</v-icon>
          </v-btn>

        </div>
        <v-divider></v-divider>
        <v-card-text class="pt-6" style="font-size: 16px;">

          <entity-work v-if="entityType==='works'" :data="data"/>
          <entity-author v-if="entityType==='authors'" :data="data"/>
          <entity-venue v-if="entityType==='venues'" :data="data"/>
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
                  <v-list-item target="_blank" :href="data.host_venue.url">
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
                  :href="data.host_venue.url"
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
          <template v-else>
            <div class="">
              <v-btn
                  :to="filterToShowWorks | addFilterLink"
                  class=""
                  color="primary"
              >
                <v-icon left>mdi-filter-plus-outline</v-icon>
                add filter
              </v-btn>

              <!--            <v-btn-->
              <!--                :href="linkoutUrl"-->
              <!--                target="_blank"-->
              <!--                class=""-->
              <!--                v-if="linkoutUrl"-->
              <!--                color="primary"-->
              <!--                :outlined="!linkoutButtonIsGood"-->
              <!--            >-->
              <!--              <v-icon left>mdi-open-in-new</v-icon>-->
              <!--              {{ linkoutButtonText }}-->
              <!--            </v-btn>-->
            </div>
          </template>

          <v-spacer/>
          <v-menu>
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on">
                <v-icon left>mdi-download-outline</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-subheader>Export this {{entityType}} as</v-subheader>
              <v-divider></v-divider>
              <v-list-item :href="apiUrl + '.bib'" target="_blank">
                <v-icon left>mdi-file-download-outline</v-icon>
                BibTeX
              </v-list-item>
              <v-list-item :href="apiUrl" target="_blank">
                <v-icon left>mdi-code-json</v-icon>
                JSON (API)
              </v-list-item>
            </v-list>
          </v-menu>


        </v-card-actions>


      </v-card>
    </v-dialog>
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
import {createSimpleFilter} from "../../filterConfigs";

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "../../api";

const getWorkFulltextUrl = function (data) {
  if (data.open_access.oa_url) return data.open_access.oa_url
  else if (data.open_access.is_oa) return data.host_venue.url
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
  components: {
    EntityWork,
    EntityAuthor,
    EntityVenue,
    EntityInstitution,
    EntityConcept,
    EntityIcon,
  },
  props: {},
  data() {
    return {
      foo: 42,
      data: null,
    }
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
      const pathName = entityTypeFromId(this.myId) + "/" + this.myId
      this.data = null

      api.get(pathName).then(resp => {
        console.log("zoomEntity resp", resp)
        this.data = resp
      })
    },
  },
  computed: {
    ...mapGetters([
      "entityZoomHistoryData",
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
    myId() {
      return this.$route.params.id
    },
    entityType() {
      return entityTypeFromId(this.myId)
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
    filterToShowWorks() {
      if (this.entityType === "works") return
      return createSimpleFilter(
          // this isn't right...pick up here.
          this.myEntityConfig.filterKey,
          this.myId,
      )
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
  created() {
  },
  mounted() {
    this.getData()

  },
  watch: {
    "$route.params.id": function (to, from) {
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