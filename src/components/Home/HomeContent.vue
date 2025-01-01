<template>
  <v-container>
    <v-row>
    <v-col cols="0" />
    <v-col cols="12">
    <v-row class="">
      <div class="text-h3">
        Advanced Queries
      </div>
      <v-btn color="primary" class="start-button" to="/s/f847ddf26aaa15e1a37159983c815980">
        Start a Query
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
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
        <v-chip :outlined="typeFilter !== tag" v-for="tag in typeTags"
          @click="typeFilter = typeFilter === tag ? null : tag"
        >
          {{ tag }}
        </v-chip>
        <v-chip :outlined="categoryFilter !== tag" v-for="tag in categoryTags"
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
        />
      </v-col>
    </v-row>
  </v-container>
</template>


<script>

import VueHorizontal from 'vue-horizontal';
import ExampleQuery from "@/components/Home/ExampleQuery.vue";

export default {
  name: "HomeContent",
  components: {
    VueHorizontal,
    ExampleQuery,
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
      const nExamples = 100
      let examples = this.exampleQueries
      if (this.uiVariant === "errors") {
        return examples.filter(q => q.broken)
      }
      examples = examples.filter(q => !q.broken)
      if (this.typeFilter) {
        examples = examples.filter(q => q.type === this.typeFilter)
      }
      if (this.categoryFilter) {
        examples = examples.filter(q => q.category === this.categoryFilter)
      }
      return examples.sort(() => Math.random() - 0.5).slice(0, nExamples);
    },
    typeTags: function() {
      return [... new Set(exampleQueries.map(q => q.type))]
    },
    categoryTags: function() {
      return [... new Set(exampleQueries.map(q => q.category))]
    },
  },
  created() {
  },
  mounted() {
  },
  watch: {
    typeFilter(newValue) {
      if (newValue && this.categoryFilter) {
        this.categoryFilter = null
      }
    },
    categoryFilter(newValue) {
      if (newValue && this.typeFilter) {
        this.typeFilter = null
      }
    },
  }
}

const exampleQueries = [
  {
    question: "What topics does Kyle Demes work on?",
    type: "topics",
    category: "trend detection",
    url: "/s/7510b68ca5533131792d514e75762eca",
  },
  {
    question: "Which institutions in Austria have the highest percentage of Open Access works?",
    type: "institutions",
    category: "open access",
    url: "/s/cc7fffa97cdab1b7c115b599e29002cc",
  },
  {
    question: "What are the highest cited publications at Memorial University of Newfoundland?",
    type: "sources",
    category: "discovery",
    url: "/s/1ed60ea4043ab333bd102d8af5e759b6",
    broken: true,
    error: "Column host_organization not found in entity config",
  },
  {
    question: "Which journals have the highest APC fees?",
    type: "sources",
    category: "discovery",
    url: "/s/8c6d197386e1a445d0fea7367769a012",
    broken: true,
    error: "'NoneType' object has no attribute 'startswith'",
  },
  {
    question: "Who are Stephen Hawking's top co-authors?",
    type: "authors",
    category: "discovery",
    url: "/s/b9da0ead143263c4f05888011d13acce",
  },
  {
    question: "What topics does the University of Minnesota publish on in Business?",
    type: "topics",
    category: "discovery",
    url: "/s/e4176eb0c00fc2b56064172880ec7d23",
  },
  {
    question: "Which fields does UT Austin have the highest FWCI in?",
    type: "fields",
    category: "discovery",
    url: "/s/13cd602f1dccac39794da7d20bd90f5a",
  },
  {
    question: "What is the breakdown of books in OpenAlex by field?",
    type: "fields",
    category: "discovery",
    url: "/s/78ffeccab3d0af95e83f73edcedc67ff",
  },
  {
    question: "Who does NASA collaborate with most?",
    type: "institutions",
    category: "discovery",
    url: "/s/84920125f599817c11dce73ab60b9adf",
    broken: true,
    error: "There are multiple institutions within NASA"
  },
  {
    question: "Which countries focus the most on SDG 5?",
    type: "countries",
    category: "discovery",
    url: "/s/843d1b2a306bf2e29800ff4fee37cafb",
  },
  {
    question: "Which institutions has Claudia Goldin worked at?",
    type: "institutions",
    category: "discovery",
    url: "/s/ee25f465d0907f66d8b1638629df55af",
    broken: true,
    error: "This get institutions for all co-authors of Claudia Goldin as well."
  },
  {
    question: "Who are the world experts on macrocystis?",
    type: "authors",
    category: "expert discovery",
    url: "/s/3c44e1c7b3231dd8b173b059ce3aa935",
    broken: true,
    error: "No results",
  },
  {
    question: "How many authors in Brazil have an ORCID?",
    type: "authors",
    category: "compliance",
    url: "/s/e66189a2c349622d80dede22dfdd9bd0",
    broken: true,
    error: "Lots of Chinese authors, getting authors who co-author with someone in Brazil?"
  },
  {
    question: "Which works from the University of Washington and funded by the National Institute of Health are closed access?",
    type: "works",
    category: "discovery",
    url: "/s/74b0898975eae60675fb246d70001544",
  },
  {
    question: "Which topics does the EU collaborate the most with the US on?",
    type: "topics",
    category: "discovery",
    url: "/s/c12f56579396372fab91e7a0b4965426",
    broken: true,
    error: "Continent Europe and EU are not the same",
  },
  {
    question: "Which authors at the University of British Columbia have made their datasets open access?",
    type: "authors",
    category: "compliance",
    url: "/s/032eae4bad444a0452ed6002a5d89620",
  },
  {
    question: "How does Notre Dame University contribute to the Sustainable Development Goals?",
    type: "sdgs",
    category: "trend detection",
    url: "/s/05b3f84ef774454eb81721cbc91dc0f0",
  },
  {
    question: "Which researchers at the University College London publish the most work in Nature?",
    type: "authors",
    category: "expert discovery",
    url: "/s/7b83bc13e13e68354df8469f8906259a",
  },
  {
    question: "Which researchers at the University of Colorado have published the most work on SDG 13?",
    type: "authors",
    category: "expert discovery",
    url: "/s/772d344e411d30026434e0dc0f5e7844",
  },
  {
    question: "Which topics has the National Research Council of Canada funded the most research on at Dalhousie University?",
    type: "topics",
    category: "trend detection",
    url: "/s/6f275677f0df4a25a3756342036926c9",
  },
  {
    question: "Which researchers at Virginia Tech are collaborating with researchers in Ukraine?",
    type: "authors",
    category: "expert discovery",
    url: "/s/207fe1fcc0abd6ba07bba3168739f24c",
  },
  {
    question: "Which journals publish the highest cited research on coral bleaching?",
    type: "sources",
    category: "recommenders",
    url: "/s/b2eb324e69e4e409011798a90d78ce0b",
    broken: true,
    error: "No reults."
  },
  {
    question: "Which institutions in Japan collaborate the most with researchers in the Global South?",
    type: "institutions",
    category: "expert discovery",
    url: "/s/9ce42c599fe7278fe7a1a0f5c9888bd1",
  },
  {
    question: "Which authors at Simon Fraser University collaborate with researchers in Iran on Engineering research?",
    type: "authors",
    category: "collaboration",
    url: "/s/6b2f7eefbcbf7bee2ed74ab5ba8002ab",
  },
  {
    question: "Which companies in Australia are working on hydrogen fuel cell development?",
    type: "institutions",
    category: "collaboration",
    url: "/s/41a5f22c1528a94f9273a93584279a7c",
  },
  {
    question: "Which companies co-author research with academic institutions in Israel?",
    type: "institutions",
    category: "trend detection",
    url: "/s/a2755f7d707b96be8dbd4e3f510b5e0c",
  },
  {
    question: "Which countries does Spain collaborate with on cybersecurity?",
    type: "countries",
    category: "collaboration",
    url: "/s/2d603c3b6041c84ca210917cca11efc5",
  },
  {
    question: "What research has MIT collaborated with the US government on?",
    type: "works",
    category: "collaboration",
    url: "/s/a6a646fe1315ac11f93610902cd3f9e3",
    broken: true,
    error: "No results."
  },
]

</script>

<style lang="scss">
.start-button {
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