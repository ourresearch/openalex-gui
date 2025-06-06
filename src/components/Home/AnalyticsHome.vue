<template>
  <div class="color-2 pt-12">
    <v-container class="analytics-home">
      <v-row class="mx-0 d-flex align-center">
        <div class="text-h3">
          Analytics
        </div>
        <new-query-button button-text="Start a Query" :goTo="true" color="primary" size="medium" class="ml-4"/>
        <v-spacer />
        <v-btn size="small" color="white" variant="flat" :href="'https://www.youtube.com/watch?v=tZB_BaRlkRU'" target="_blank">
          <v-icon start >mdi-video-outline</v-icon>
          Watch a Tutorial
        </v-btn>
        <v-btn size="small" color="white" variant="flat" :to="{name: 'AnalyticsDocs'}" class="ml-1">
          <v-icon start >mdi-book-open-outline</v-icon>
          Read the Docs
        </v-btn>
      </v-row>

      <v-row class="mx-0 mt-2">
        <div class="tagline text-h6">
          Query, aggregate, and download across our entire dataset.
        </div>
      </v-row>
      
      <v-row class="examples-header d-flex align-center mt-12 mb-4 mx-1">
        <v-text-field
          v-model="searchQuery"
          label="Search example questions..."
          placeholder=""
          variant="solo"
          flat
          clearable
          rounded
          prepend-inner-icon="mdi-magnify"
          class="search-field flex-grow-1"
          hide-details
          bg-color="white"
        ></v-text-field>
        <v-select
          v-model="selectedFilter"
          :items="filterOptions"
          variant="solo"
          flat
          hide-details
          rounded
          class="ml-4 filter-select"
          bg-color="white"
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
  </div>
</template>


<script>

import NewQueryButton from "@/components/Misc/NewQueryButton.vue";
import ExampleQuery from "@/components/Home/ExampleQuery.vue";
import {exampleQueries} from "./exampleQueriesList";

export default {
  name: "AnalyticsHome",
  components: {
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
      const types = this.typeTags.map(tag => ({ title: this.capitalize(tag), value: { type: tag } }));
      const categories = this.categoryTags.map(tag => ({ title: this.capitalize(tag), value: { category: tag } }));
      
      return [
      { title: "All Questions", value: "All Questions" },
      ...types,
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
        const searchWords = this.searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 0);
        examples = examples.filter(q => {
          const searchableText = [
            q.question.toLowerCase(),
            q.type.toLowerCase(),
            q.category.toLowerCase()
          ].join(' ');
          return searchWords.every(word => searchableText.includes(word));
        });
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
.row.examples-header {
  margin: 15px 0px;
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