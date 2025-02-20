<template>
  <v-navigation-drawer
      v-model="isOpen"
      app
      right
      :width="$vuetify.breakpoint.mobile ? '95%' : '50%'"
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
    id() {
      return url.getZoom(this.$route);
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
        !to && url.setZoom(undefined);
      }
    }
  },
  methods: {
    async getEntityData() {
      if (!this.id) {
        this.entityData = null
        return
      }
      this.isLoading = true;
      // console.log("EntityDrawer getEntityData() loading", this.isLoading)
      this.entityData = await api.get(this.id);
      this.isLoading = false;
      // console.log("EntityDrawer getEntityData() done loading", this.isLoading)
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