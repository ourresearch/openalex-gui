<template>
  <span>
    <a
        v-if="inline"
        class="entity-type-select-btn"
        :id="myId"
    >
      {{ selectedEntityTypeConfig.displayName }}
    </a>
    <v-btn
        v-else
        rounded
        x-large
        text
        class="text-capitalize elevation-0 entity-type-select-btn"
        :id="myId"

    >
      <v-icon>{{ selectedEntityTypeConfig.icon }}</v-icon>
      <span
          v-if="$vuetify.breakpoint.mdAndUp"
          class="ml-2"
      >
        {{ selectedEntityTypeConfig.displayName }}
      </span>
      <v-icon>mdi-menu-down</v-icon>
    </v-btn>

    <component
        :is="$vuetify.breakpoint.mobile ? 'v-dialog' : 'v-menu'"
        v-model="isDialogOpen"
        fullscreen
        :activator="'#' +  myId"
        rounded
    >
      <v-card flat rounded>
        <v-toolbar flat v-if="$vuetify.breakpoint.mobile">
          <v-btn icon @click="isDialogOpen = false">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>

          <v-toolbar-title>
            What are you looking for?
          </v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <v-card-text class="pa-0">
          <!--        <v-container>-->
          <!--          <v-row-->
          <!--              v-if="$vuetify.breakpoint.mdAndUp"-->
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
            <v-list-item
                v-for="entityType in entityTypeOptions"
                :key="entityType.name"
                :to="{name: 'Serp', params: {entityType: entityType.name}}"
                class=""
                @click="isDialogOpen = false"
            >
              <v-list-item-icon>
                <v-icon>{{ entityType.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="text-capitalize">
                  <span>{{ entityType.displayName }}</span>
                </v-list-item-title>
                <v-list-item-subtitle class="">
                  {{ entityType.descr }}
                </v-list-item-subtitle>

              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>

      </v-card>

    </component>

  </span>
</template>


<script>
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {entityConfigs} from "../entityConfigs";
import {VMenu} from "vuetify/lib";
import {VDialog} from "vuetify/lib";

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
      selectedEntityType: "works",
      myId: "my-id-" + Math.random().toString().replace(".", "")
    }
  },
  computed: {
    ...mapGetters([]),
    entityTypeOptions() {
      return [...Object.values(entityConfigs)]
    },
    selectedEntityTypeConfig() {
      return entityConfigs[this.selectedEntityType]
    },
  },
  methods: {
    ...mapMutations([
      "setEntityType",
    ]),
    ...mapActions([
      "removeAllInputFilters",
    ]),

    setSelectedEntityType(value) {
      this.selectedEntityType = value
    },
    openEntityMenu() {
      this.items = []

    },
  },
  watch: {

    "$store.state.entityType": {
      handler(to, from) {
        this.setSelectedEntityType(to)
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