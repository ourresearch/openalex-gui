<template>

  <!--  <v-list-item>-->
  <v-list>
    <v-list-group value="true">
      <template v-slot:activator>
        <v-list-item-title>
          <strong>{{ displayName }}</strong>
          <!--        <span class="ml-3 caption grey&#45;&#45;text" style="font-family: monospace !important;">{{ facetKey }}</span>-->
        </v-list-item-title>
      </template>
      <v-data-table
          :headers="tableHeaders"
          :items="tableItems"
          hide-default-footer
          hide-default-header
          show-select
          item-key="value"
          v-model="selected"
          class="facet-values-table"
          dense
      ></v-data-table>
    </v-list-group>

  </v-list>

</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';

import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {facetConfigs} from "../facetConfigs";
import {filtersAsUrlStr, createDisplayFilter} from "../filterConfigs";
import {makeFacet} from "../facetConfigs";

import {api} from "../api";

export default {
  name: "Facet",
  metaInfo() {
    return {
      title: `${this.entityId}`
    }
  },
  components: {},
  props: {
    facetKey: String,
  },
  data() {
    return {
      loading: false,
      facet: null,
      unselctedFilters: [],
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "sortOptions",
      "appliedFilters",
      "filtersAsString",
    ]),
    displayName() {
      return facetConfigs().find(c => c.key === this.facetKey).displayName
    },
    tableItems() {
      return this.unselctedFilters
          .slice(0, 5)
          .map(group => { // work with a copy
            return group
          })
    },
    tableHeaders() {
      return [
        {sortable: false, value: "displayValue",},
        {sortable: false, value: "count", align: "end"},
      ]
    },
    selected: {
      get() {
        return this.$store.state.inputFilters
            .filter(f => {
              return f.key === this.facetKey
            })
      },
      set(selectedRows) {
        console.log(`Facet "${this.facetKey}": set selectedRows`, selectedRows)
        const filtersToAdd = selectedRows
        const filterIdsToRemoveFirst = this.tableItems.map(f => f.asStr) // all of them for this facet
        this.$store.dispatch("setAppliedFilters", {filtersToAdd, filterIdsToRemoveFirst})
      }
    },
    sort: {
      get() {
        return this.$store.getters.sortObject
      },
      set(val) {
        this.$store.dispatch("setSort", val)
      }
    },
    entityType() {
      return this.$route.params.entityType
    },
    entityId() {
      return this.$route.params.id
    },
    apiQuery() {
      console.log("facet apiquery", this.$store.getters.filtersForUrl)
      return {
        group_by: this.facetKey,
        filter: filtersAsUrlStr(this.$store.getters.filtersForUrl, this.facetKey)
      }
    },
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([
      "updateTextSearch",
    ]),
    async setFilterValues() {
      const resp = await api.get(
          this.$store.state.entityType,
          this.apiQuery,
      )
      console.log("got filterValues back", resp)
      this.unselctedFilters = resp.group_by.map(group => {
        return createDisplayFilter(
            this.facetKey,
            group.key,
            group.key_display_name,
            group.count
        )
      })
    }
  },

  created() {
  },
  async mounted() {

  },
  watch: {
    "filtersAsString": {
      immediate: true,
      handler(newVal, oldVal) {
        console.log("$store.state.appliedFilterObjects changed", this.facetKey, newVal)
        this.setFilterValues()
      },
    }
  }
}
</script>

<style lang="scss">
.v-data-table > .v-data-table__wrapper > table {
  tr {
    td {
      &:first-child {
        padding: 0 0 0 10px;
      }

      &:nth-child(2) {
        padding-left: 3px;
      }
    }

  }
}


</style>