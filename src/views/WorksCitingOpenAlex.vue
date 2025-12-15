<template>
  <div class="max-w-[900px] w-[95%] mx-auto">
      <!-- Title -->
      <div class="mt-6 mb-4">
        <h1 class="text-3xl font-bold">Works Citing OpenAlex</h1>
        <p class="mt-2 ml-2 text-sm text-muted-foreground">{{totalWorks}} works discovered through the OpenAlex API</p>
      </div>

      <!-- Works List -->
      <Card class="p-2">
        <div class="space-y-5">
          <a
            v-for="work in works"
            :key="work.id"
            :href="work.id"
            target="_blank"
            class="block p-3 hover:bg-muted/50 rounded-md cursor-pointer"
          >
            <div class="text-lg text-foreground/80 leading-snug">{{ work.title }}</div>
            <div class="text-sm text-muted-foreground mt-1">
              <span v-if="work.authorships && work.authorships.length">
                {{ formatAuthors(work.authorships) }}
              </span>,
              <span v-if="work.publication_year">
                {{ work.publication_year }}
              </span>
            </div>
          </a>
        </div>
      </Card>

      <!-- Loading Spinner -->
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <!-- Show More Button -->
      <div v-if="!loading && hasMore" class="p-8">
        <Button @click="showMore">Show More</Button>
      </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
/* Styles handled via Tailwind classes */
</style>