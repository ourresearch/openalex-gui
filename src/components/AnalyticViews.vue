<template>
  <v-card rounded flat color="transparent">
    <v-toolbar dense flat color="transparent" class="">
      <!--      <v-icon left>mdi-clipboard-outline</v-icon>-->
      <v-toolbar-title class="font-weight-bold">Stats</v-toolbar-title>
      <v-spacer/>
      <Action v-if="entityType === 'works'" class="ml-2" action="group_by"/>
      <v-btn icon :href="csvUrl">
        <v-icon>mdi-tray-arrow-down</v-icon>
      </v-btn>
      <v-menu offset-y v-if="0">
        <template v-slot:activator="{on}">
          <v-btn icon v-on="on">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="url.setGroupBy(undefined)">
            <span>
              <v-icon>mdi-restore</v-icon>
            </span>
            
              <v-list-item-title>Restore report defaults</v-list-item-title>
            
          </v-list-item>

          <v-divider/>
          <v-list-item :href="csvUrl">
            <span>
              <v-icon>mdi-tray-arrow-down</v-icon>
            </span>
            
              <v-list-item-title>Export all</v-list-item-title>
            
            <small>.csv</small>
          </v-list-item>
          <v-list-item :href="apiUrl" target="_blank">
            <span>
              <v-icon>mdi-api</v-icon>
            </span>
            
              <v-list-item-title>View in API</v-list-item-title>
            
            <small>.json</small>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-toolbar>
    <v-container class="pt-0">

      <v-row v-if="resultsObject?.meta?.count" dense class="">
        <v-col
            v-for="(key, i) in groupByKeys"
            :key="key"
            class="d-flex flex-column"
        >
          <template v-if="i === 0">
            <v-card flat rounded class="white pa-3 mb-3">
              <serp-results-count :results-object="resultsObject" class="text-h5"/>
            </v-card>
          </template>

          <v-card flat rounded v-if="key === 'apc_sum'">
            <v-toolbar flat>
              <v-icon left>mdi-currency-usd</v-icon>
              <v-toolbar-title>APC sums</v-toolbar-title>
              <v-spacer/>
              <v-btn icon @click="url.toggleGroupBy('apc_sum')">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-toolbar>
            <v-divider/>
            <div class="ma-4">
              <div class="text-h5">
                <span class="font-weight-bold mr-2">${{ resultsObject?.meta?.apc_paid_sum_usd | toPrecision }}</span>
              </div>
              <div class="text-body-2">Sum APCs paid (est)</div>
              <div class="mt-3">
                <span class="font-weight-bold mr-2">${{ resultsObject?.meta?.apc_list_sum_usd | toPrecision }}</span>
              </div>
              <div class="text-body-2">Sum APCs list (est)</div>
            </div>
          </v-card>

          <v-card flat rounded v-else-if="key === 'cited_by_count_sum'" class="d-flex align-baseline pa-2">
            <v-icon left>mdi-format-quote-close</v-icon>
            <span class="text-h5 mr-2">{{ resultsObject?.meta?.cited_by_count_sum | toPrecision }}</span>
            <div class="align-self-baseline ">citations</div>
            <v-spacer/>
            <v-btn icon @click="url.toggleGroupBy('cited_by_count_sum')">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card>

          <group-by
              v-else
              :filter-key="key"
              :entity-type="entityType"
          />

        </v-col>

      </v-row>
      <v-card v-else flat rounded class="grey--text mt-2 pa-4 color-3">
        There are no results to analyze.
      </v-card>

    </v-container>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import GroupBy from "@/components/GroupBy/GroupBy.vue";
import Action from "@/components/Action/Action.vue";
import {url} from "@/url";
import {filtersFromUrlStr} from "@/filterConfigs";
import SerpResultsCount from "@/components/SerpResultsCount.vue";

export default {
  name: "Template",
  components: {
    SerpResultsCount,
    GroupBy,
    Action,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      foo: 42,
      url,
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    groupByKeys() {
      const ret = url.getGroupBy(this.$route)
      ret.sort((a, b) => {
        return (['apc_sum', 'cited_by_count_sum'].includes(a)) ? -1 : 1
      });
      return ret
    },
    hideResults: {
      get() {
        return this.$route.query.hide_results
      },
      set(to) {
        url.setHideResults(to)
      }
    },
    apiUrl() {
      const myFilters = filtersFromUrlStr(this.entityType, this.$route.query.filter)
      return url.makeGroupByUrl(
          this.entityType,
          this.groupByKeys.join(","),
          {
            filters: myFilters,
            isMultipleGroups: true
          }
      )
    },
    csvUrl() {
      const myFilters = filtersFromUrlStr(this.entityType, this.$route.query.filter)
      return url.makeGroupByUrl(
          this.entityType,
          this.groupByKeys.join(","),
          {
            filters: myFilters,
            isMultipleGroups: true,
            formatCsv: true,
          }
      )
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
