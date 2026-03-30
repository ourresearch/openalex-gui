<template>
  <div class="author-search">
    <!-- Search input -->
    <div class="author-search-input-wrap">
      <v-text-field
        v-model="searchQuery"
        placeholder="Search by name, OpenAlex ID (e.g. A5086928770), or ORCID"
        variant="outlined"
        density="compact"
        hide-details
        prepend-inner-icon="mdi-magnify"
        :loading="isSearching"
        @keydown.enter="doSearch"
        clearable
        @click:clear="clearResults"
      />
    </div>

    <!-- Guidance text -->
    <div v-if="!results.length && !isSearching && !hasSearched" class="author-search-hint">
      Search for your author profile to claim it. If you have multiple profiles in OpenAlex,
      select the one that best represents your body of work. You can add missing publications
      to your profile after claiming it.
    </div>

    <!-- Loading state -->
    <div v-if="isSearching" class="author-search-loading">
      <v-progress-circular indeterminate size="24" width="2" class="mr-3" />
      Searching author profiles...
    </div>

    <!-- No results -->
    <div v-if="hasSearched && !isSearching && results.length === 0" class="author-search-empty">
      <v-icon size="20" class="mr-2">mdi-account-search-outline</v-icon>
      No author profiles found. Try a different name or ID.
    </div>

    <!-- Results list -->
    <div v-if="results.length > 0" class="author-search-results">
      <div class="author-search-results-count">
        {{ totalResults.toLocaleString() }} result{{ totalResults === 1 ? '' : 's' }} found
      </div>
      <AuthorProfileSearchResult
        v-for="author in results"
        :key="author.id"
        :author="author"
        :selected="selectedAuthorId === author.id"
        class="mb-2"
        @select="selectAuthor(author)"
      />
    </div>

    <!-- Claim button -->
    <div v-if="selectedAuthorId" class="author-search-actions">
      <v-btn
        color="primary"
        variant="flat"
        rounded
        :loading="isClaiming"
        @click="claimProfile"
      >
        Claim this profile
      </v-btn>
      <v-btn
        variant="text"
        rounded
        @click="selectedAuthorId = null"
      >
        Cancel
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { urlBase } from '@/apiConfig';
import AuthorProfileSearchResult from './AuthorProfileSearchResult.vue';

defineOptions({ name: 'AuthorProfileSearch' });

const emit = defineEmits(['claimed']);

const searchQuery = ref('');
const results = ref([]);
const totalResults = ref(0);
const isSearching = ref(false);
const hasSearched = ref(false);
const selectedAuthorId = ref(null);
const isClaiming = ref(false);

function detectSearchType(query) {
  const trimmed = query.trim();

  // OpenAlex ID: starts with A (case-insensitive) followed by digits
  if (/^[Aa]\d+$/.test(trimmed)) {
    return { type: 'openalex_id', value: trimmed };
  }

  // Full OpenAlex URL
  if (trimmed.includes('openalex.org/') && /[Aa]\d+/.test(trimmed)) {
    const match = trimmed.match(/([Aa]\d+)/);
    if (match) return { type: 'openalex_id', value: match[1] };
  }

  // ORCID: 0000-0000-0000-0000 pattern or full URL
  const orcidPattern = /(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i;
  const orcidMatch = trimmed.match(orcidPattern);
  if (orcidMatch) {
    return { type: 'orcid', value: orcidMatch[1] };
  }

  // Default: name search
  return { type: 'name', value: trimmed };
}

async function doSearch() {
  const query = searchQuery.value?.trim();
  if (!query) return;

  isSearching.value = true;
  hasSearched.value = true;
  results.value = [];
  selectedAuthorId.value = null;

  try {
    const detected = detectSearchType(query);
    let url;

    if (detected.type === 'openalex_id') {
      // Fetch single author by ID
      const id = detected.value.toUpperCase();
      url = `${urlBase.api}/authors/${id}`;
      try {
        const resp = await axios.get(url);
        results.value = [resp.data];
        totalResults.value = 1;
      } catch (e) {
        results.value = [];
        totalResults.value = 0;
      }
    } else if (detected.type === 'orcid') {
      // Search by ORCID filter
      url = `${urlBase.api}/authors?filter=orcid:${detected.value}&per_page=10`;
      const resp = await axios.get(url);
      results.value = resp.data.results || [];
      totalResults.value = resp.data.meta?.count || results.value.length;
    } else {
      // Name search, sort by works count descending
      url = `${urlBase.api}/authors?search=${encodeURIComponent(detected.value)}&sort=works_count:desc&per_page=10`;
      const resp = await axios.get(url);
      results.value = resp.data.results || [];
      totalResults.value = resp.data.meta?.count || results.value.length;
    }
  } catch (err) {
    console.error('Author search error:', err);
    results.value = [];
    totalResults.value = 0;
  } finally {
    isSearching.value = false;
  }
}

function selectAuthor(author) {
  selectedAuthorId.value = selectedAuthorId.value === author.id ? null : author.id;
}

async function claimProfile() {
  if (!selectedAuthorId.value) return;
  isClaiming.value = true;
  try {
    emit('claimed', selectedAuthorId.value);
  } finally {
    isClaiming.value = false;
  }
}

function clearResults() {
  results.value = [];
  totalResults.value = 0;
  hasSearched.value = false;
  selectedAuthorId.value = null;
}
</script>

<style scoped>
.author-search {
  padding: 0;
}

.author-search-input-wrap {
  margin-bottom: 12px;
}

.author-search-hint {
  font-size: 13px;
  color: #6B6B6B;
  line-height: 1.5;
  padding: 8px 0;
}

.author-search-loading {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #6B6B6B;
  padding: 16px 0;
}

.author-search-empty {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #6B6B6B;
  padding: 16px 0;
}

.author-search-results {
  margin-top: 4px;
}

.author-search-results-count {
  font-size: 12px;
  color: #9CA3AF;
  margin-bottom: 8px;
}

.author-search-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #F0F0F0;
}
</style>
