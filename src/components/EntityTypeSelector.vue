<template>
  <span>
<!--    <a-->
<!--        v-if="inline"-->
<!--        class="entity-type-select-btn"-->
<!--        :id="myId"-->
<!--    >-->
<!--      {{ entityTypeConfig.displayName }}-->
<!--    </a>-->
    <v-btn
        rounded
        variant="text"
        size="x-large"
        v-if="$vuetify.display.mobile"
        :id="myId"
        class="pl-0 pr-0"
    >
      <v-icon>{{ entityTypeConfig.icon }}</v-icon>
      <v-icon>mdi-menu-down</v-icon>
    </v-btn>
    <v-btn
        v-else
        rounded
        variant="text"
        class="text-capitalize elevation-0 entity-type-select-btn"
        :id="myId"
        size="x-large"

    >
      <v-icon>{{ entityTypeConfig.icon }}</v-icon>
      <span
          class="ml-2"
      >
        {{ entityTypeConfig.displayName }}
      </span>
      <v-icon>mdi-menu-down</v-icon>
    </v-btn>

    <v-menu
        v-model="isDialogOpen"
        :activator="'#' +  myId"
        rounded
        offset-y
    >
      <v-card flat rounded>
        <v-card-text class="pa-0">
          <!--        <v-container>-->
          <!--          <v-row-->
          <!--              v-if="$vuetify.display.mdAndUp"-->
          <!--          >-->
          <!--            <v-col-->
          <!--                cols="6"-->
          <!--                v-for="entityType in entityTypeOptions"-->
          <!--                :key="entityType.name"-->
          <!--                :to="{name: 'Serp', params: {entityType: entityType.name}}"-->
          <!--                class=""-->
          <!--                @click="isDialogOpen = false"-->
          <!--            >-->
          <!--              <v-card-->
          <!--                  class="d-flex px-6 card-button"-->
          <!--                  rounded-->
          <!--                  flat-->
          <!--                  :to="{name: 'Serp', params: {entityType: entityType.name}}"-->
          <!--                  @click="isDialogOpen = false"-->
          <!--                  :class="{selected: $route.params.entityType === entityType.name}"-->
          <!--                  :dark="$route.params.entityType === entityType.name"-->
          <!--              >-->
          <!--                <v-list-item-icon>-->
          <!--                  <v-icon large left>{{ entityType.icon }}</v-icon>-->
          <!--                </v-list-item-icon>-->
          <!--                <div>-->
          <!--                  <v-card-title class="text-capitalize mb-0 pb-0">-->
          <!--                    {{ entityType.name }}-->
          <!--                  </v-card-title>-->
          <!--                  <div class="mx-4 mb-4">-->
          <!--                    {{ entityType.descr }}-->
          <!--                  </div>-->

          <!--                </div>-->

          <!--              </v-card>-->

          <!--            </v-col>-->
          <!--          </v-row>-->

          <!--        </v-container>-->

          <v-list
          >
            <v-subheader>What are you looking for?</v-subheader>
            <v-list-item
                v-for="entityOption in entityTypeOptions"
                :key="entityOption.name"
                class=""
                @click="entityType = entityOption.name"
            >
              <v-list-item-icon>
                <v-icon>{{ entityOption.icon }}</v-icon>
              </v-list-item-icon>
              
                <v-list-item-title class="text-capitalize">
                  <span>{{ entityOption.displayName }}</span>
                </v-list-item-title>
                <v-list-item-subtitle class="">
                  {{ entityOption.descr }}
                </v-list-item-subtitle>
              
              <v-list-item-icon v-if="entityType === entityOption.name">
                <v-icon>mdi-check</v-icon>
              </v-list-item-icon>
            </v-list-item>
          </v-list>
        </v-card-text>

      </v-card>

    </v-menu>

  </span>
</template>


<script>
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {entityConfigs, getEntityConfig, getEntityConfigs} from "../entityConfigs";
import { VMenu } from "vuetify/components";
import { VDialog } from "vuetify/components";
import {url} from "@/url";

export default {
  name: "SearchBox",
  props: {
    inline: Boolean,
  },
  components: {
    VMenu,
    VDialog
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
    ...mapGetters([]),
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
    ...mapActions([
    ]),

    openEntityMenu() {
      this.items = []

    },
  },
  watch: {

    "$store.state.entityType": {
      handler(to, from) {
      },
      immediate: true,
    },
  },
  mounted() {
  },
  beforeCreate() {

  }
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