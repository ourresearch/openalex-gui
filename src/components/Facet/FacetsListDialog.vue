<template>
  <div>

    <v-dialog
            v-model="$store.state.facetsListDialogIsOpen"
            scrollable
            max-width="1100px"
            :fullscreen="$vuetify.breakpoint.mobile"
    >
      <v-card>
        <v-toolbar
                :extended="!facetZoom"
                class="flex-grow-0"
                color="green"
                dark
        >
          <v-btn
                  text
                  @click="setFacetZoom(null)"
                  class="text-capitalize text-h5 px-0"
          >
            <v-icon v-if="!!facetZoom" class="pr-1">mdi-arrow-left</v-icon>
            <v-icon v-else class="pr-1">mdi-filter-outline</v-icon>
            Filters
          </v-btn>
          <v-spacer/>
          <v-btn icon @click="$store.state.facetsListDialogIsOpen = false">
            <v-icon icon>mdi-close</v-icon>
          </v-btn>


          <!--            <span v-if="selectedFacetConfig" class="text-h5  font-weight-bold">-->
          <!--              <v-icon>{{ selectedFacetConfig.icon }}</v-icon>-->
          <!--              {{ selectedFacetConfig.displayName }}-->
          <!--            </span>-->

          <!--          <v-spacer/>-->


          <template v-if="!facetZoom" v-slot:extension>
            <v-text-field
                    flat
                    outlined
                    rounded
                    hide-details
                    full-width
                    clearable
                    prepend-inner-icon="mdi-magnify"
                    autofocus
                    dense
                    light
                    background-color="white"

                    v-model="searchString"
                    placeholder="Search filters"
            />
          </template>


        </v-toolbar>
        <v-divider class=""/>


        <v-card-text style="height: 70vh" class="pa-0 flex-grow-1">
          <v-row
                  v-if="!facetZoom"
                  class="pt-0 mt-3 px-4 align-start"
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

          <facet-zoom
                  v-if="facetZoom"
                  :facet-key="facetZoom"
                  :api-url="makeApiUrl(50)"
                  :search-string="searchString"
          />


        </v-card-text>
        <v-card-actions v-if="0 && selectedFacetConfig">
          <v-btn rounded outlined class="low-key-button" @click="setFiltersZoom(true)">
            <v-icon>mdi-arrow-left</v-icon>
            Filters menu
          </v-btn>
          <v-spacer/>
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
import {facetCategories, facetConfigs, getFacetConfig} from "@/facetConfigs";
import FacetSimple from "./FacetSimple.vue";
import FacetZoom from "./FacetZoom.vue";

import {filtersAsUrlStr} from "../../filterConfigs";
import {url} from "../../url";
import facetZoom from "./FacetZoom.vue";

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
            facetZoomSearchString:"",
            selectedFilters: [],
            dialogs: {
                facetsDrawer: false,
            }
        }
    },
    computed: {
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
        facetsDrawerIsOpen: {
            get() {
                return !!this.filtersZoom
            },
            set(val) {
                this.setFiltersZoom(val)
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
        ]),
        ...mapActions([]),
        makeApiUrl(perPage, formatCsv) {
            if (!perPage) perPage = this.maxApiFiltersToShow
            const url = new URL(`https://api.openalex.org`)
            url.pathname = `${this.entityType}`

            const filters = this.$store.state.inputFilters
            url.searchParams.set("filter", filtersAsUrlStr(filters, this.entityType))

            url.searchParams.set("group_by", this.selectedFacetConfig.key)
            url.searchParams.set("per_page", String(perPage))
            if (this.textSearch) url.searchParams.set("search", this.textSearch)
            if (this.searchString) url.searchParams.set("q", this.searchString)
            if (formatCsv) url.searchParams.set("format", "csv")
            url.searchParams.set("email", "team@ourresearch.org")
            return url.toString()
        },
        clear() {
            console.log("close!")
            const newFilters = (this.facetZoom) ?
                this.resultsFilters.filter(f => f.key !== this.facetZoom) :
                []
            url.setFilters(this.entityType, newFilters)

            const myFacetName = (this.selectedFacetConfig) ? this.selectedFacetConfig.displayName : ""
            this.snackbar(myFacetName + " filters cleared")

            this.facetsDrawerIsOpen = !!this.facetZoom
        }

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