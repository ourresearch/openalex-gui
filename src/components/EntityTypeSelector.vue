<template>
  <div>
    <v-btn
        rounded
        text
        x-large
        class="text-capitalize"
        @click="isDialogOpen = true"
        id="entity-type-select-btn"
    >
      <v-icon :left="$vuetify.breakpoint.mdAndUp">{{ selectedEntityTypeConfig.icon }}</v-icon>
      <template
          v-if="$vuetify.breakpoint.mdAndUp"
          class=""
      >
        {{ selectedEntityTypeConfig.displayName }}
      </template>
      <v-icon>mdi-menu-down</v-icon>
    </v-btn>

    <v-dialog
        v-model="isDialogOpen"
        :fullscreen="$vuetify.breakpoint.smAndDown"
    >
      <v-card flat>
        <v-toolbar flat>
          <v-toolbar-title>
            What are you looking for?
          </v-toolbar-title>
          <v-spacer/>
          <v-btn icon @click="isDialogOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-divider/>
        <v-container>
          <v-row
              v-if="$vuetify.breakpoint.mdAndUp"
          >
            <v-col
                cols="6"
                v-for="entityType in entityTypeOptions"
                :key="entityType.name"
                :to="{name: 'Serp', params: {entityType: entityType.name}}"
                class=""
                @click="isDialogOpen = false"
            >
              <v-card
                  class="d-flex px-6 card-button"
                  rounded
                  flat
                  :to="{name: 'Serp', params: {entityType: entityType.name}}"
                  @click="isDialogOpen = false"
                  :class="{selected: $route.params.entityType === entityType.name}"
                  :dark="$route.params.entityType === entityType.name"
              >
                <v-list-item-icon>
                  <v-icon large left>{{ entityType.icon }}</v-icon>
                </v-list-item-icon>
                <div>
                  <v-card-title class="text-capitalize mb-0 pb-0">
                    {{ entityType.name }}
                  </v-card-title>
                  <div class="mx-4 mb-4">
                    {{ entityType.descr }}
                  </div>

                </div>

              </v-card>

            </v-col>
          </v-row>

        </v-container>

        <v-list
            two-line
            nav
            v-if="$vuetify.breakpoint.smAndDown"
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

      </v-card>

    </v-dialog>

  </div>
</template>


<script>
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {entityConfigs} from "../entityConfigs";

export default {
  name: "SearchBox",
  props: {},
  components: {},
  data: function () {
    return {
      select: "",
      isDialogOpen: false,
      entityConfigs,
      selectedEntityType: "works",
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
      "replaceInputFilters",
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