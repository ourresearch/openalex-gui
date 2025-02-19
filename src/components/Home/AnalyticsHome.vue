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
    <v-row class="examples-header text-h6">
      Example Questions
    </v-row>
      <vue-horizontal  class="example-filters horizontal" :displacement="0.5" :button-between="false">
        <v-chip :outlined="typeFilter !== tag" v-for="tag in typeTags" :key="tag"
          @click="typeFilter = typeFilter === tag ? null : tag"
        >
          {{ tag }}
        </v-chip>
        <v-chip :outlined="categoryFilter !== tag" v-for="tag in categoryTags" :key="tag"
          @click="categoryFilter = categoryFilter === tag ? null : tag"
        >
          {{ tag }}
        </v-chip>
      </vue-horizontal>

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
      typeFilter: null,
      categoryFilter: null,
      uiVariant: this.$store.state.uiVariant,
    }
  },
  methods: {
  },
  computed: {
    showQueries: function() {
      let examples = this.exampleQueries;
      if (this.uiVariant === "errors") {
        return examples.filter(q => q.broken);
      }

      examples = examples.filter(q => !q.broken);
      if (this.typeFilter) {
        examples = examples.filter(q => q.type === this.typeFilter);
      }
      if (this.categoryFilter) {
        examples = examples.filter(q => q.category === this.categoryFilter);
      }
      
      if (!this.categoryFilter && !this.typeFilter) {
        examples = examples.reverse();
        //examples = examples.sort(() => Math.random() - 0.5);
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
  margin: 10px 14px;
}
.example-filters {
  margin: 0px 10px 10px 10px;
  height: 40px;
  line-height: 40px;
}
.v-hl-btn-next, .v-hl-btn-prev {
  top: -8px !important;
  transform: scale(0.9);
}
.v-hl-btn-next {
  right: -18px !important;
}
.v-hl-btn-prev {
  left: -18px !important;
}
.v-hl-svg {
  box-shadow: none !important;
}
.example-filters .v-chip {
  margin: 3px;
}
.example-questions {
  margin-bottom: 50px;
}
</style>