<template>
  <v-navigation-drawer
      v-model="isOpen"
      app
      right
      :width="$vuetify.breakpoint.mobile ? '95%' : '50%'"
      temporary
      disable-route-watcher
  >
    <v-card flat tile :loading="isLoading">
<!--      loading-->

      <!--      <v-toolbar-->
      <!--          flat-->
      <!--          dense-->
      <!--      >-->
      <!--        &lt;!&ndash;        absolute width="100%"&ndash;&gt;-->
      <!--        <v-btn icon @click="isOpen = !isOpen">-->
      <!--          <v-icon>mdi-close</v-icon>-->
      <!--        </v-btn>-->
      <!--      </v-toolbar>-->
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

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import EntityNew from "@/components/Entity/EntityNew.vue";
import {entityTypeFromId} from "@/util";
import {api} from "@/api";
import EntityHeader from "@/components/Entity/EntityHeader.vue";

export default {
  name: "Template",
  components: {
    EntityNew,
    EntityHeader,
  },
  props: {},
  data() {
    return {
      foo: 42,
      entityData: null,
      isLoading: false
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    id() {
      return url.getZoom(this.$route)
    },
    myEntityType() {
      if (!this.id) return
      return entityTypeFromId(this.id)
    },
    isOpen: {
      get() {
        return !!this.id
      },
      set(to) {
        !to && url.setZoom(undefined)
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    async getEntityData() {
      if (!this.id) {
        this.entityData = null
        return
      }
      this.isLoading = true
      // console.log("EntityDrawer getEntityData() loading", this.isLoading)
      this.entityData = await api.get(this.id)
      this.isLoading = false
      // console.log("EntityDrawer getEntityData() done loading", this.isLoading)
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    id: {
      immediate: true,
      handler(to) {
        this.getEntityData()
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>