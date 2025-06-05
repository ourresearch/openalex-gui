<template>
  <span>
    <v-btn
        variant="text"
        size="x-large"
        v-if="$vuetify.display.mobile"
        :id="myId"
        class="rounded-lg pl-0 pr-0"
    >
      <v-icon>{{ entityTypeConfig.icon }}</v-icon>
      <v-icon>mdi-menu-down</v-icon>
    </v-btn>
    <v-btn
        v-else
        variant="text"
        class="text-capitalize rounded-lg elevation-0 entity-type-select-btn"
        :id="myId"
        size="x-large"
    >
      <v-icon>{{ entityTypeConfig.icon }}</v-icon>
      <span class="ml-2">
        {{ entityTypeConfig.displayName }}
      </span>
      <v-icon>mdi-menu-down</v-icon>
    </v-btn>

    <v-menu
        v-model="isDialogOpen"
        :activator="'#' +  myId"
        class="rounded-lg"
        location="bottom"
    >
      <v-card flat rounded="xl">
        <v-card-text class="pa-0">
          <v-list>
            <v-list-subheader>What are you looking for?</v-list-subheader>
            <v-list-item
                v-for="entityOption in entityTypeOptions"
                :key="entityOption.name"
                class="my-0 py-0"
                @click="entityType = entityOption.name"
            >
              <template #prepend>
                <v-icon>{{ entityOption.icon }}</v-icon>
              </template>
              <v-list-item-title class="text-capitalize">
                <span>{{ entityOption.displayName }}</span>
              </v-list-item-title>
                <v-list-item-subtitle class="">
                  {{ entityOption.descr }}
                </v-list-item-subtitle>
              
              <template #append>
                <v-icon v-if="entityType === entityOption.name">mdi-check</v-icon>
              </template>

            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-menu>
  </span>
</template>


<script>
import {mapMutations} from 'vuex'
import {entityConfigs, getEntityConfig, getEntityConfigs} from "../entityConfigs";
import {url} from "@/url";

export default {
  name: "EntityTypeSelector",
  props: {
    inline: Boolean,
  },
  components: {
  },
  data: function () {
    return {
      select: "",
      isDialogOpen: false,
      entityConfigs,
      myId: "my-id-" + Math.random().toString().replace(".", "")
    }
  },
  computed: {
    entityTypeOptions() {
      return getEntityConfigs().filter(c => c.hasSerp)
    },
    entityTypeConfig() {
      return getEntityConfig(this.entityType)
    },
    entityType: {
      get(){
        return this.$route.params.entityType
      },
      set(to){
        url.pushToRoute(this.$router, {
          name: "Serp",
          params: {entityType: to}
        })

      }
    }
  },
  methods: {
    ...mapMutations([
      "setEntityType",
    ]),
    openEntityMenu() {
      this.items = []
    },
  },
  watch: {
    "$store.state.entityType": {
      handler() {
      },
      immediate: true,
    },
  },
}
</script>


<style lang="scss" scoped>
.card-button {
  background-color: rgba(0, 0, 0, 0.05) !important;

  &:hover {
    background-color: rgba(0, 0, 0, .08) !important;
  }

  &.selected {
    background-color: #444 !important;

  }
}

</style>