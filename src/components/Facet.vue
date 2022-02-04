<template>

  <!--  <v-list-item>-->
  <v-list-group>
    <template v-slot:activator>
      <v-list-item-title>
        <strong>{{ displayName }}</strong> ({{ facetKey }})
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

</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';

import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {facetConfigs} from "../facetConfigs";
import {createFilterId} from "../views/filterConfigs";

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
      apiResp: {},
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "sortOptions",
    ]),
    displayName() {
      return facetConfigs().find(c => c.key === this.facetKey).displayName
    },
    tableItems() {
      return this.$store.state.filtersList
          .filter(f => {
            return f.key === this.facetKey
          })
          // .slice(0, 5)
          .map(group => { // work with a copy
            return group
          })
    },
    tableHeaders() {
      return [
        {sortable: false, value: "displayName",},
        {sortable: false, value: "count",},
      ]
    },
    selected: {
      get() {
        return this.$store.state.filtersList
            .filter(f => {
              return f.isApplied && f.key === this.facetKey
            })
      },
      set(selectedFilters) {
        // selectedFilters = selectedFilters.map(f => createFilter(f))
        const add = selectedFilters.map(f => createFilterId(f.key, f.value))
        const remove = this.tableItems
            .map(f => f.id)
            .filter(id => !add.includes(id))
        this.$store.dispatch("setAppliedFilters", {add, remove})


        // const updatedFilters = this.tableItems.forEach(filter => {
        //
        //   // is this filter in the list of selected filters?
        //   // if so, set its filter.isApplied = true; if not, filter.isApplied = false
        //   const isApplied = selectedFilters.some(f => {
        //     return f.id === filter.id
        //   })
        //   filter.isApplied = isApplied
        //
        //   // return the filter with its isApplied property showing whether you selected it or not.
        //   return filter
        // })
        // this.$store.dispatch("setFiltersIsApplied", updatedFilters)

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
    apiUrl() {
      return `/${this.entityType}/${this.entityId}`
    },
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([
      "updateTextSearch",
    ]),
    getFilterValue(k) {

    }
  },

  created() {
  },
  async mounted() {

  },
  watch: {}
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