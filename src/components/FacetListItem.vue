<template>

  <!--  <v-list-item>-->
  <v-list-group>
    <template v-slot:activator>
      <v-list-item-title>
        <strong>{{ dimensionDisplayName }}</strong> ({{ dimensionKey }})
      </v-list-item-title>
    </template>
    <v-data-table
        :headers="tableHeaders"
        :items="tableItems"
        hide-default-footer
        hide-default-header
        show-select
        class="facet-values-table"
    >

    </v-data-table>
    <!--    <facet-value-list-item-->
    <!--        v-for="group in groups.slice(0, 2)"-->
    <!--        :key="group.key"-->
    <!--    ></facet-value-list-item>-->
  </v-list-group>

  <!--      <div>-->
  <!--        <strong>{{ dimensionDisplayName }}</strong> ({{ dimensionKey }})-->
  <!--      </div>-->
  <!--      <pre>{{groups.slice(0, 2)}}</pre>-->
  <!--      </v-list-item>-->

</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';

import {mapGetters, mapMutations, mapActions,} from 'vuex'

import FacetValueListItem from "./FacetValueListItem";


export default {
  name: "FacetListItem",
  metaInfo() {
    return {
      title: `${this.entityId}`
    }
  },
  components: {
    FacetValueListItem,
  },
  props: {
    dimensionKey: String,
    dimensionDisplayName: String,
    groups: Array,
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
    tableItems() {
      return this.groups
          .slice(0, 5)
          .map(group => {
            return group
          })
    },
    tableHeaders() {
      return [
        {sortable: false, value: "key",},
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
    this.loading = true
    // this.apiResp = await api.get(this.apiUrl)
    this.loading = false

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