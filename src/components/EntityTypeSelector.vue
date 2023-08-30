<template>
  <v-menu offset-y>
    <template v-slot:activator="{ on, attrs }">
      <v-btn
              text
              rounded
               color="primary"
              class="text-capitalize"
              v-bind="attrs"
              v-on="on"
              @click="openEntityMenu"
              id="entity-type-select-btn"
      >
        <v-icon left>{{ selectedEntityTypeConfig.icon }}</v-icon>
        <span
                class=""
        >
          {{ selectedEntityTypeConfig.displayName }}
        </span>
        <v-icon right>mdi-menu-down</v-icon>
      </v-btn>
    </template>
    <v-list
            two-line
    >
      <v-subheader>Search for:</v-subheader>
      <v-divider></v-divider>
      <v-list-item
              v-for="entityType in entityTypeOptions"
              :key="entityType.name"
              :to="{name: 'Serp', params: {entityType: entityType.name}}"
              class=""
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
  </v-menu>

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

<style lang="scss">


</style>