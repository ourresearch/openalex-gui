<template>
  <div>
    <v-menu>
      <template v-slot:activator="{props}">
      <v-btn
          :close="!!groupByKey"
          class="rounded-lg"
          variant="text"
          v-bind="props"
          :color="groupByKey ? '#333' : '#000'"
          @click:close="groupByKey=undefined"
      >
        <span class="font-weight-regular">Group</span>
      </v-btn>
    </template>
    </v-menu>

    <v-dialog
        :close-on-content-click="false"
        min-width="400"
        v-model="isMenuOpen"
        :fullscreen="$vuetify.display.mobile"
        scrollable
    >

    <v-card>
      <v-toolbar flat>
        <v-toolbar-title>
          Group results by....
        </v-toolbar-title>
        <v-spacer/>
        <v-btn icon @click="isMenuOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <template v-slot:extension>
        <v-text-field
            autofocus
            hide-details
            rounded
            class="pb-3 ma-0"
            prepend-icon="mdi-magnify"
            v-model="searchString"
            placeholder="Search groupings"
        />

        </template>
      </v-toolbar>
      <v-divider/>
      <v-card-text class="px-0" style="flex-grow: 99999999;">

        <v-list>
          <keep-alive>

            <template v-for="category in facetsByCategory" :key="category.displayName">
              <v-list-subheader>{{ category.displayName }}</v-list-subheader>
              <v-list-item
                v-for="filterConfig in category.filterConfigs"
                :key="category.displayName + filterConfig.key"
                :active="groupByKey === filterConfig.key"
                @click="groupByKey = filterConfig.key"
                active-class="primary--text"
              >
                <v-icon>{{ filterConfig.icon }}</v-icon>
                {{ filterConfig.displayName }}
              </v-list-item>
            </template>
          </keep-alive>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "../../url";
import {facetsByCategory, getFacetConfig} from "../../facetConfigs";

export default {
  name: "GroupBySelector",
  components: {
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

      "entityType",
    ]),
    facetsByCategory() {
      return facetsByCategory(
          this.entityType,
          this.searchString,
          ["boolean", "select", "range"]
      )
    },
    menuFacets(){
      return this.facetsByCategory[0]
    },
    groupByKeyConfig() {
      if (!this.groupByKey) return
      return getFacetConfig(this.entityType, this.groupByKey)
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
            sort: undefined,
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