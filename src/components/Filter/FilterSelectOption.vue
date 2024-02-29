<template>
  <v-menu
      rounded
      max-width="400"
      class=""
      offset-y
      :close-on-content-click="false"
      v-model="isMenuOpen"
  >
    <template v-slot:activator="{on}">
      <!--    <v-progress-circular v-if="isLoading" size="10" indeterminate class="mr-2" />-->
      <v-chip
          outlined
          label
          class=" option d-block mr-1  py-1 mb-1 mt-1"
          style="height: unset;"
          v-on="on"
          close
          @click:close="$emit('delete')"
          close-icon="mdi-close"
      >
        <template v-if="filterDisplayValue">
          {{ filterDisplayValue | truncate(50) }}
        </template>
        <template v-else>
          loading...
        </template>
<!--        <v-icon>mdi-menu-down</v-icon>-->
      </v-chip>
    </template>
    <v-card :loading="isLoading">
      <v-card-title>
        {{ filterDisplayValue }}
      </v-card-title>
      <v-card-subtitle class="mb-0 pb-0">
        {{ filterValue }}
      </v-card-subtitle>
      <v-divider class="my-2" />
      <entity-new v-if="myEntityConfig" :data="entityData" :type="myEntityConfig.name" />
<!--      <div class="pa-3 d-flex">-->
<!--        <div class="content">-->
<!--          <div class="text-h6">-->
<!--            {{ filterDisplayValue }}-->
<!--          </div>-->
<!--          <div class="caption grey&#45;&#45;text">-->
<!--            {{ myEntityType | pluralize(1)}}-->
<!--            {{ isEntity ? " · " + myEntityId : "" }}-->
<!--            <template v-if="0"></template>-->
<!--          </div>-->
<!--        </div>-->
<!--        <v-spacer></v-spacer>-->
<!--      </div>-->
<!--      <v-divider v-if="isEntity" />-->
<!--      <v-card-text class="pa-4" v-if="isEntity">-->
<!--        <div v-if="alternateNamesString">-->
<!--          <span class="font-weight-bold">Alternate names: </span>-->
<!--          <span>{{ alternateNamesString }}</span>-->
<!--        </div>-->
<!--        <div v-if="locationStr" class="mt-2">-->
<!--          <span class="font-weight-bold">Location: </span>-->
<!--          <span>{{ locationStr }}</span>-->
<!--        </div>-->
<!--      </v-card-text>-->
      <v-divider/>
      <v-card-actions>
        <v-spacer/>
        <v-btn
               class="ml-4"
               color="primary"
               rounded
               exact-path
               :to="myEntityId | entityZoomLink"
               v-if="myEntityId"
        >
          {{ myEntityConfig.displayName | pluralize(1) |capitalize }} profile
        </v-btn>
      </v-card-actions>


    </v-card>
  </v-menu>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {entityTypeFromId, isOpenAlexId, shortenOpenAlexId} from "@/util";
import {url} from "@/url";

import {getEntityConfig, getEntityConfigs, getLocationString} from "@/entityConfigs";
import {getFacetConfig} from "@/facetConfigs";
import EntityNew from "@/components/Entity/EntityNew.vue";

export default {
  name: "FilterOptionChip",
  components: {
    EntityNew,
  },
  props: {
    disabled: Boolean,
    filterValue: String,
    filterKey: String,
    close: Boolean,
    openMenu: Boolean,
    position: Number,
  },
  data() {
    return {
      foo: 42,
      displayValue: "",
      isLoading: false,
      isMenuOpen: false,
      entityData: null,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    isEntity() {
      // if (!this.filterId) return false
      return getEntityConfigs().some(c => c.filterKey === this.filterId)
    },
    myEntityType(){
      return (this.isEntity) ?
          entityTypeFromId(this.filterId) :
          this.filterConfig.displayName
    },
    filterConfig(){
      return getFacetConfig(this.entityType, this.filterKey)
    },
    filterId() {
      return this.filterValue.replace("!", "")
    },
    menuKey() {
      return this.filterKey + '-' + this.filterId
    },
    myEntityId(){
      if (!this.filterId) return
      return shortenOpenAlexId(this.filterId)
    },
    myEntityConfig(){
      return getEntityConfigs().find(c => c.filterKey === this.filterKey)
    },
    subtitle(){
      return "subtitle"
    },
    locationStr(){
      if (!this.entityData) return
      return getLocationString(this.entityData)
    },

    alternateNamesString() {
      return [
        ...this.entityData?.display_name_alternatives ?? [],
        ...this.entityData?.display_name_acronyms ?? [],
        ...this.entityData?.alternate_titles ?? [],

      ].join("; ")
    },
    filterDisplayValue(){
      return this.entityData?.display_name
    },
  },

  methods: {
    getEntityConfig,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
  },
  created() {
  },
  async mounted() {
    this.isLoading = true
    this.entityData = await api.getEntity(this.filterId)
    this.isLoading = false

    // setTimeout(()=>{
    //   if (this.$store.state.filterOptionChipOpenMenu === this.menuKey){
    // this.isMenuOpen = true
    //
    //   }
    //
    // }, 100)


  },
  watch: {}
}
</script>

<style scoped lang="scss">
.option {
  font-weight: bold;
  cursor: pointer;

  &:hover {
    //text-decoration:  underline;

  }
}

</style>