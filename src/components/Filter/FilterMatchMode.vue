<template>
  <v-menu location="bottom" max-width="400">
    <template v-slot:activator="{props}">
      <v-btn v-if="icon" icon v-on="on">
        <v-icon>{{ value === "all" ? "mdi-set-center" : "mdi-set-all" }}</v-icon>
      </v-btn>

      <v-chip
          v-else
          v-bind="props"
          variant="outlined"
          label
      >
        {{ (value === "all") ? "&" : "or" }}
      </v-chip>
    </template>

    <v-list>
      <v-list-subheader>
        Combine values using:
      </v-list-subheader>
      <v-divider />

      <v-list-item @click="value = 'all'">
        <v-icon color="">mdi-set-center</v-icon>
        
        <v-list-item-title class="">
          And
        </v-list-item-title>
        <v-list-item-subtitle>
          Match {{ count === 2 ? 'both' : 'all' }} options
        </v-list-item-subtitle>
        <v-list-item-subtitle v-if="isAnyOptionNegated" class="font-weight-bold">
          <v-icon size="x-small">mdi-information</v-icon>
          Mandatory when any option is negated
        </v-list-item-subtitle>
        
        <v-icon v-if="value === 'all'" color="">mdi-check</v-icon>
      </v-list-item>

      <v-list-item @click="value = 'any'" :disabled="isAnyOptionNegated">
        <v-icon :color="isAnyOptionNegated ? 'grey lighten-2' : ''">mdi-set-all</v-icon>
        
        <v-list-item-title class="">
          Or
        </v-list-item-title>
        <v-list-item-subtitle>
          Match {{ count === 2 ? 'either' : 'any' }} option
        </v-list-item-subtitle>
        
        <v-icon v-if="value === 'any'">mdi-check</v-icon>
      </v-list-item>

    </v-list>
  </v-menu>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {getFacetConfig} from "@/facetConfigs";

export default {
  name: "FilterMatchMode",
  components: {},
  props: {
    filterKey: String,
    icon: Boolean,
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    filterConfig(){
      return getFacetConfig(this.entityType, this.filterKey)
    },
    count(){
      return url.readFilterOptions(this.$route, this.entityType, this.filterKey).length
    },
    isAnyOptionNegated(){
         return url.readFilterOptions(this.$route, this.entityType, this.filterKey).some(val => {
           return val.indexOf("!") === 0
         })
    },
    value: {
      get() {
        return url.readFilterMatchMode(this.$route, this.entityType, this.filterKey)
      },
      set(to) {
        url.setFilterMatchMode(
            this.entityType,
            this.filterKey,
            to
        )
      }
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    toggleMode() {
      this.value = (this.value === "any") ?
          "all" :
          "any"
    },
  }
}
</script>


<style scoped lang="scss">

</style>