<template>
  <v-container class="works-citing-oa">
      <!-- Title -->
      <div class="title-block mt-6 mb-4">
        <div class="text-h3">Works Citing OpenAlex</div>
        <div class="text-h7 subtitle">{{totalWorks}} works discovered through the OpenAlex API</div>
      </div>

      <!-- Works List -->
      <v-card flat border rounded>
      <v-list lines="two" class="pa-2">
        <v-list-item
          v-for="work in works"
          :key="work.id"
          :href="work.id"
          target="_blank"
        >
          
            <v-list-item-title>{{ work.title }}</v-list-item-title>
            <v-list-item-subtitle>
              <span v-if="work.authorships && work.authorships.length">
                {{ formatAuthors(work.authorships) }}
              </span>,
              <span v-if="work.publication_year">
                {{ work.publication_year }}
              </span>
            </v-list-item-subtitle>
          
        </v-list-item>
      </v-list>
      </v-card>

      <!-- Loading Spinner -->
      <v-row justify="center" v-if="loading">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-row>

      <!-- Show More Button -->
      <v-row v-if="!loading && hasMore" class="pa-8">
        <v-btn color="primary" @click="showMore">Show More</v-btn>
      </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

defineOptions({
  name: 'WorksCitingOpenAlex',
});

// Reactive state
const works = ref([]);
const loading = ref(false);
const error = ref(null);
const currentPage = ref(1);
const perPage = ref(20);
const totalWorks = ref(0);

// Computed: determine if more results are available
const hasMore = computed(() => {
  return currentPage.value * perPage.value < totalWorks.value;
});

// Method: format authors
function formatAuthors(authorships) {
  return authorships
    .map(auth => {
      // Prefer raw_author_name (the original name from the source)
      return auth.raw_author_name || auth.author?.display_name || 'Unknown Author';
    })
    .join(', ');
}

// Method: fetch works from the API
async function fetchWorks(page) {
  loading.value = true;
  error.value = null;

  try {
    const response = await axios.get('https://api.openalex.org/works', {
      params: {
        page,
        filter: 'cites:w4229010617',
        sort: 'publication_year:desc',
        per_page: perPage.value,
      },
    });

    const fetchedWorks = response.data.results || [];
    const meta = response.data.meta || {};
    totalWorks.value = meta.count;
    works.value = [...works.value, ...fetchedWorks];

  } catch (err) {
    console.error(err);
    error.value = 'Failed to fetch works. Please try again later.';
  } finally {
    loading.value = false;
  }
}

// Method: handle "Show More"
function showMore() {
  if (hasMore.value) {
    currentPage.value += 1;
    fetchWorks(currentPage.value);
  }
}

// Lifecycle: initial fetch
onMounted(() => {
  fetchWorks(currentPage.value);
});
</script>


<style scoped>
.works-citing-oa {
  width: 900px;
  max-width: 95%;
  margin: auto;
}
.subtitle {
  margin-top: 8px;
  margin-left: 10px;
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
  margin-bottom: 20px;
}
</style>