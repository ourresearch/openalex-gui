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
    ></v-data-table>
  </v-list-group>

</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';

import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {facetConfigs} from "../facetConfigs";

export default {
  name: "Facet",
  metaInfo() {
    return {
      title: `${this.entityId}`
    }
  },
  components: {
  },
  props: {
    facetKey: String,
  },
  data() {
    return {
      loading: false,
      apiResp: {},
      selected: []
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "sortOptions",
    ]),
    displayName(){
      return facetConfigs().find(c => c.key === this.facetKey).displayName
    },
    tableItems() {
      return this.$store.state.filtersList
          .filter(f => {
            return f.key === this.facetKey
          })
          .slice(0, 5)
          .map(group => {
            return group
          })
    },
    tableHeaders() {
      return [
        {sortable: false, value: "displayName",},
        {sortable: false, value: "count",},
      ]
    },
    page: {
      get() {
        return this.$store.state.page
      },
      set(val) {
        this.$store.dispatch("setPage", val)
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
      &:nth-child(2){
        padding-left: 3px;
      }
    }

  }
}


</style>