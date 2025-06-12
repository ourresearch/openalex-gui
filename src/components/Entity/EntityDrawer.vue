<template>
  <v-navigation-drawer
    v-model="isOpen"
    location="right"
    temporary
    disable-route-watcher
    :width="drawerWidth"
    class="full-height"
  >
    <v-card min-height="100" flat tile :loading="isLoading" >
      <template v-if="entityData">
        <div class="d-flex pa-4">
          <entity-header
            :entity-data="entityData"
            show-permalink-button
            class=" flex-grow-1"
          />
          <v-btn icon variant="plain" @click="isOpen = !isOpen">
            <v-icon>mdi-close</v-icon>
          </v-btn>

        </div>

        <v-divider class="ma-3"/>
        
        <entity-new
          :data="entityData"
        />

      </template>
    </v-card>
  </v-navigation-drawer>
</template>

<script>

import {mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {url} from "@/url";
import {entityTypeFromId} from "@/util";

import EntityNew from "@/components/Entity/EntityNew.vue";
import EntityHeader from "@/components/Entity/EntityHeader.vue";


export default {
  name: "EntityDrawer",
  components: {
    EntityNew,
    EntityHeader,
  },
  props: {},
  data() {
    return {
      entityData: null,
      isLoading: false,
      windowWidth: window.innerWidth,
    }
  },
  computed: {
    ...mapGetters([
      "zoomId",
    ]),
    urlZoomId() {
      return url.getZoom(this.$route);
    },
    storeZoomId() {
      return this.zoomId;
    },
    id() {
      return this.storeZoomId || this.urlZoomId;
    },
    myEntityType() {
      if (!this.id) { return; }
      return entityTypeFromId(this.id);
    },
    drawerWidth() {
      // Convert percentage to numeric pixel value due to Vuetify 3 bug
      // https://github.com/vuetifyjs/vuetify/issues/16150
      return this.$vuetify.display.mobile 
        ? Math.round(this.windowWidth * 0.9) 
        : Math.round(this.windowWidth * 0.5);
    },
    isOpen: {
      get() {
        return !!this.id;
      },
      set(to) {
        if (!to) {
          this.storeZoomId && this.setZoomId(null);
          this.urlZoomId && url.setZoom(undefined); 
        }
      }
    }
  },
  methods: {
    ...mapMutations([
      "setZoomId",
    ]),
    async getEntityData() {
      if (!this.id) {
        this.entityData = null;
        return;
      }
      this.isLoading = true;
      this.entityData = await api.get(this.id);
      this.isLoading = false;
    },
    handleResize() {
      this.windowWidth = window.innerWidth;
    },
  },
  watch: {
    id: {
      handler() {
        this.getEntityData();
      },
      immediate: true
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
}
</script>

<style>
/* Using non-scoped styles to properly override Vuetify's drawer styles */
.v-navigation-drawer.full-height {
  height: 100vh !important;
  max-height: 100vh !important;
  top: 0 !important;
  z-index: 10000 !important;
}
</style>