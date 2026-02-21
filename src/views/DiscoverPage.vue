<template>
  <div class="discover-page">

    <!-- Empty State (left-aligned like Home page) -->
    <section v-if="!hasQuery && !loading" class="empty-state">
      <div class="empty-state-content">
        <h1 class="page-headline">
          Discover research
          <v-chip color="primary" variant="tonal" size="small" class="beta-chip ml-3">beta</v-chip>
        </h1>

        <p class="page-subhead">
          Paste an abstract, enter a phrase, or describe what you're looking for.
          We'll discover semantically similar works using vector embeddings.
        </p>

        <discover-search-box
          v-model="searchQuery"
          :loading="loading"
          :disabled="isIndexUnavailable"
          class="search-box"
          @submit="executeSearch"
        />

        <p class="keyword-note mt-4">
          Looking for traditional keyword search?
          <router-link to="/works" class="keyword-link">Use our main search</router-link>
        </p>
      </div>
    </section>

    <!-- Results State -->
    <div v-else class="results-container">
      <!-- Page header with title, description, and search -->
      <header class="results-header-section">
        <h1 class="results-title">
          Discover
          <v-chip color="primary" variant="tonal" size="x-small" class="ml-2">beta</v-chip>
        </h1>
        <p class="results-description">
          Use vector embeddings to discover conceptually similar works.
          <span v-if="embeddingsCount" class="works-count">{{ embeddingsCountFormatted }} works indexed.</span>
        </p>
        <discover-search-box
          v-model="searchQuery"
          :loading="loading"
          compact
          class="results-search-box"
          @submit="executeSearch"
        />
        <p class="keyword-note mt-3">
          Looking for keyword search?
          <router-link to="/works" class="keyword-link">Use our main search</router-link>
        </p>
      </header>

      <!-- Content area: filters + results -->
      <div class="content-area">
        <!-- Filters sidebar -->
        <aside class="filters-sidebar">
          <discover-filters />
        </aside>

        <!-- Results -->
        <main class="results-main">
          <!-- Rate limit error -->
          <div v-if="rateLimitError" class="rate-limit-error mb-4">
            <v-alert type="warning" variant="tonal" prominent>
              <template #title>Temporarily unavailable</template>
              <p class="mb-2">
                The vector search service is temporarily unavailable. Please try again in a few minutes.
              </p>
              <p class="text-caption mb-0">
                In the meantime, you can use our
                <router-link to="/works">keyword search</router-link> instead.
              </p>
            </v-alert>
          </div>

          <!-- Index completely unavailable error -->
          <div v-if="isIndexUnavailable && hasQuery" class="index-rebuilding-error mb-4">
            <v-alert type="warning" variant="tonal" prominent>
              <template #title>Search index unavailable</template>
              <p class="mb-2">
                The search index is currently being rebuilt and is not available.
              </p>
              <p class="text-caption mb-0">
                Use our <router-link to="/works">keyword search</router-link> in the meantime.
              </p>
            </v-alert>
          </div>

          <discover-results-list
            v-else-if="!isIndexUnavailable"
            :results="results"
            :loading="loading"
            :api-url="apiUrl"
          />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useHead } from '@unhead/vue';

import { api } from '@/api';
import { useDiscoverUrl } from '@/composables/useDiscoverUrl';
import { deduplicateResults } from '@/utils/deduplication';

import DiscoverSearchBox from '@/components/Discover/DiscoverSearchBox.vue';
import DiscoverFilters from '@/components/Discover/DiscoverFilters.vue';
import DiscoverResultsList from '@/components/Discover/DiscoverResultsList.vue';

defineOptions({ name: 'DiscoverPage' });

useHead({
  title: 'Discover research - OpenAlex',
});

const { query, hasQuery, apiFilters, setQuery } = useDiscoverUrl();

const searchQuery = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref(null);
const rateLimitError = ref(false);
const apiUrl = ref('');
const indexReady = ref(null);
const embeddingsCount = ref(null);

// Check if index is completely unavailable (not ready at all)
const isIndexUnavailable = computed(() => {
  return indexReady.value === false;
});

// Format embeddings count for display (e.g., "190M")
const embeddingsCountFormatted = computed(() => {
  if (!embeddingsCount.value) return null;
  const millions = embeddingsCount.value / 1_000_000;
  return `${millions.toFixed(0)}M`;
});

// Fetch index stats on mount
async function fetchIndexStats() {
  try {
    const health = await api.discoverWorksHealth();
    if (health.index) {
      indexReady.value = health.index.ready;
      embeddingsCount.value = health.index.embeddings_count;
    }
  } catch (e) {
    console.error('Failed to fetch index stats:', e);
  }
}

// Sync local search query with URL
watch(query, (newQuery) => {
  searchQuery.value = newQuery;
}, { immediate: true });

// Execute search when URL query or filters change
watch([query, apiFilters], async () => {
  if (query.value) {
    await executeSearch(query.value);
  }
}, { immediate: true });

async function executeSearch(queryText) {
  const q = queryText || searchQuery.value;
  if (!q?.trim()) return;

  // Update URL if needed
  if (q !== query.value) {
    setQuery(q);
    return; // The watch will trigger the actual search
  }

  loading.value = true;
  error.value = null;
  rateLimitError.value = false;
  results.value = [];

  try {
    // Build API URL for "View API" link
    apiUrl.value = api.makeDiscoverWorksUrl(q, apiFilters.value, 25);

    // Execute search
    const response = await api.discoverWorks(q, apiFilters.value, 25);

    // Handle different response formats and deduplicate
    if (Array.isArray(response)) {
      results.value = deduplicateResults(response);
    } else if (response.results) {
      results.value = deduplicateResults(response.results);
    } else {
      results.value = [];
    }
  } catch (e) {
    console.error('Search failed:', e);

    // Check for rate limit error (OpenAI 429)
    const errorData = e.response?.data;
    const errorMessage = errorData?.message || errorData?.error || e.message || '';

    if (errorMessage.includes('rate_limit') || errorMessage.includes('429') || errorMessage.includes('too large')) {
      rateLimitError.value = true;
    } else {
      error.value = errorMessage || 'Search failed';
    }
    results.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchIndexStats();
});
</script>

<style lang="scss" scoped>
.discover-page {
  min-height: calc(100vh - var(--app-bar-height));
  background: #fff;
}

// Empty State (left-aligned like Home)
.empty-state {
  min-height: calc(100vh - var(--app-bar-height));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  padding: 0 24px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.index-rebuilding-error {
  :deep(.v-alert) {
    border-radius: 12px;
  }

  p {
    margin: 0;
  }

  a {
    color: inherit;
    font-weight: 500;
  }
}

.empty-state-content {
  max-width: 700px;
  width: 100%;
}

.page-headline {
  font-size: 52px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.025em;
  color: #1A1A1A;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
}

.beta-chip {
  vertical-align: middle;
  font-size: 12px;
  letter-spacing: normal;
}

.page-subhead {
  font-size: 18px;
  font-weight: 400;
  line-height: 1.6;
  color: #6B7280;
  max-width: 620px;
  margin: 0 0 40px 0;
}

.search-box {
  width: 100%;
}

.index-status {
  font-size: 14px;
  color: #6B7280;
  display: inline-flex;
  align-items: center;
}

.keyword-note {
  font-size: 14px;
  color: #9CA3AF;
  margin: 0;
}

.keyword-link {
  color: #2563EB;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// Results State
.results-container {
  max-width: 920px;
  margin: 0 auto;
  padding: 32px 24px;
}

.results-header-section {
  margin-bottom: 32px;
}

.results-title {
  font-size: 28px;
  font-weight: 600;
  color: #1A1A1A;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
}

.results-description {
  font-size: 14px;
  color: #6B7280;
  margin: 0 0 20px 0;
  line-height: 1.5;

  .works-count {
    color: #9CA3AF;
  }
}

.results-search-box {
  width: 100%;
}

// Content area: filters + results side by side
.content-area {
  display: flex;
  gap: 48px;
}

.filters-sidebar {
  flex-shrink: 0;
  width: 160px;
}

.results-main {
  flex: 1;
  min-width: 0;
  max-width: 680px;
}

// Rate limit error
.rate-limit-error {
  :deep(.v-alert) {
    border-radius: 12px;
  }

  p {
    margin: 0;
  }

  a {
    color: inherit;
    font-weight: 500;
  }
}

// Responsive
@media (max-width: 960px) {
  .page-headline {
    font-size: 40px;
  }

  .page-subhead {
    font-size: 16px;
  }

  .content-area {
    flex-direction: column;
    gap: 24px;
  }

  .filters-sidebar {
    width: 100%;
  }

  .results-main {
    max-width: 100%;
  }
}

@media (max-width: 600px) {
  .page-headline {
    font-size: 32px;
    flex-wrap: wrap;
  }

  .page-subhead {
    font-size: 15px;
  }

  .results-title {
    font-size: 24px;
  }
}
</style>
