<template>

  <v-card flat>

      <v-divider v-if="entityZoomHistoryData.length"/>

      <div class="pt-6 px-6 pb-3 d-flex">
        <div>
          filter


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
      text
    </v-card-text>
    <v-divider/>
    <v-card-actions class="py-6 px-5">
      action
    </v-card-actions>


  </v-card>

</template>


<script>
import {entityConfigs} from "../entityConfigs";

import {entityTypeFromId} from "../util";
import {createSimpleFilter} from "../filterConfigs";

import {mapActions, mapGetters, mapMutations} from "vuex";



export default {
  components: {
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
    myEntityConfig() {
      return entityConfigs[this.zoomType]
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
    apiUrl() {
      // const shortId = this.entityZoomData.id.replace("https://openalex.org/", "")
      // const entityType = entityTypeFromId(shortId)
      // return `https://api.openalex.org/${entityType}/${shortId}`
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