<template>
  <v-card flat tile class="">
    <div class="my-1 mx-3 d-flex">
<!--      <action-menu-item action="group_by" />-->
      <v-btn
          text
          rounded
          :href="url.makeApiUrl($route, true)"
      >
        Export
      </v-btn>
    </div>


    <!--    <v-toolbar flat>-->
    <!--      <v-text-field-->
    <!--          autofocus-->
    <!--          hide-details-->
    <!--          rounded-->
    <!--          class=" ma-0"-->
    <!--          prepend-icon="mdi-magnify"-->
    <!--          clearable-->
    <!--          v-model="searchString"-->
    <!--      />-->
    <!--    </v-toolbar>-->
    <table v-if="0 && resultsCount" class="serp-results-table">
      <thead>
      <tr>
        <th>
          {{ myFilterConfig.displayName }}

        </th>
        <th>Works count</th>
        <th></th>

      </tr>
      </thead>
      <tbody>
      <tr
          v-for="group in groups"
          :key="group.value"
          @click="url.createFilter(entityType, filterKey, group.value)"
      >
        <td>
          {{ group.displayValue }}
        </td>
        <td class="range">
          {{ group.count | toPrecision }}
        </td>
        <td>
          <div style="height: 40px; width: 500px">
          <div class="d-flex flex-row-reverse" style="background: #eee; height: 100%;  min-width: 50px;">
            <v-spacer/>
            <div class="d-flex" :style="`background: #999; height: 100%; width: ${group.countScaled * 100}%;`"></div>
          </div>

        </div>
        </td>

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
import {facetConfigs} from "@/facetConfigs";
import {filtersFromUrlStr} from "../../filterConfigs";
import ResultsTableHeader from "@/components/ResultsTable/ResultsTableHeader.vue";
import ResultsTableRow from "@/components/ResultsTable/ResultsTableRow.vue";
import ActionMenuItem from "@/components/Action/ActionMenuItem.vue";

export default {
  name: "GroupBy",
  components: {
    ActionMenuItem,
  },
  props: {},
  data() {
    return {
      url,
      foo: 42,
      isLoading: false,
      selectedValue: this.filterValue,
      searchString: "",
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
      "resultsCount",
    ]),
    myFilterConfig() {
      return facetConfigs(this.entityType).find(c => c.key === this.filterKey)
    },
    filterKey() {
      return this.$route.query.group_by
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
      console.log("groupBy groups,usin these filters", this.$route.query.filter)
      const ret = await api.getGroups(
          this.entityType,
          this.filterKey,
          {
            perPage: 200,
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
      return ret
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
      "setApiDialogUrl",
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