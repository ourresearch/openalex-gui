<template>

  <v-menu rounded offset-y max-width="400">
    <template v-slot:activator="{on}">
      <v-btn v-if="icon" icon v-on="on">
        <v-icon>{{ value === "all" ? "mdi-set-center" : "mdi-set-all" }}</v-icon>
      </v-btn>

      <v-chip
          v-else
          v-on="on"
          outlined
      >
        {{ (value === "all") ? "&" : "or" }}
      </v-chip>
    </template>

    <v-list>
      <v-subheader>Combine
<!--        {{ count }}-->
<!--        <span class=" mx-1"> {{ filterConfig.displayName |capitalize }}</span> -->
        values using:</v-subheader>
      <v-divider />

      <v-list-item @click="value = 'all'">
        <v-list-item-icon>
          <v-icon color="">mdi-set-center</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title class="">
            And
          </v-list-item-title>
          <v-list-item-subtitle>
            Match {{ count === 2 ? 'both' : 'all' }} options
          </v-list-item-subtitle>
          <v-list-item-subtitle v-if="isAnyOptionNegated" class="font-weight-bold">
            <v-icon x-small>mdi-information</v-icon>
            Mandatory when any option is negated
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-icon>
          <v-icon v-if="value === 'all'" color="">mdi-check</v-icon>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item @click="value = 'any'" :disabled="isAnyOptionNegated">
        <v-list-item-icon>
          <v-icon :color="isAnyOptionNegated ? 'grey lighten-2' : ''">mdi-set-all</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title class="">
            Or
          </v-list-item-title>
          <v-list-item-subtitle>
            Match {{ count === 2 ? 'either' : 'any' }} option
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-icon>
          <v-icon v-if="value === 'any'" color="">mdi-check</v-icon>
        </v-list-item-icon>
      </v-list-item>

    </v-list>
  </v-menu>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {getFacetConfig} from "@/facetConfigs";

export default {
  name: "Template",
  components: {},
  props: {
    filterKey: String,
    icon: Boolean,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
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
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>