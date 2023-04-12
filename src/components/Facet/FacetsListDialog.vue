<template>
  <div>

    <v-dialog
        v-model="$store.state.facetsListDialogIsOpen"
        scrollable
        max-width="1100px"
        :fullscreen="$vuetify.breakpoint.mobile"
    >
      <v-card>
        <v-toolbar flat class="" extended color="green" dark>
          <v-toolbar-title>
            title dude
<!--            <v-btn-->
<!--                text-->
<!--                v-if="!selectedFacetConfig"-->
<!--                @click="setFiltersZoom(true)"-->
<!--                class="text-capitalize text-h5 px-0"-->
<!--            >-->
<!--              <v-icon class="pr-1">mdi-filter-outline</v-icon>-->
<!--              Filters-->
<!--            </v-btn>-->



<!--            <span v-if="selectedFacetConfig" class="text-h5  font-weight-bold">-->
<!--              <v-icon>{{ selectedFacetConfig.icon }}</v-icon>-->
<!--              {{ selectedFacetConfig.displayName }}-->
<!--            </span>-->

          </v-toolbar-title>
          <v-spacer/>



<!--          <v-btn icon @click="$store.state.facetsListDialogIsOpen = false">-->
<!--            <v-icon icon>mdi-close</v-icon>-->
<!--          </v-btn>-->

<!--          <template v-slot:extension>-->
<!--            <v-text-field-->
<!--                flat-->
<!--                outlined-->
<!--                rounded-->
<!--                hide-details-->
<!--                full-width-->
<!--                clearable-->
<!--                prepend-inner-icon="mdi-magnify"-->
<!--                autofocus-->
<!--                dense-->
<!--                light-->
<!--                background-color="white"-->

<!--                v-model="searchString"-->
<!--                :disabled="!searchPlaceholderText"-->
<!--                :placeholder="searchPlaceholderText"-->
<!--            />-->


<!--          </template>-->


        </v-toolbar>
        <v-divider class=""/>
        <v-card-text style="height: 70vh;" class="pa-0">
          <v-row
              v-if="filtersZoom && !selectedFacetKey"
              class="pt-0 mt-3 px-4"
              expand
              nav
          >
            <v-col
                cols="12"
                sm="6"
                md="3"
                v-for="facetCategory in facetsByCategory"
                :key="'card' + facetCategory.name"
            >
              <v-card outlined>
                <v-card-title class="text-capitalize pb-0">
                  {{ facetCategory.name }}

                </v-card-title>
                <v-list>
                  <facet-simple
                      v-for="facet in facetCategory.facets"
                      :key="facet.entityType + facet.key"
                      :facet-key="facet.key"
                      :facet-entity-type="entityType"
                  />
                </v-list>

              </v-card>

              <!--              <template>-->
              <!--                <v-subheader-->
              <!--                    :key="'subheader' + facetCategory.name"-->
              <!--                    class="align-end text-capitalize pl-0"-->
              <!--                >-->
              <!--                  {{ facetCategory.name }}-->
              <!--                </v-subheader>-->
              <!--                &lt;!&ndash;                <v-divider :key="'divider' + facetCategory.name"></v-divider>&ndash;&gt;-->
              <!--              </template>-->

            </v-col>
          </v-row>

          <facet-zoom
              v-if="selectedFacetKey"
              :facet-key="selectedFacetKey"
              :api-url="makeApiUrl(50)"
              :search-string="searchString"
          />


        </v-card-text>
        <v-card-actions v-if="selectedFacetConfig">
          <v-btn rounded  outlined class="low-key-button" @click="setFiltersZoom(true)">
            <v-icon>mdi-arrow-left</v-icon>
            Filters menu
          </v-btn>
          <v-spacer />
          <v-menu v-if="selectedFacetConfig">
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on" class="mr-1">
                <v-icon>mdi-tray-arrow-down</v-icon>
              </v-btn>
            </template>
            <v-list dense>
              <v-subheader>
                Export as:
                <!--                {{ config.displayName | pluralize(2) }} as:-->
              </v-subheader>
              <v-divider></v-divider>
              <v-list-item
                  target="_blank"
                  :href="makeApiUrl(200, true)"
              >
                <v-list-item-icon>
                  <v-icon>mdi-table</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  Spreadsheet
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                  target="_blank"
                  :href="makeApiUrl(200)"
              >
                <v-list-item-icon>
                  <v-icon>mdi-api</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  JSON object
                </v-list-item-title>
              </v-list-item>

            </v-list>
          </v-menu>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "FacetsListDialog",
  components: {
  },
  props: {},
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    isOpen: {
      get() {
        if (!this.$vuetify.breakpoint.mobile) return true
        return this.$store.state.showFiltersDrawer
      },
      set(val) {
        if (!this.$vuetify.breakpoint.mobile) return // you can't falsify isOpen on desktop
        this.$store.state.showFiltersDrawer = val
      },
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
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">

</style>