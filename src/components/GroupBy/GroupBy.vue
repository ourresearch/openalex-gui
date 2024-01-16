<template>
  <v-card
      min-height="100"
      :min-width="minWidth"
      class="factoid-card fill-height"
      flat
      rounded
      :loading="isLoading"
      style="width: 100%;"
  >
    <v-toolbar dense flat color="transparent">
      <v-icon left>{{ selectedConfig.icon }}</v-icon>
      <v-toolbar-title>
        <span class="">{{ selectedConfig.displayName }}</span>
      </v-toolbar-title>
      <v-spacer/>
      <v-menu rounded offset-y>
        <template v-slot:activator="{on}">
          <v-btn
              icon
              v-on="on"
              small
          >
            <v-icon small>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>

          <v-list-item :href="csvUrl">
            <v-list-item-icon>
              <v-icon>mdi-tray-arrow-down</v-icon>
            </v-list-item-icon>
            Export
          </v-list-item>
          <v-list-item :href="apiUrl" target="_blank">
            <v-list-item-icon>
              <v-icon>mdi-api</v-icon>
            </v-list-item-icon>
            View in API
          </v-list-item>
          <v-divider/>
          <v-list-item @click="url.toggleGroupBy(selected)">
            <v-list-item-icon>
              <v-icon color="">mdi-delete-outline</v-icon>
              <!--              <v-icon>mdi-close-circle-outline</v-icon>-->
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="">
                Remove
              </v-list-item-title>

            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

    </v-toolbar>
    <v-divider/>
    <div v-if="groups.length" class="card-body">

      <div v-if="filterKey==='publication_year'" style="min-width: 200px">
        <bar-graph
            v-if="groups.length > 1"
            :bars="groups?.map(g => { return {key: g.value, count: g.count}})"
            style="height: 100px;"
            class="pa-2"
            @click="selectGroup"
        />
        <div v-else class="text-h4 pa-3 hover-color-1" style="cursor: pointer;" @click="isSelected = false">
          <v-icon class="mr-2 ml-1">mdi-checkbox-marked</v-icon>
          {{ groups[0].value }}
        </div>
      </div>
      <div v-else-if="myFilterConfig.type === 'boolean'" class="">
        <v-card flat class="pa-2 d-flex color-2 hover-color-1" @click="isSelected = !isSelected">
          <v-icon class="mr-4 ml-2" color="">{{
              isSelected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'
            }}
          </v-icon>

          <v-progress-circular
              size="50"
              width="17"
              rotate="270"
              :value="groups?.find(g => g.value != 0).countScaled * 100"
          />
          <div class="ml-3">
            <div class="text-h4">
              {{ groups?.find(g => g.value != 0).countScaled * 100 | toPrecision(3) }}%
            </div>
            <div class="body-2">
              {{ groups?.find(g => g.value != 0).count | toPrecision }}
            </div>
          </div>

        </v-card>


      </div>

      <v-simple-table dense class="transparent" v-else style="width: 100%;">
        <tbody>
        <group-by-table-row
            v-for="group in groups"
            :key="group.value"
            :row="group"
            :filter-key="filterKey"
        />


        </tbody>
      </v-simple-table>
    </div>

    <v-card-actions v-if="isMoreToShow">
      <v-spacer/>
      <v-btn small rounded text @click="isDialogOpen = true">
        View more...
      </v-btn>

    </v-card-actions>

    <v-dialog
        v-model="isDialogOpen"
        :fullscreen="$vuetify.breakpoint.mobile"
        max-width="600"
        scrollable
    >
      <v-card :rounded="!$vuetify.breakpoint.mobile">
        <v-toolbar flat class="color-2">
          <v-btn icon @click="isDialogOpen = false">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>

          <v-toolbar-title>
            {{ allGroups.length === 200 ? "Top 200 " : "All " + allGroups.length }}
            {{ myFilterConfig.displayName | pluralize(2) }}
          </v-toolbar-title>
        </v-toolbar>
        <v-card-text class="body-1 pa-0">
          <v-simple-table
          >
            <!--              fixed-header-->
            <!--              :height="$vuetify.breakpoint.mobile ? 'calc(100vh - 100px)' : '75vh'"-->
            <thead class="">
            <tr class="">
                            <th class=""></th>
              <th class="">{{ myFilterConfig.displayName | capitalize }}</th>
              <th class="">Works count</th>

            </tr>
            </thead>
            <tbody @click="isDialogOpen = false">
            <group-by-table-row
                v-for="group in allGroups"
                :key="group.value"
                :row="group"
                :filter-key="filterKey"

            />
            </tbody>

          </v-simple-table>
        </v-card-text>
        <v-card-actions class="color-2">
          <v-spacer/>
          <v-btn text rounded :href="apiUrl" target="_blank">
            <v-icon left>mdi-api</v-icon>
            API
          </v-btn>
          <v-btn color="primary" rounded :href="csvUrl" @click="isDialogOpen = false">
            <v-icon left>mdi-tray-arrow-down</v-icon>
            Export
          </v-btn>

        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {url} from "../../url";
import {facetConfigs, getFacetConfig} from "@/facetConfigs";
import {filtersFromUrlStr} from "../../filterConfigs";
import ResultsTableHeader from "@/components/ResultsTable/ResultsTableHeader.vue";
import ResultsTableRow from "@/components/ResultsTable/ResultsTableRow.vue";
import ActionMenuItem from "@/components/Action/Action.vue";
import Template from "@/components/Action/Action.vue";
import {getActionConfig} from "@/actionConfigs";
import BarGraph from "@/components/BarGraph.vue";
import {all} from "core-js/internals/document-all";
import GroupByTableRow from "@/components/GroupBy/GroupByTableRow.vue";
import {filter} from "core-js/internals/array-iteration";

export default {
  name: "GroupBy",
  components: {
    Template,
    ActionMenuItem,
    BarGraph,
    GroupByTableRow,

  },
  props: {
    selected: String,

  },
  data() {
    return {
      url,
      foo: 42,
      isLoading: false,
      selectedValue: this.filterValue,
      searchString: "",
      isDialogOpen: false,
      allGroups: [],
      maxResults: 5,
      maxResultsRange: 25,


    }
  },
  computed: {
    all() {
      return all
    },
    ...mapGetters([
      "resultsFilters",
      "entityType",
      "resultsCount",
    ]),
    isSelected: {
      get() {
        return url.isFilterApplied(this.$route, this.entityType, this.filterKey)
      },
      set(to) {
        if (to) {
          url.upsertFilter(this.entityType, this.filterKey, true)
        } else {
          url.deleteFilter(this.entityType, this.filterKey)
        }
      }
    },
    isMoreToShow() {
      return this.allGroups.length > this.groups.length
    },
    minWidth() {
      return (this.myFilterConfig.type === "select") ?
          300 :
          150
    },
    selectedConfig() {
      if (!this.selected) return
      return getFacetConfig(this.entityType, this.selected)
    },
    options() {
      const topValues = getActionConfig("group_by").topValues
      const selectedValue = this.$route.query.group_by
      const allValues = [
        selectedValue,
        ...topValues,
      ].filter(x => !!x)
      return [...new Set(allValues)]

    },
    optionConfigs() {
      return this.options.map(k => {
        return getFacetConfig(this.entityType, k)
      })
    },

    myFilterConfig() {
      return facetConfigs(this.entityType).find(c => c.key === this.filterKey)
    },
    filterKey() {
      // return this.$route.query.group_by
      return this.selected
    },
    apiUrl() {
      return url.makeGroupByUrl(
          this.entityType,
          this.filterKey,
          {
            includeEmail: false,
          }
      )
    },
    csvUrl() {
      return url.makeGroupByUrl(
          this.entityType,
          this.filterKey,
          {
            includeEmail: false,
            formatCsv: true,
          }
      )
    },

    isGroupSelected(val) {
      if (this.myFilterConfig.type === "boolean") {
        return url.isFilterApplied(this.$route, this.entityType, this.filterKey)
      } else if (this.myFilterConfig.type === "range") {
        return url.isFilterApplied(this.$route, this.entityType, this.filterKey)
      }
    },
    groups() {
      const maxResults = (this.myFilterConfig.type === "range") ?
          this.maxResultsRange :
          this.maxResults
      return this.allGroups.slice(0, maxResults)
    }
  },

  methods: {
    filter,
    ...mapMutations([
      "snackbar",
      "setApiDialogUrl",
    ]),
    ...mapActions([]),
    isOptionSelected(val) {
      return url.isFilterOptionApplied(this.entityType, this.filterKey, val)

    },
    async getGroups() {
      if (!this.filterKey) return []
      this.isLoading = true
      const filters = filtersFromUrlStr(this.entityType, this.$route.query.filter)
      const ret = await api.getGroups(
          this.entityType,
          this.filterKey,
          {
            hideUnknown: true,
            filters,
            searchString: this.searchString
          }
      )
      if (this.filterKey === "publication_year") {
        console.log("group by year")
        ret.sort((a, b) => {
          return (a.value > b.value) ? -1 : 1
        })
      }


      this.allGroups = ret
      this.isLoading = false

    },
    unselectGroup(val) {
      if (this.myFilterConfig.type === "boolean") {
        url.deleteFilter(this.entityType, this.filterKey)
      } else if (this.myFilterConfig.type === "range") {
        url.deleteFilter(this.entityType, this.filterKey)
      }
    },

    selectGroup(val) {
      if (this.myFilterConfig.type === "boolean") {
        url.upsertFilter(this.entityType, this.filterKey, val != 0)
      } else if (this.myFilterConfig.type === "range") {
        url.upsertFilter(this.entityType, this.filterKey, val)
      } else {
        if (url.isFilterApplied(this.$route, this.entityType, this.filterKey)) {
          url.addFilterOption(this.entityType, this.filterKey, val)
        } else {
          url.upsertFilter(this.entityType, this.filterKey, val)
        }
      }
    },
  },

  watch: {
    "$route.query.filter": {
      immediate: true,
      handler(to, from) {
        this.getGroups()
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>