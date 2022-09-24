<template>

  <v-dialog
      v-model="zoomIsOpen"
      scrollable
      max-width="900"
  >
    <v-card flat v-if="entityZoomData">
      <div>
        <div
            class="py-2 body-1"
            v-if="entityZoomHistoryData.length"
            style="background: #fff;"
        >
          <!--          {{ entityZoomHistoryData }}-->
          <div
              v-for="zoomData in entityZoomHistoryData"
              :key="zoomData.id"
          >
            <router-link
                :to="zoomData.id | zoomLink"
                class="text-decoration-none px-6 grey--text"
            >
              <v-icon small left color="">mdi-history</v-icon>
              <!--              <v-icon small color="primary">{{ getEntityIconFromId(zoomData.id) }}</v-icon>-->
              {{ zoomData.display_name }}
            </router-link>
          </div>
        </div>
        <v-divider v-if="entityZoomHistoryData.length"/>
        <div class="pt-6 px-6 pb-3 d-flex">
          <div>
            <div class="body-1 text-capitalize">
              <entity-icon :type="zoomType" small left/>
              <span>{{ zoomTypeConfig.displayNameSingular }}</span>

              <span v-if="zoomType === 'works' && entityZoomData.type">
                ({{ entityZoomData.type.replace("-", " ") }})
              </span>
              <span v-if="zoomType=== 'institutions' && entityZoomData.type">
                 ({{ entityZoomData.type.replace("-", " ") }})
              </span>
              <span v-if="zoomType=== 'concepts'">
                 (Level {{ entityZoomData.level }})
              </span>
              <div class="text-h6 font-weight-medium mb-3 mt-0" style="font-weight: 450 !important; line-height: 1.5;">
                {{ entityZoomData.display_name }}
              </div>
            </div>


          </div>
          <v-spacer/>
          <div class="pl-10">
            <v-btn large icon :to="currentUrlWithoutZoom" class="no-active">
              <v-icon>mdi-close</v-icon>
            </v-btn>

          </div>
        </div>
      </div>
      <v-divider></v-divider>
      <v-card-text class="pa-6" style="font-size: 16px;">

        <entity-work v-if="zoomType==='works'" :data="entityZoomData"/>
        <entity-author v-if="zoomType==='authors'" :data="entityZoomData"/>
        <entity-venue v-if="zoomType==='venues'" :data="entityZoomData"/>
        <entity-institution v-if="zoomType==='institutions'" :data="entityZoomData"/>
        <entity-concept v-if="zoomType==='concepts'" :data="entityZoomData"/>

      </v-card-text>
      <v-divider/>
      <v-card-actions class="py-6 px-5">

        <!--        just for works-->
        <template v-if="zoomType==='works'">
          <div>

            <!--            free to read at repository (green oa)-->
            <v-btn
                v-if="isGreenOa"
                :href="oaUrl"
                target="_blank"
                color="primary"
                class="py-2 mr-3"
                style="height: auto; text-align: left;"
            >
              <v-icon left>mdi-open-in-new</v-icon>
              <div>
                <div>
                   fulltext
                </div>
                <div
                    class="body-2 text-lowercase"
                    style="font-weight: normal;"
                >
                  <span class="">free</span>
                  <span style="font-weight: normal">
                    via repository
                  </span>
                </div>
              </div>
            </v-btn>

            <!--            at the publisher (OA or not)-->
            <v-btn
                :href="oaUrl"
                target="_blank"
                color="primary"
                :outlined="!isOaAtPublisher"
                class="py-2 mr-3"
                style="height: auto; text-align: left;"
            >
              <v-icon left>mdi-open-in-new</v-icon>
              <div>
                <div>
                   fulltext
                </div>
                <div
                    class="body-2 text-lowercase"
                    style="font-weight: normal;"
                >
                  <span
                      class=""
                  >
                    {{(isOaAtPublisher) ? "free" : "paywalled"}}
                  </span>
                  <span style="font-weight: normal">
                    at publisher
                  </span>
                </div>
              </div>
            </v-btn>
          </div>
        </template>


        <!--        everything except for works-->
        <template v-else>
          <div class="">
            <v-btn
                :href="linkoutUrl"
                target="_blank"
                class=""
                v-if="linkoutUrl"
                color="primary"
                :outlined="!linkoutButtonIsGood"
            >
              <v-icon left>mdi-open-in-new</v-icon>
              {{ linkoutButtonText }}
            </v-btn>
          </div>
        </template>

        <v-spacer/>
        <v-menu>
          <template v-slot:activator="{on}">
            <v-btn text v-on="on">
              <v-icon left>mdi-download-outline</v-icon>
              Export
              <v-icon>mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item :href="apiUrl" target="_blank">
              <v-icon left>mdi-code-json</v-icon>
              JSON (API)
            </v-list-item>
            <v-list-item :href="apiUrl + '.bib'" target="_blank">
              <v-icon left>mdi-file-download-outline</v-icon>
              BibTeX
            </v-list-item>
          </v-list>
        </v-menu>


      </v-card-actions>


    </v-card>

  </v-dialog>
</template>


<script>
import EntityWork from "./EntityWork";
import EntityAuthor from "./EntityAuthor";
import EntityVenue from "./EntityVenue";
import EntityInstitution from "./EntityInstitution";
import EntityConcept from "./EntityConcept";
import EntityIcon from "./EntityIcon";
import {entityConfigs} from "../entityConfigs";

import {entityTypeFromId} from "../util";

import {mapActions, mapGetters, mapMutations} from "vuex";

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
  props: {
    data: Object,
    append: String,
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
    ...mapActions([]),
    async copyPermalinkToClipboard() {
      await navigator.clipboard.writeText(this.entityZoomData.id);
      this.snackbar("URL copied to clipboard.")
      // alert('Copied!');
    },
    getEntityIconFromId(id) {
      const type = entityTypeFromId(id)
      return entityConfigs[type]?.icon
    },
  },
  computed: {
    ...mapGetters([
      "zoomType",
      "entityZoomData",
      "zoomId",
      "zoomTypeConfig",
      "entityZoomHistoryData",
    ]),
    zoomIsOpen: {
      get() {
        return !!this.zoomId
      },
      set(newVal) {
        this.$router.push(this.currentUrlWithoutZoom)
      }
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
    greenUrl() {
      if (this.zoomType !== "works") return
      if (this.entityZoomData.open_access.oa_status !== "green") return
      return this.entityZoomData.open_access.oa_url
    },
    oaUrl() {
      if (this.zoomType !== "works") return
      return this.entityZoomData.open_access.oa_url
    },
    isGreenOa() {
      if (this.zoomType !== "works") return
      return this.entityZoomData.open_access?.oa_status === 'green'
    },
    isOaAtPublisher() {
      if (this.zoomType !== "works") return
      return this.entityZoomData.open_access?.is_oa && this.entityZoomData.open_access?.oa_status !== 'green'
    },
    linkoutUrl() {
      if (this.zoomType === "works") {
        return this.entityZoomData.host_venue.url
      } else if (this.zoomType === "authors") {
        // pass
      } else if (this.zoomType === "venues") {
        return "view website"
      } else if (this.zoomType === "institutions") {
        return "view website"
      } else if (this.zoomType === "concepts") {
        return "view on wikipedia"
      }
    },
    linkoutButtonIsGood() {
      if (this.zoomType === "works" && !workIsFreeAtPublisher(this.entityZoomData)) {
        return false
      }
      return true
    },
    linkoutButtonText() {
      if (this.zoomType === "works") {
        return "Read " + ((workIsFreeAtPublisher(this.entityZoomData)) ? "(free)" : "(paywall)")
      } else if (this.zoomType === "authors") {
        // pass
      } else if (this.zoomType === "venues") {
        return "view website"
      } else if (this.zoomType === "institutions") {
        return "view website"
      } else if (this.zoomType === "concepts") {
        return "view on wikipedia"
      }
    },
    apiUrl() {
      const shortId = this.entityZoomData.id.replace("https://openalex.org/", "")
      const entityType = entityTypeFromId(shortId)
      return `https://api.openalex.org/${entityType}/${shortId}`
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
.entity-zoom-container {
  //position: absolute;
  //top: 0;
  //right: 0;
  //left: 0;
  //bottom: 0;
}

</style>