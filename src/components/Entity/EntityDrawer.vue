<template>
  <v-navigation-drawer
      v-model="isOpen"
      app
      location="right"
      :width="$vuetify.display.mobile ? '95%' : '50%'"
      temporary
      disable-route-watcher
  >
    <v-card min-height="100" flat tile :loading="isLoading" >
      <template v-if="entityData">
        <div class="d-flex pa-4">
          <entity-header
              :entity-data="entityData"
              show-permalink-button
              class=" flex-grow-1"
          />
          <v-btn icon @click="isOpen = !isOpen">
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
      isLoading: false
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
  },
  watch: {
    id: {
      handler(to) {
        this.getEntityData();
      },
      immediate: true
    }
  }
}
</script>

<style scoped lang="scss">

</style>