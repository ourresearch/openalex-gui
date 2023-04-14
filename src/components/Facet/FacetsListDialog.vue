<template>
  <div>
    <v-dialog
            v-model="isOpen"
            scrollable
            fullscreen
    >
      <!--      $vuetify.breakpoint.mobile-->
      <v-card tile color="#fafafa">
        <v-toolbar
                class="flex-grow-0"
                color="green"
                dark
                flat
                height="60"
        >
          <v-btn
                  text
                  @click="setFacetZoom(null)"
                  class="text-capitalize text-h6 pl-0"
                  v-if="!!facetZoom"
          >
            <v-icon class="pr-1">mdi-arrow-left</v-icon>
            Filters
          </v-btn>
          <v-btn
                  text
                  @click="closeFacetsDialog"
                  class="text-capitalize pl-0"
                  v-else
          >
            <v-icon class="pr-1">mdi-arrow-left</v-icon>
            Back
          </v-btn>


          <v-spacer/>
          <v-text-field
                  v-if="!facetZoom"
                  flat
                  outlined
                  rounded
                  hide-details
                  clearable
                  style="max-width: 400px;"
                  prepend-inner-icon="mdi-magnify"
                  autofocus
                  dense
                  light
                  background-color="white"

                  v-model="searchString"
                  placeholder="Search filters"
          />
          <v-btn
                  icon
                  @click="$store.state.facetsListDialogIsOpen = false"
          >
            <v-icon icon>mdi-close</v-icon>
          </v-btn>



        </v-toolbar>


        <v-card-text style="height: calc(100vh - 60px)" class="pa-0 flex-grow-1">
          <v-container v-if="!facetZoom" class="">
            <div class="d-flex mt-12">
              <v-icon large>mdi-filter-outline</v-icon>
              <div class="text-h4  black--text">Filter results by:</div>

            </div>
            <v-divider />
          </v-container>

          <v-container v-if="!facetZoom" class="pa-0">
            <v-row

                    class="pt-0 mt-3 px-4 align-start"
                    no-gutters
            >
              <v-col
                      cols="12"
                      sm="6"
                      md="3"
                      v-for="facetCategory in facetsByCategory"
                      :key="'card' + facetCategory.name"


              >
                <v-card class="mx-1 my-2">
                  <v-subheader class="text-capitalize">
                    {{ facetCategory.name }}

                  </v-subheader>
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
          </v-container>

          <facet-zoom
                  v-if="facetZoom"
          />


        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetCategories, facetConfigs, getFacetConfig} from "@/facetConfigs";
import FacetSimple from "./FacetSimple.vue";
import FacetZoom from "./FacetZoom.vue";

import {filtersAsUrlStr} from "../../filterConfigs";
import {url} from "../../url";
import facetZoom from "./FacetZoom.vue";
import facet from "./Facet.vue";

export default {
    name: "FacetsListDialog",
    components: {
        FacetSimple,
        FacetZoom,
    },
    props: {},
    data() {
        return {
            searchString: "",
            facetZoomSearchString: "",
            selectedFilters: [],
            dialogs: {
                facetsDrawer: false,
            }
        }
    },
    computed: {
        facet() {
            return facet
        },
        facetZoom() {
            return facetZoom
        },
        ...mapGetters([
            "resultsFilters",
            "entityType",
            "searchFacetConfigs",
            "filtersZoom",
            "facetZoom",

        ]),
        isOpen: {
            get() {
                return !!this.$store.state.facetsListDialogIsOpen
            },
            set(val) {
                if (val) {
                    this.openFacetsDialog()
                } else {
                    this.closeFacetsDialog()
                }
            },
        },
        searchPlaceholderText() {
            if (this.selectedFacetConfig) {
                if (this.selectedFacetConfig.valuesToShow !== "mostCommon") return ""

                const thingToSearch = this.$pluralize(this.selectedFacetConfig.displayName, 2);
                return `Search ${thingToSearch}`
            } else {
                return "Search filter types"
            }
        },

        facetsByCategory() {
            return facetCategories[this.entityType].map(categoryName => {
                return {
                    name: categoryName,
                    facets: this.searchStringResults.filter(f => {
                        return f.category === categoryName
                    })
                }
            })
                .filter(categoryObj => {
                    return categoryObj.facets.length > 0
                })
        },


        searchStringResults() {
            const ret = this.searchFacetConfigs
                .filter(c => {
                    return c.displayName.toLowerCase().match(this.searchString?.toLowerCase())
                })
                .filter(c => {
                    const filters = this.resultsFilters.filter(f => f.key === c.key)
                    // hide the noOptions facets unless they have selected filters
                    return !c.noOptions || filters.length
                })

            ret.sort((a, b) => {
                if (a.sortToTop) return -1
                return (a.displayName > b.displayName) ? 1 : -1
            })


            return ret
        },
        selectedFacetConfig() {
            if (!this.facetZoom) return
            return getFacetConfig(this.entityType, this.facetZoom)
        },
        myResultsFilters() {
            if (!this.facetZoom) return this.resultsFilters
            return this.resultsFilters.filter(f => f.key === this.facetZoom);
        }


    },

    methods: {
        ...mapMutations([
            "snackbar",
            "setFiltersZoom",
            "setFacetZoom",
            "openFacetsDialog",
            "closeFacetsDialog",
        ]),
        ...mapActions([]),

    },
    created() {
    },
    mounted() {
    },
    watch: {
        facetZoom(to, from) {
            this.searchString = ""
        }
    }
}
</script>

<style scoped lang="scss">

</style>