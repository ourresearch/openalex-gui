<template>
  <div class="find-page">
    <!-- Empty State (left-aligned like Home page) -->
    <section v-if="!hasQuery && !loading" class="empty-state">
      <div class="empty-state-content">
        <h1 class="page-headline">
          Find research
          <v-chip color="primary" variant="tonal" size="small" class="beta-chip ml-3">beta</v-chip>
        </h1>

        <p class="page-subhead">
          Paste an abstract, enter a phrase, or describe what you're looking for.
          We'll find semantically similar works using vector embeddings.
        </p>

        <find-search-box
          v-model="searchQuery"
          :loading="loading"
          class="search-box"
          @submit="executeSearch"
        />

        <div class="index-status mt-4" v-if="indexCurrent">
          <template v-if="isIndexBuilding">
            <v-icon size="x-small" class="mr-1">mdi-sync</v-icon>
            Index building: {{ indexCurrentFormatted }} of {{ indexTargetFormatted }} works
          </template>
          <template v-else>
            Searching {{ indexCurrentFormatted }} works
          </template>
        </div>

        <p class="keyword-note mt-6">
          Looking for traditional keyword search?
          <router-link to="/works" class="keyword-link">Use our main search</router-link>
        </p>
      </div>
    </section>

    <!-- Results State -->
    <v-container v-else fluid class="results-container pt-4">
      <!-- Top row: search box + info panel -->
      <div class="top-row mb-6">
        <div class="search-col">
          <find-search-box
            v-model="searchQuery"
            :loading="loading"
            compact
            @submit="executeSearch"
          />
        </div>
        <div class="info-col">
          <div class="info-box">
            <div class="info-title">
              Semantic Search
              <v-chip size="x-small" color="primary" variant="tonal" class="ml-1">beta</v-chip>
            </div>
            <p class="info-text">
              Uses vector embeddings to find conceptually similar papers, not just keyword matches.
              <router-link to="/works" class="info-link">Use keyword search instead.</router-link>
              <span v-if="indexCurrent" class="works-count-inline">
                <template v-if="isIndexBuilding">Index: {{ indexCurrentFormatted }}/{{ indexTargetFormatted }}.</template>
                <template v-else>Searching {{ indexCurrentFormatted }} works.</template>
              </span>
            </p>
          </div>
        </div>
      </div>

      <v-row no-gutters>
        <!-- Filters sidebar -->
        <v-col cols="12" md="2" class="filters-col pr-6">
          <find-filters />
        </v-col>

        <!-- Results -->
        <v-col cols="12" md="10" class="results-col">
          <!-- Rate limit error -->
          <div v-if="rateLimitError" class="rate-limit-error mb-4">
            <v-alert type="warning" variant="tonal" prominent>
              <template #title>Temporarily unavailable</template>
              <p class="mb-2">
                We're currently hitting OpenAI's rate limit because we're working hard to compute
                embeddings for all our works. Please try again in a few minutes.
              </p>
              <p class="text-caption mb-0">
                In the meantime, you can use our
                <router-link to="/works">keyword search</router-link> instead.
              </p>
            </v-alert>
          </div>

          <find-results-list
            v-else
            :results="results"
            :loading="loading"
            :api-url="apiUrl"
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useHead } from '@unhead/vue';
import millify from 'millify';

import { api } from '@/api';
import { useFindUrl } from '@/composables/useFindUrl';

import FindSearchBox from '@/components/Find/FindSearchBox.vue';
import FindFilters from '@/components/Find/FindFilters.vue';
import FindResultsList from '@/components/Find/FindResultsList.vue';

defineOptions({ name: 'FindPage' });

useHead({
  title: 'Find research - OpenAlex',
});

const { query, hasQuery, apiFilters, setQuery } = useFindUrl();

const searchQuery = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref(null);
const rateLimitError = ref(false);
const apiUrl = ref('');
const indexCurrent = ref(null);
const indexTarget = ref(null);

// Formatted index counts using millify
const indexCurrentFormatted = computed(() => {
  if (!indexCurrent.value) return '';
  return millify(indexCurrent.value, { precision: 1, lowercase: true });
});

const indexTargetFormatted = computed(() => {
  if (!indexTarget.value) return '';
  return millify(indexTarget.value, { precision: 1, lowercase: true });
});

const isIndexBuilding = computed(() => {
  if (!indexCurrent.value || !indexTarget.value) return false;
  return indexCurrent.value < indexTarget.value;
});

// Fetch index stats on mount
async function fetchIndexStats() {
  try {
    const health = await api.findWorksHealth();
    if (health.embeddings) {
      indexCurrent.value = health.embeddings.current;
      indexTarget.value = health.embeddings.target;
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
    apiUrl.value = api.makeFindWorksUrl(q, apiFilters.value, 25);

    // Execute search
    const response = await api.findWorks(q, apiFilters.value, 25);

    // Handle different response formats
    if (Array.isArray(response)) {
      results.value = response;
    } else if (response.results) {
      results.value = response.results;
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
.find-page {
  min-height: calc(100vh - 70px);
  background: #fff;
}

// Empty State (left-aligned like Home)
.empty-state {
  min-height: calc(100vh - 70px);
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
  max-width: 600px;
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
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 24px;
  padding-right: 24px;
}

// Top row layout
.top-row {
  display: flex;
  gap: 32px;
  align-items: stretch;
}

.search-col {
  flex: 0 0 auto;
  width: 100%;
  max-width: 600px;
  display: flex;
}

.info-col {
  flex: 1;
  min-width: 0;
  display: flex;
}

.info-box {
  flex: 1;
  padding: 16px 20px;
  background: #F9FAFB;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .info-title {
    font-weight: 600;
    font-size: 13px;
    color: #1A1A1A;
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }

  .info-text {
    font-size: 13px;
    color: #6B7280;
    line-height: 1.6;
    margin: 0;
  }

  .info-link {
    color: #2563EB;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .works-count-inline {
    margin-left: 4px;
  }
}

// Grid alignment handled by v-row no-gutters and pr-6 class

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
}

@media (max-width: 960px) {
  .top-row {
    flex-direction: column;
    gap: 16px;
  }

  .search-col {
    max-width: 100%;
  }

  .info-col {
    width: 100%;
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
}
</style>
