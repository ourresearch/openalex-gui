<template>
  <v-container class="analytics-home">
    <v-row>
    <v-col cols="0" />
    <v-col cols="12">
    <v-row class="">
      <div class="text-h3">
        Analytics
      </div>
      <new-query-button button-text="Start a Query" :goTo="true" color="primary"/>
    </v-row>
    <v-row>
      <div class="tagline text-h6">
        Query, aggregate, and download across our entire dataset.
      </div>
    </v-row>
    </v-col>
    </v-row>
    
    <v-row class="examples-header-line" />
    <v-row class="examples-header text-h6 d-flex align-center">
      <v-text-field
        v-model="searchQuery"
        label="Search Examples..."
        placeholder=""
        rounded
        outlined
        clearable
        prepend-inner-icon="mdi-magnify"
        class="search-field flex-grow-1"
        hide-details
        background-color="white"
      ></v-text-field>
      <v-select
        v-model="selectedFilter"
        :items="filterOptions"
        rounded
        outlined
        hide-details
        class="ml-4 filter-select"
        background-color="white"
      ></v-select>
    </v-row>

    <v-row class="example-questions">
      <v-col cols="12" md="6" lg="4" v-for="query in showQueries" :key="query.question">
        <example-query
          :question="query.question"
          :type="query.type"
          :category="query.category"
          :error="query.error"
          :url="query.url"
          :query="query.query"
        />
      </v-col>
    </v-row>
  </v-container>
</template>


<script>

import VueHorizontal from 'vue-horizontal';
import NewQueryButton from "@/components/Misc/NewQueryButton.vue";
import ExampleQuery from "@/components/Home/ExampleQuery.vue";
import {exampleQueries} from "./exampleQueriesList";

export default {
  name: "AnalyticsHome",
  components: {
    VueHorizontal,
    ExampleQuery,
    NewQueryButton,
  },
  props: {
  },
  data() {
    return {
      exampleQueries: exampleQueries,
      searchQuery: "",
      selectedFilter: "All Questions",
      typeFilter: null,
      categoryFilter: null,
      uiVariant: this.$store.state.uiVariant,
    }
  },
  methods: {
    capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  },
  computed: {
    filterOptions() {
      const types = this.typeTags.map(tag => ({ text: this.capitalize(tag), value: { type: tag } }));
      const categories = this.categoryTags.map(tag => ({ text: this.capitalize(tag), value: { category: tag } }));
      
      return [
        { text: "All Questions", value: "All Questions" },
        { divider: true },
        { header: "TYPES" },
        ...types,
        { divider: true },
        { header: "CATEGORIES" },
        ...categories
      ];
    },
    showQueries: function() {
      let examples = this.exampleQueries;
      if (this.uiVariant === "errors") {
        return examples.filter(q => q.broken);
      }

      examples = examples.filter(q => !q.broken);
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        examples = examples.filter(q => 
          q.question.toLowerCase().includes(query) ||
          q.type.toLowerCase().includes(query) ||
          q.category.toLowerCase().includes(query)
        );
      }

      if (this.selectedFilter && this.selectedFilter !== "All Questions") {
        if (this.selectedFilter.type) {
          examples = examples.filter(q => q.type === this.selectedFilter.type);
        } else if (this.selectedFilter.category) {
          examples = examples.filter(q => q.category === this.selectedFilter.category);
        }
      }
      
      if (!this.searchQuery && this.selectedFilter === "All Questions") {
        examples = examples.reverse();
      }
      return examples;
    },
    typeTags: function() {
      return [... new Set(exampleQueries.map(q => q.type))];
    },
    categoryTags: function() {
      return [... new Set(exampleQueries.map(q => q.category))];
    },
  },
  created() {
  },
  mounted() {
  },
  watch: {
    typeFilter(newValue) {
      if (newValue && this.categoryFilter) {
        this.categoryFilter = null;
      }
    },
    categoryFilter(newValue) {
      if (newValue && this.typeFilter) {
        this.typeFilter = null;
      }
    },
  }
}


</script>


<style lang="scss" scoped>
.new-query-button {
  margin-top: 10px;
  margin-left: 18px
}
.tagline.text-h6 {
  font-weight: 400;
  margin-top: 5px;
}
.examples-header-line {
  padding-top: 24px;
  margin: 24px 0px;
  border-bottom: 1px #ddd solid;
}
.row.examples-header {
  margin: 10px 0px;
}
.search-field {
  margin-top: -8px;
  margin-bottom: -8px;
}
.search-field :deep(.v-text-field__slot),
.filter-select :deep(.v-text-field__slot) {
  border-color: white;
}
.search-field :deep(.v-input__slot),
.filter-select :deep(.v-input__slot) {
  border-color: white !important;
  fieldset {
    border-color: white !important;
  }
}
.filter-select {
  max-width: 200px;
  margin-top: -8px;
  margin-bottom: -8px;
}
.example-questions {
  margin-bottom: 50px;
}
</style>