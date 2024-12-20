<!--- Drafted by ChatGPT, don't trust it -->

<template>
  <v-card flat rounded style="margin-top: 28px !important">
    <div v-html="topText" class="query-section-label"/>

    <!-- Filter Chips Display -->
    <div class="d-flex flex-wrap mb-2">
      <!-- Applied Filters -->
      <div v-for="(filter, index) in appliedFilters" :key="'applied' + index" class="mr-2 mb-2">
        <v-chip
          color="blue"
          outlined
        >
          {{ columnConfig(filter.column_id).displayName }}: {{ getFilterValue(filter) }}
          <v-icon @click="removeFilter(filter)" small class="ml-1">mdi-close-circle</v-icon>
        </v-chip>
      </div>

      <!-- Available Filters -->
      <div v-for="(filter, index) in availableFilters" :key="index" class="mr-2 mb-2">
        <v-chip
          outlined
          @click="openFilterMenu(filter)"
        >
          {{ filter.displayName }}
          <v-icon small class="ml-1">mdi-menu-down</v-icon>
        </v-chip>
      </div>
    </div>

    <!-- Filter Menu -->
    <v-menu
      v-model="isMenuOpen"
      offset-y
      v-if="currentFilter"
    >
      <template v-slot:activator="{ on }">
        <v-btn v-on="on" style="display: none;"></v-btn>
      </template>
      <v-card flat rounded>
        <query-filter-tree-leaf
          :filter="currentFilter"
          :subject-entity="subjectEntity"
          @setValue="applyFilterValue"
        />
      </v-card>
    </v-menu>
  </v-card>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { getConfigs } from "@/oaxConfigs";
import QueryFilterTreeLeaf from "@/components/Query/QueryFilterTreeLeaf.vue";

export default {
  name: "QueryFilterChips",
  components: {
    QueryFilterTreeLeaf
  },
  props: {
    subjectEntity: String,
    filters: Array,
    isWithAggs: Boolean
  },
  data() {
    return {
      openNodes: [],
      appliedFilters: [],
      availableFilters: [],
      isMenuOpen: false,
      currentFilter: null
    };
  },
  computed: {
    ...mapGetters("search", ["query"]),
    topText() {
      if (this.isWithAggs && !this.isEmpty) {
        return "Based on <b>works</b> where";
      } else if (this.isWithAggs && this.isEmpty) {
        return "Based on <b>all works</b>";
      } else {
        return ""
      }
    },
    isEmpty() {
      return this.appliedFilters.length === 0;
    },
  },
  methods: {
    ...mapActions("search", ["createSearch"]),
    openFilterMenu(filter) {
      this.currentFilter = filter;
      this.isMenuOpen = true;
    },
    applyFilterValue(value) {
      this.appliedFilters.push({
        ...this.currentFilter,
        value
      });
      this.isMenuOpen = false;
      this.applyFilters();
    },
    removeFilter(filter) {
      const index = this.appliedFilters.indexOf(filter);
      if (index > -1) {
        this.appliedFilters.splice(index, 1);
        this.applyFilters();
      }
    },
    getFilterValue(filter) {
      return filter.value !== undefined ? filter.value : "Not Set";
    },
    applyFilters() {
      const filtersToStore = this.appliedFilters.map(filter => ({
        column_id: filter.column_id,
        value: filter.value
      }));
      if (this.subjectEntity === "works") {
        this.$store.state.search.query.filter_works = filtersToStore;
      } else {
        this.$store.state.search.query.filter_aggs = filtersToStore;
      }
      this.createSearch();
    },
    columnConfig(column_id) {
      const mySubjectEntity = this.subjectEntity
      const mySubjectEntityConfig = getConfigs()[mySubjectEntity]
      const columnConfig = mySubjectEntityConfig.columns[column_id]
      return columnConfig
    },
  },
  mounted() {
  },
  watch: {
    "filters": {
      handler: function(newFilters) {
        // TODO check `actions` prop to only grab intended filters

        const availableColumns = getConfigs()[this.subjectEntity].columns;
        this.availableFilters = Object.values(availableColumns).map(column => ({
          displayName: column.displayName,
          column_id: column.id
        }));

        // Add the applied filters to be shown first
        this.appliedFilters = newFilters.map(filter => ({
          displayName: filter.displayName,
          column_id: filter.column_id,
          value: filter.value
        }));

        //console.log(this.subjectEntity + " availableFilters")
        //console.log(this.availableFilters)
        //console.log("newFilters")
        //console.log(newFilters)
        //console.log("appliedFilters")
        //console.log(this.appliedFilters)
      },
      immediate: true,
    }
  }
};
</script>


<style scoped>
.query-section-label {
  font-size: 16px;
}

.v-chip {
  cursor: pointer;
}

.v-chip .mdi-close-circle {
  cursor: pointer;
}
</style>
