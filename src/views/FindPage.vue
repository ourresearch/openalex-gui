<template>
  <div class="find-page">
    <!-- Index Rebuilding Banner -->
    <div v-if="isIndexRebuilding" class="rebuilding-banner">
      <v-container class="rebuilding-content">
        <div class="rebuilding-icon">
          <v-progress-circular
            :model-value="embeddingsPercentage || syncProgressFormatted"
            :size="48"
            :width="4"
            color="primary"
          >
            <span class="progress-text">{{ embeddingsPercentage || syncProgressFormatted }}%</span>
          </v-progress-circular>
        </div>
        <div class="rebuilding-text">
          <h3 class="rebuilding-title">Building search index</h3>
          <p class="rebuilding-description">
            <template v-if="embeddingsCount">
              <strong>{{ embeddingsCountFormatted }}</strong> of 217M works indexed ({{ embeddingsPercentage }}%).
            </template>
            <template v-else>
              We're building embeddings for all 217 million works.
            </template>
            This process takes time but will result in faster, more accurate semantic search.
          </p>
          <p class="rebuilding-alt">
            In the meantime, use our <router-link to="/works">keyword search</router-link> to find works.
          </p>
        </div>
      </v-container>
    </div>

    <!-- Empty State (left-aligned like Home page) -->
    <section v-if="!hasQuery && !loading" class="empty-state" :class="{ 'with-banner': isIndexRebuilding }">
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
          :disabled="isIndexRebuilding"
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
              <span v-if="embeddingsCount" class="works-count">
                {{ embeddingsCountFormatted }} works indexed
              </span>
            </div>
            <p class="info-text">
              Uses vector embeddings to find conceptually similar papers, not just keyword matches.
              <router-link to="/works" class="info-link">Use keyword search instead.</router-link>
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
                The vector search service is temporarily unavailable. Please try again in a few minutes.
              </p>
              <p class="text-caption mb-0">
                In the meantime, you can use our
                <router-link to="/works">keyword search</router-link> instead.
              </p>
            </v-alert>
          </div>

          <!-- Index rebuilding error -->
          <div v-if="isIndexRebuilding && hasQuery" class="index-rebuilding-error mb-4">
            <v-alert type="info" variant="tonal" prominent>
              <template #title>Search index is being built</template>
              <p class="mb-2">
                <template v-if="embeddingsCount">
                  <strong>{{ embeddingsCountFormatted }}</strong> of 217M works indexed ({{ embeddingsPercentage }}%).
                </template>
                <template v-else>
                  Building embeddings for better search results. Progress: {{ syncProgressFormatted }}%.
                </template>
              </p>
              <p class="text-caption mb-0">
                Use our <router-link to="/works">keyword search</router-link> in the meantime.
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
const indexReady = ref(null);
const indexSyncProgress = ref(null);
const indexState = ref(null);
const embeddingsCount = ref(null);
const totalWorksWithAbstracts = ref(217_000_000);

// Check if index is being rebuilt (not ready OR sync in progress)
const isIndexRebuilding = computed(() => {
  // Not ready means rebuilding
  if (indexReady.value === false) return true;
  // Sync in progress (even if ready=true, which happens during triggered updates)
  if (indexSyncProgress.value != null && indexSyncProgress.value < 100) return true;
  return false;
});

// Format embeddings count for display (e.g., "190M")
const embeddingsCountFormatted = computed(() => {
  if (!embeddingsCount.value) return null;
  const millions = embeddingsCount.value / 1_000_000;
  return `${millions.toFixed(0)}M`;
});

// Completion percentage based on embeddings vs total
const embeddingsPercentage = computed(() => {
  if (!embeddingsCount.value || !totalWorksWithAbstracts.value) return null;
  return Math.round((embeddingsCount.value / totalWorksWithAbstracts.value) * 100);
});

// Format sync progress as percentage
const syncProgressFormatted = computed(() => {
  if (indexSyncProgress.value == null) return '0';
  return Math.round(indexSyncProgress.value);
});

// Estimate time remaining based on progress
const estimatedTimeRemaining = computed(() => {
  if (indexSyncProgress.value == null || indexSyncProgress.value === 0) {
    return 'calculating...';
  }
  if (indexSyncProgress.value >= 100) {
    return 'almost done';
  }
  // Rough estimate: assume ~24 hours total for full sync
  const totalHours = 24;
  const remainingPercent = 100 - indexSyncProgress.value;
  const hoursRemaining = (remainingPercent / 100) * totalHours;

  if (hoursRemaining < 1) {
    return 'less than an hour';
  } else if (hoursRemaining < 2) {
    return 'about 1 hour';
  } else if (hoursRemaining < 24) {
    return `about ${Math.round(hoursRemaining)} hours`;
  } else {
    const days = Math.round(hoursRemaining / 24);
    return `about ${days} day${days > 1 ? 's' : ''}`;
  }
});

// Fetch index stats on mount
async function fetchIndexStats() {
  try {
    const health = await api.findWorksHealth();
    if (health.index) {
      indexReady.value = health.index.ready;
      indexSyncProgress.value = health.index.sync_progress;
      indexState.value = health.index.state;
      embeddingsCount.value = health.index.embeddings_count;
      if (health.index.total_works_with_abstracts) {
        totalWorksWithAbstracts.value = health.index.total_works_with_abstracts;
      }
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

// Rebuilding Banner
.rebuilding-banner {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-bottom: 1px solid #F59E0B;
  padding: 24px 0;
}

.rebuilding-content {
  display: flex;
  align-items: center;
  gap: 24px;
  max-width: 800px;
}

.rebuilding-icon {
  flex-shrink: 0;
}

.progress-text {
  font-size: 11px;
  font-weight: 600;
  color: #1A1A1A;
}

.rebuilding-text {
  flex: 1;
}

.rebuilding-title {
  font-size: 18px;
  font-weight: 600;
  color: #92400E;
  margin: 0 0 8px 0;
}

.rebuilding-description {
  font-size: 14px;
  color: #78350F;
  line-height: 1.6;
  margin: 0 0 8px 0;
}

.rebuilding-alt {
  font-size: 13px;
  color: #92400E;
  margin: 0;

  a {
    color: #1D4ED8;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
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

  &.with-banner {
    min-height: calc(100vh - 70px - 120px);
  }
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

  .works-count {
    margin-left: auto;
    font-weight: 400;
    font-size: 12px;
    color: #6B7280;
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
