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
          class="font-weight-bold option d-block mb-1 mr-1"
          v-on="on"
          close
          @click:close="deleteMe"
      >
        <span class="mr-2" v-if="isNegated">NOT</span>
        <template v-if="filterDisplayValue">
          {{ filterDisplayValue | truncate(20) }}
        </template>
        <template v-else>
          loading...
        </template>
<!--        <v-icon>mdi-menu-down</v-icon>-->
      </v-chip>
    </template>
    <v-card :loading="isLoading">
      <div class="pa-3 d-flex">
        <div class="content">
          <div class="text-h6">
            {{ filterDisplayValue }}
          </div>
          <div class="caption grey--text">
            {{ myEntityType | pluralize(1)}}
            {{ isEntity ? " · " + myEntityId : "" }}
            <template v-if="0"></template>
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-chip
            class="ml-2"
            filter
            small
            @click="toggleIsNegated"
            outlined
            :input-value="isNegated"
        >
          not
        </v-chip>


      </div>
      <v-divider/>
      <v-card-text class="pa-4" v-if="isEntity">
        <div v-if="alternateNamesString">
          <span class="font-weight-bold">Alternate names: </span>
          <span>{{ alternateNamesString }}</span>
        </div>
        <div v-if="locationStr" class="mt-2">
          <span class="font-weight-bold">Location: </span>
          <span>{{ locationStr }}</span>
        </div>

      </v-card-text>

      <v-divider/>
      <v-card-actions v-if="isEntity">
        <v-spacer/>

        <v-btn text
               rounded
               class="ml-2"
               :to="filterId | entityZoomLink"
               v-if="isEntity">
          <v-icon left>mdi-information-outline</v-icon>
          Details
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

import EditPhraseOption from "@/components/EditPhrase/EditPhraseOption.vue";
import FilterMatchMode from "@/components/Filter/FilterMatchMode.vue";
import {getEntityConfig, getLocationString} from "@/entityConfigs";
import {getFacetConfig} from "@/facetConfigs";

export default {
  name: "FilterOptionChip",
  components: {
    EditPhraseOption,
    FilterMatchMode,
  },
  props: {
    disabled: Boolean,
    filterValue: String,
    filterKey: String,
    close: Boolean,
    openMenu: Boolean,
    matchMode: String,
    position: Number,
  },
  data() {
    return {
      foo: 42,
      displayValue: "",
      isLoading: false,
      isMenuOpen: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    isEntity() {
      if (!this.filterId) return false
      return isOpenAlexId(this.filterId)
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
      if (!this.isEntity) return
      return shortenOpenAlexId(this.filterId)
    },
    isNegated() {
      return this.filterValue[0] === "!"
    },
    subtitle(){
      return "subtitle"
    },
    locationStr(){
      if (!this.filterData) return
      return getLocationString(this.filterData)
    },

    alternateNamesString() {
      return [
        ...this.filterData?.display_name_alternatives ?? [],
        ...this.filterData?.display_name_acronyms ?? [],
        ...this.filterData?.alternate_titles ?? [],

      ].join("; ")
    },
  },
  asyncComputed: {
    filterDisplayValue: async function () {
      this.isLoading = true
      // const resp = await api.makeAutocompleteResponseFromId(this.filterId)
      const displayName = await api.getFilterValueDisplayName(this.filterKey, this.filterId)
      this.isLoading = false
      console.log("filterDisplayValue", displayName)
      return displayName
    },
    filterData: async function () {
      if (!this.isEntity) return {}
      this.isLoading = true
      const resp = await api.getEntity(this.filterId)
      this.isLoading = false
      return resp
    },
  },

  methods: {
    getEntityConfig,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    deleteMe() {
      url.deleteFilterOption(this.entityType, this.filterKey, this.filterValue)
    },
    toggleIsNegated() {
      url.toggleFilterOptionIsNegated(
          this.entityType,
          this.filterKey,
          this.filterValue
      )
    },
  },
  created() {
  },
  async mounted() {
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