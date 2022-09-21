<template>

  <v-dialog
      v-model="zoomIsOpen"
      max-width="900"
  >
    <v-card flat>
      <v-toolbar flat fixed dense>
        <v-btn icon :to="currentUrlWithoutZoom" class="no-active">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>


      <v-row class="entity-zoom-container pa-5"  v-if="entityZoomData">
        <v-col cols="12" md="8" class="pr-12">
          <div class="caption text-capitalize">
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
          </div>

          <div class="text-h5 mb-3">{{ entityZoomData.display_name }}</div>


          <entity-work v-if="zoomType==='works'" :data="entityZoomData"/>
          <entity-author v-if="zoomType==='authors'" :data="entityZoomData"/>
          <entity-venue v-if="zoomType==='venues'" :data="entityZoomData"/>
          <entity-institution v-if="zoomType==='institutions'" :data="entityZoomData"/>
          <entity-concept v-if="zoomType==='concepts'" :data="entityZoomData"/>
        </v-col>
        <v-col cols="12" md="4">
          <div class="mt-4 mb-2">
            <v-btn
                :href="linkoutUrl"
                target="_blank"
                class=""
                v-if="linkoutUrl"
                color="primary"
                :outlined="!linkoutButtonIsGood"
                small
            >
              <v-icon left>mdi-open-in-new</v-icon>
              {{ linkoutButtonText }}
            </v-btn>
          </div>

          <div v-if="greenUrl" class="mb-2">
            <v-btn
                :href="greenUrl"
                target="_blank"
                color="primary"
                small
            >
              <v-icon left>mdi-open-in-new</v-icon>
              Read (free)
            </v-btn>
          </div>
          <!--      <v-divider class="my-4"></v-divider>-->
          <div v-if="zoomType==='works'" class="mb-2">
            <v-btn
                :href="apiUrl + '.bib'"
                target="_blank"
                x-small
                text
            >
              <v-icon left>mdi-download-outline</v-icon>
              Export as BibTeX
            </v-btn>
          </div>
          <div class="mb-2">
            <v-btn
                @click="copyPermalinkToClipboard"
                x-small
                text
            >
              <v-icon left>mdi-share-variant-outline</v-icon>
              <!--          <v-icon>mdi-api</v-icon>-->
              Copy URL
            </v-btn>
          </div>
          <div class="mb-2">
            <v-btn
                :href="apiUrl"
                target="_blank"
                x-small
                text
            >
              <v-icon left>mdi-code-json</v-icon>
              <!--          <v-icon>mdi-api</v-icon>-->
              View in API
            </v-btn>
          </div>


        </v-col>

      </v-row>

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
  },
  computed: {
    ...mapGetters([
      "zoomType",
      "entityZoomData",
      "zoomId",
      "zoomTypeConfig",
    ]),
    zoomIsOpen: {
      get(){
        return !!this.zoomId
      },
      set(newVal){
        console.log("entityZoom.zoomeIsOpen.set()", newVal)
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