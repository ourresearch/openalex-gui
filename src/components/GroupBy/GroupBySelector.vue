<template>
  <v-menu
      :close-on-content-click="false"
      min-width="400"
      v-model="isMenuOpen"
  >
    <template v-slot:activator="{on}">
      <v-btn
          v-on="on"
          rounded
          text
      >
        <v-icon left>mdi-layers-triple-outline</v-icon>
        Group by
        <v-icon right>mdi-menu-down</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-text-field
          autofocus
          hide-details
          rounded
          class="pb-3 ma-0"
          prepend-inner-icon="mdi-magnify"
          clearable
          v-model="searchString"
      />
      <v-divider/>
      <v-list max-height="50vh" class="overflow-y-auto">
        <keep-alive>

        <v-list-item-group v-model="groupByKey" :key="searchString">
          <template
              v-for="category in facetsByCategory"
          >
            <v-subheader :key="category.displayName + 'subheader'">{{ category.displayName }}</v-subheader>
            <v-list-item
                v-for="filterConfig in category.filterConfigs"
                :key="category.displayName + filterConfig.key"
                :value="filterConfig.key"
            >
              <v-list-item-icon>
                <v-icon>{{filterConfig.icon}}</v-icon>
              </v-list-item-icon>
              {{ filterConfig.displayName }}

            </v-list-item>


          </template>

        </v-list-item-group>
        </keep-alive>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import FilterKeySelector from "../Filters/FilterKeySelector.vue";
import {url} from "../../url";
import {facetsByCategory} from "../../facetConfigs";
import {filter} from "core-js/internals/array-iteration";

export default {
  name: "Template",
  components: {
    FilterKeySelector
  },
  props: {},
  data() {
    return {
      foo: 42,
      searchString: "",
      isMenuOpen: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    facetsByCategory() {
      return facetsByCategory(
          this.entityType,
          this.searchString,
      )
    },
    groupByKey: {
      get() {
        return this.$route.query.group_by
      },
      set(to) {
        this.isMenuOpen = false
        this.searchString = ""
        url.pushToRoute(this.$router, {
          name: "Serp",
          query: {
            ...this.$route.query,
            group_by: to
          }
        })
      }
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


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