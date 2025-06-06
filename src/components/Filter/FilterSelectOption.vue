<template>
  <v-menu
      max-width="800"
      class="rounded-lg"
      location="bottom"
      :close-on-content-click="false"
      v-model="isMenuOpen"
  >
    <template v-slot:activator="{ props }">
      <v-chip
          v-bind="props"
          variant="text"
          class="option mr-1 px-4 py-4 mb-1 mt-1  font-weight-regular hover-color-1 text-body-1"
          closable
          close-icon="mdi-close"
          @click="toggleMenu"
          @click:close="$emit('delete')"
      >
        <template v-if="filterDisplayValue">
          {{ filters.truncate(filterDisplayValue) }}
        </template>
        <template v-else>
          loading...
        </template>
      </v-chip>
    </template>
    <v-card :loading="isLoading" v-if="myEntityConfig">
      <v-card-title>
        {{ filterDisplayValue }}
      </v-card-title>
      <v-card-subtitle class="mb-0 pb-0">
        {{ filterValue }}
      </v-card-subtitle>
      <v-divider class="my-2" />
      <entity-new :data="entityData" :type="myEntityConfig.name" />
      <v-divider/>
      <v-card-actions>
        <v-spacer/>
        <v-btn
               class="ml-4"
               color="primary"
               rounded
               :to="filters.entityZoomLink(filterValue)"
        >
          {{ filters.pluralize(filters.capitalize(myEntityConfig.displayName), 1) }} profile
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>


<script>

import {mapGetters} from "vuex";

import {api} from "@/api";
import filters from '@/filters';
import {entityTypeFromId} from "@/util";
import {getEntityConfig} from "@/entityConfigs";
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
      displayValue: "",
      isLoading: false,
      isMenuOpen: false,
      entityData: null,
      myEntityConfig: null,
      filters,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    filterConfig(){
      return getFacetConfig(this.entityType, this.filterKey)
    },
    filterId() {
      return this.filterValue.replace("!", "")
    },
    menuKey() {
      return this.filterKey + '-' + this.filterId
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
    isValueNull() {
      return this.filterValue.split("/").slice(-1)[0] === "null"
    },
    nullDisplayValue() {
      return this.filterConfig.displayNullAs ?? "Unknown"
    }
  },
  methods: {
    getEntityConfig,
    toggleMenu() {
      // Don't try to show entity menu for null values or values that failed to get data from entity endpoint
      if (!this.entityData.hideMenu) {
        this.isMenuOpen = !this.isMenuOpen
      }
    }
  },
  created() {
  },
  async mounted() {
    this.isLoading = true
    //console.log("filterOptionSelect requesting entityData for: " + this.filterValue)
    if (this.isValueNull) {
      this.entityData = {
        display_name: this.nullDisplayValue,
        hideMenu : true
      }
    } else {
      try {
        this.entityData = await api.getEntity(this.filterValue)
        // Don't try getting entityConfig on filterValue unless API calls return,
        // when entity endpoint aren't available filterValue doesn't return from API will type included.
        const myEntityType = entityTypeFromId(this.filterValue)
        this.myEntityConfig = getEntityConfig(myEntityType)
      } catch (e) {
        // Mock data whenever API calls fails
        this.entityData = {
          display_name: this.filterValue,
          hideMenu: true
        }
      }
    }
    this.isLoading = false
  },
  watch: {}
}
</script>


<style scoped lang="scss">
.option {
  font-weight: bold;
  cursor: pointer;
}
</style>