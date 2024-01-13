<template>
  <v-card class="factoid-card" flat rounded :loading="isLoading" style="width: 100%;">
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
          <v-list-item :href="url.makeApiUrl($route, true, selected)">
            <v-list-item-icon>
              <v-icon>mdi-tray-arrow-down</v-icon>
            </v-list-item-icon>
            Export
          </v-list-item>
          <v-list-item :href="url.makeApiUrl($route, false)" target="_blank">
            <v-list-item-icon>
              <v-icon>mdi-api</v-icon>
            </v-list-item-icon>
            View in API
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn small icon @click="url.toggleGroupBy(selected)">
        <v-icon small>mdi-close</v-icon>
      </v-btn>

    </v-toolbar>
    <v-divider/>
    <div v-if="filterKey==='publication_year'" style="min-width: 200px">
      <template v-if="groups">
        <bar-graph
            v-if="groups.length > 1"
            :bars="groups?.map(g => { return {key: g.value, count: g.count}})"
            style="height: 100px;"
            class="pa-2"
            @click="selectGroup"
        />
        <div v-else class="text-h4 pa-3">
          {{ groups[0].value }}
        </div>
      </template>
    </div>

    <table v-else class="serp-results-table " style="width: 100%;">
      <!--        <thead>-->
      <!--        <tr>-->
      <!--          <th class="py-2">-->
      <!--            {{ selectedConfig.displayName }}-->
      <!--          </th>-->
      <!--          <th class="pa-2">Works count</th>-->
      <!--          <th></th>-->

      <!--        </tr>-->
      <!--        </thead>-->
      <tbody>
      <tr
          v-for="group in groups"
          :key="group.value"
          @click="selectGroup(group.value)"
      >
        <td class="body-2">
          {{ group.displayValue }}
        </td>
        <td class="range body-2">
          {{ group.count | toPrecision }}
        </td>
        <!--          <td>-->
        <!--            <div style="height: 40px; width: 500px">-->
        <!--              <div class="d-flex flex-row-reverse" style="background: #eee; height: 100%;  min-width: 50px;">-->
        <!--                <v-spacer/>-->
        <!--                <div class="d-flex"-->
        <!--                     :style="`background: #999; height: 100%; width: ${group.countScaled * 100}%;`"></div>-->
        <!--              </div>-->

        <!--            </div>-->
        <!--          </td>-->

      </tr>
      <!--        <results-table-row-->
      <!--            v-for="result in resultsObject.results"-->
      <!--            :key="result.id"-->
      <!--            :entity="result"-->
      <!--        />-->

      </tbody>
    </table>
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

export default {
  name: "GroupBy",
  components: {
    Template,
    ActionMenuItem,
    BarGraph,

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

    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
      "resultsCount",
    ]),
    // selected: {
    //   get() {
    //     return this.$route.query.group_by
    //   },
    //   set(to) {
    //     const query = {
    //       ...this.$route.query,
    //       group_by: to
    //     }
    //     url.pushToRoute(this.$router, {
    //       name: "Serp",
    //       query
    //     })
    //   }
    // },
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
    }
  },
  asyncComputed: {
    async groups() {
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


      this.isLoading = false
      const maxResults = (this.myFilterConfig.type === "range") ?
          25 :
          5
      return ret.slice(0, maxResults)
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
      "setApiDialogUrl",
    ]),
    ...mapActions([]),
    selectGroup(val) {
      if (this.myFilterConfig.type === "boolean") {
        url.upsertFilter(this.entityType, this.filterKey, val != 0)
      } else if (this.myFilterConfig.type === "range") {
        url.upsertFilter(this.entityType, this.filterKey, val)
      } else {
        if (url.isFilterApplied(this.entityType, this.filterKey)) {
          url.addFilterOption(this.entityType, this.filterKey, val)
        }
        else {
          url.upsertFilter(this.entityType, this.filterKey, val)
        }
      }
    },


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