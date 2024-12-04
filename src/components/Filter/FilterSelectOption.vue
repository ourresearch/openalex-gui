<template>
  <v-menu
      rounded
      max-width="800"
      class=""
      offset-y
      :close-on-content-click="false"
      v-model="isMenuOpen"
  >
    <template v-slot:activator="{on}">
      <!--    <v-progress-circular v-if="isLoading" size="10" indeterminate class="mr-2" />-->
      <v-chip
          color="white"
          class="option mr-1 px-4 py-4 mb-1 mt-1  font-weight-regular hover-color-1 body-1"
          v-on="on"
          close
          close-icon="mdi-close"
          @click:close="$emit('delete')"
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
      <v-divider/>
      <v-card-actions>
        <v-spacer/>
        <v-btn
               class="ml-4"
               color="primary"
               rounded
               exact-path
               :to="filterValue | entityZoomLink"
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
  name: "FilterSelectOption",
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
      "entityType",
    ]),
    isEntity() {
      // if (!this.filterId) return false
      return getEntityConfigs().some(c => c.filterKey === this.filterId)
    },
    myEntityType(){
      console.log("FilterSelectOption filterValue", this.filterValue)
      return entityTypeFromId(this.filterValue)
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
    myEntityConfig(){
      return getEntityConfig(this.myEntityType)
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
    this.entityData = await api.getEntity(this.filterValue)
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