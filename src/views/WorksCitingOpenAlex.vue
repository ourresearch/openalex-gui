<template>
  <v-container class="works-citing-oa">
      <!-- Title -->
      <div class="title-block mt-6 mb-4">
        <div class="text-h3">Works Citing OpenAlex</div>
        <div class="text-h7 subtitle">{{totalWorks}} works discovered through the OpenAlex API</div>
      </div>

      <!-- Works List -->
      <v-list two-line class="pa-2">
        <v-list-item
          v-for="work in works"
          :key="work.id"
          :href="work.id"
          target="_blank"
        >
          <v-list-item-content>
            <v-list-item-title>{{ work.title }}</v-list-item-title>
            <v-list-item-subtitle>
              <span v-if="work.authorships && work.authorships.length">
                {{ formatAuthors(work.authorships) }}
              </span>,
              <span v-if="work.publication_year">
                {{ work.publication_year }}
              </span>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <!-- Loading Spinner -->
      <v-row justify="center" v-if="loading">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-row>

      <!-- Show More Button -->
      <v-row v-if="!loading && hasMore" class="pa-3">
        <v-btn color="primary" @click="showMore">Show More</v-btn>
      </v-row>
  </v-container>
</template>


<script>
import axios from 'axios';
import { debounce } from 'lodash';

export default {
  name: "WorksCitingOpenAlex",
  data() {
    return {
      works: [],            // All fetched works
      displayedWorks: [],   // Works currently displayed
      loading: false,      // Loading state
      error: null,         // Error message
      currentPage: 1,      // Current page number
      perPage: 20,        // Number of works per page
      totalWorks: 0,
    };
  },
  computed: {
    hasMore() {
      return this.currentPage * this.perPage < this.totalWorks
    },
  },
  methods: {
    // Fetch works from the API
    async fetchWorks(page) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(`https://api.openalex.org/works`, {
          params: {
            page: page,
            filter: 'cites:w4229010617',
            sort: 'publication_year:desc',
            per_page: this.perPage,
          },
        });

        // Extract works and meta information
        const fetchedWorks = response.data.results || [];
        const meta = response.data.meta || {};
        this.totalWorks = meta.count

        // Append fetched works to the existing list
        this.works = [...this.works, ...fetchedWorks];


      } catch (err) {
        console.error(err);
        this.error = "Failed to fetch works. Please try again later.";
      } finally {
        this.loading = false;
      }
    },
    // Handle "Show More" button click
    showMore() {
      if (this.hasMore) {
        this.currentPage += 1;
        this.fetchWorks(this.currentPage);
      }
    },
    // Format authorship information
    formatAuthors(authorships) {
      return authorships.map(auth => {
        const author = auth.author;
        return author && author.display_name ? author.display_name : "Unknown Author";
      }).join(", ");
    },
  },
  created() {
    this.fetchWorks(this.currentPage);
  },
};
</script>

<style scoped>
.works-citing-oa {
  width: 700px;
  max-width: 95%;
  margin: auto;
}
.subtitle {
  margin-top: 8px;
  font-size: 14px;
  color: #777;
}
.v-list-item__title{
  text-overflow: initial!important;
  white-space: initial!important;
  line-height: 1.4 !important;
  font-size: 18px;
  color: #555;
}
.v-list-item {
  cursor: pointer;
  margin-bottom: 15px;
}
</style>