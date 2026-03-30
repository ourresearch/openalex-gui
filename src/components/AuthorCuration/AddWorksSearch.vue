<template>
  <div class="add-works-search">
    <!-- Search input -->
    <v-text-field
      v-model="searchQuery"
      placeholder="Search by title, DOI, or author name"
      variant="outlined"
      density="compact"
      hide-details
      prepend-inner-icon="mdi-magnify"
      :loading="isSearching"
      @keydown.enter="doSearch"
      clearable
      @click:clear="clearResults"
      class="mb-3"
    />

    <div v-if="!results.length && !isSearching && !hasSearched" class="text-body-2 text-medium-emphasis">
      Search for works to add to your author profile. You can search by title, DOI, or author name.
    </div>

    <!-- Loading -->
    <div v-if="isSearching" class="d-flex align-center text-body-2 text-medium-emphasis pa-4">
      <v-progress-circular indeterminate size="20" width="2" class="mr-3" />
      Searching works...
    </div>

    <!-- Already on profile -->
    <div v-if="alreadyOnProfile && !isSearching" class="text-body-2 text-medium-emphasis pa-4">
      <v-icon size="18" class="mr-1" color="primary">mdi-check-circle-outline</v-icon>
      This work is already on your author profile.
    </div>

    <!-- No results -->
    <div v-else-if="hasSearched && !isSearching && results.length === 0" class="text-body-2 text-medium-emphasis pa-4">
      <v-icon size="18" class="mr-1">mdi-file-search-outline</v-icon>
      No works found. Try a different search.
    </div>

    <!-- Results -->
    <div v-if="results.length > 0" class="search-results">
      <div class="text-caption text-medium-emphasis mb-2">
        {{ totalResults.toLocaleString() }} result{{ totalResults === 1 ? '' : 's' }} found
      </div>

      <div
        v-for="work in results"
        :key="work.id"
        class="search-result-item"
        :class="{ 'search-result-item--selected': work._isSelected }"
      >
        <div class="d-flex align-start">
          <!-- Checkbox -->
          <v-checkbox
            v-model="work._isSelected"
            hide-details
            density="compact"
            class="search-result-checkbox mt-0 pt-0 mr-2"
            :disabled="!work._authorshipConfirmed"
          />

          <div class="flex-grow-1">
            <div class="search-result-title text-body-2 font-weight-medium">
              {{ work.display_name || 'Untitled' }}
            </div>
            <div class="search-result-meta text-caption text-medium-emphasis">
              <span v-if="work.publication_year">{{ work.publication_year }}</span>
              <span v-if="work.primary_location?.source?.display_name">
                · <span class="font-italic">{{ work.primary_location.source.display_name }}</span>
              </span>
            </div>

            <!-- Filtered authorship name bubbles -->
            <div class="authorship-section mt-2">
              <template v-if="work._candidateAuthorships && work._candidateAuthorships.length > 0">
                <div class="text-caption text-medium-emphasis mb-1">Select your name on this work:</div>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-for="(candidate, cidx) in work._candidateAuthorships"
                    :key="cidx"
                    size="small"
                    :variant="work._selectedAuthorshipIdx === candidate.idx ? 'flat' : 'outlined'"
                    :color="work._selectedAuthorshipIdx === candidate.idx ? 'success' : undefined"
                    @click="selectAuthorship(work, candidate.idx)"
                  >
                    {{ candidate.authorship.raw_author_name || candidate.authorship.author?.display_name || 'Unknown' }}
                  </v-chip>
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  Not listed?
                  <a href="#" @click.prevent="showAllAuthors(work)" class="text-primary">Show all authors</a>
                  ·
                  <a href="mailto:support@openalex.org">Contact support</a>
                </div>
              </template>

              <template v-else-if="work._showAllAuthors">
                <div class="text-caption text-medium-emphasis mb-1">Select your name:</div>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-for="(authorship, aidx) in work.authorships"
                    :key="aidx"
                    size="small"
                    :variant="work._selectedAuthorshipIdx === aidx ? 'flat' : 'outlined'"
                    :color="work._selectedAuthorshipIdx === aidx ? 'success' : undefined"
                    @click="selectAuthorship(work, aidx)"
                  >
                    {{ authorship.raw_author_name || authorship.author?.display_name || 'Unknown' }}
                  </v-chip>
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  Not here? <a href="mailto:support@openalex.org">Contact support</a>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky footer with "Add works" button -->
    <div v-if="selectedWorksCount > 0" class="search-footer">
      <v-divider />
      <div class="search-footer-content">
        <span class="text-body-2">
          {{ selectedWorksCount }} work{{ selectedWorksCount === 1 ? '' : 's' }} selected
        </span>
        <v-btn
          color="primary"
          variant="flat"
          rounded
          size="small"
          @click="submitSelectedWorks"
        >
          Add works
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { urlBase } from '@/apiConfig';

defineOptions({ name: 'AddWorksSearch' });

const props = defineProps({
  authorName: {
    type: String,
    default: '',
  },
  authorId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['add-work']);

const searchQuery = ref('');
const results = ref([]);
const totalResults = ref(0);
const isSearching = ref(false);
const hasSearched = ref(false);
const alreadyOnProfile = ref(false);

// Track what name the user searched (for name-based filtering)
const searchedName = ref('');

const selectedWorksCount = computed(() =>
  results.value.filter(w => w._isSelected).length
);

function looksLikePersonName(query) {
  const words = query.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  if (/\d/.test(query)) return false;
  if (/[;:?!]/.test(query)) return false;
  const avgLen = words.reduce((sum, w) => sum + w.replace(/\./g, '').length, 0) / words.length;
  if (avgLen > 10) return false;
  return true;
}

function detectSearchType(query) {
  const trimmed = query.trim();

  // DOI pattern
  if (trimmed.startsWith('10.') || trimmed.includes('doi.org/')) {
    const doi = trimmed.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
    return { type: 'doi', value: doi };
  }

  // OpenAlex work ID
  if (/^[Ww]\d+$/.test(trimmed) || (trimmed.includes('openalex.org/') && /[Ww]\d+/.test(trimmed))) {
    const match = trimmed.match(/([Ww]\d+)/);
    if (match) return { type: 'openalex_id', value: match[1] };
  }

  // Detect person name vs title
  if (looksLikePersonName(trimmed)) {
    return { type: 'author_name', value: trimmed };
  }

  // Default: title search
  return { type: 'title', value: trimmed };
}

function normalizeName(name) {
  if (!name) return '';
  let n = name.trim();
  if (n.includes(',')) {
    const parts = n.split(',').map(p => p.trim());
    n = parts.reverse().join(' ');
  }
  return n.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
}

function nameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;
  const a = normalizeName(name1);
  const b = normalizeName(name2);
  if (a === b) return 1;

  const aWords = a.split(' ');
  const bWords = b.split(' ');
  const aLast = aWords[aWords.length - 1];
  const bLast = bWords[bWords.length - 1];
  if (aLast !== bLast) {
    if (a.includes(b) || b.includes(a)) return 0.5;
    return 0;
  }

  const aFirst = aWords[0] || '';
  const bFirst = bWords[0] || '';
  if (aFirst === bFirst) return 1;
  if (aFirst.startsWith(bFirst) || bFirst.startsWith(aFirst)) return 0.9;
  if (aFirst[0] === bFirst[0]) return 0.7;
  return 0.6;
}

/**
 * Find candidate authorships that reasonably match the user's name or search query.
 * Returns only those with similarity >= 0.6, sorted by score descending.
 */
function findCandidateAuthorships(work, matchName) {
  if (!work.authorships || work.authorships.length === 0) return [];

  const candidates = [];
  work.authorships.forEach((authorship, idx) => {
    const rawName = authorship.raw_author_name || '';
    const displayName = authorship.author?.display_name || '';
    const score = Math.max(
      nameSimilarity(matchName, rawName),
      nameSimilarity(matchName, displayName)
    );
    if (score >= 0.6) {
      candidates.push({ idx, authorship, score });
    }
  });

  return candidates.sort((a, b) => b.score - a.score);
}

async function doSearch() {
  const query = searchQuery.value?.trim();
  if (!query) return;

  isSearching.value = true;
  hasSearched.value = true;
  alreadyOnProfile.value = false;
  results.value = [];

  try {
    const detected = detectSearchType(query);
    let url;

    // Track the name to use for authorship matching
    if (detected.type === 'author_name') {
      searchedName.value = detected.value;
    } else {
      searchedName.value = props.authorName;
    }

    if (detected.type === 'doi') {
      url = `${urlBase.api}/works/doi:${detected.value}`;
      try {
        const resp = await axios.get(url);
        results.value = [resp.data];
        totalResults.value = 1;
      } catch {
        results.value = [];
        totalResults.value = 0;
      }
    } else if (detected.type === 'openalex_id') {
      url = `${urlBase.api}/works/${detected.value.toUpperCase()}`;
      try {
        const resp = await axios.get(url);
        results.value = [resp.data];
        totalResults.value = 1;
      } catch {
        results.value = [];
        totalResults.value = 0;
      }
    } else if (detected.type === 'author_name') {
      const authorShortId = props.authorId.replace('https://openalex.org/', '');
      url = `${urlBase.api}/works?filter=raw_author_name.search:${encodeURIComponent(detected.value)},authorships.author.id:!${authorShortId}&per_page=10`;
      const resp = await axios.get(url);
      results.value = resp.data.results || [];
      totalResults.value = resp.data.meta?.count || results.value.length;
    } else {
      const authorShortId = props.authorId.replace('https://openalex.org/', '');
      url = `${urlBase.api}/works?filter=title.search:${encodeURIComponent(detected.value)},authorships.author.id:!${authorShortId}&per_page=10`;
      const resp = await axios.get(url);
      results.value = resp.data.results || [];
      totalResults.value = resp.data.meta?.count || results.value.length;
    }

    // Filter out works already on profile for DOI/ID lookups
    if (detected.type === 'doi' || detected.type === 'openalex_id') {
      const authorShortId = props.authorId.replace('https://openalex.org/', '').toUpperCase();
      results.value = results.value.filter(work => {
        const isAlreadyLinked = work.authorships?.some(a => {
          const aid = (a.author?.id || '').replace('https://openalex.org/', '').toUpperCase();
          return aid === authorShortId;
        });
        return !isAlreadyLinked;
      });
      if (results.value.length === 0 && totalResults.value > 0) {
        totalResults.value = 0;
        alreadyOnProfile.value = true;
      }
    }

    // Find candidate authorships for each result
    const matchName = searchedName.value || props.authorName;
    results.value.forEach(work => {
      const candidates = findCandidateAuthorships(work, matchName);
      work._candidateAuthorships = candidates;
      work._showAllAuthors = candidates.length === 0;
      work._isSelected = false;
      work._authorshipConfirmed = false;

      // If exactly one strong match, auto-select it
      if (candidates.length === 1 && candidates[0].score >= 0.7) {
        work._selectedAuthorshipIdx = candidates[0].idx;
        work._authorshipConfirmed = true;
        work._isSelected = true; // auto-check
      } else if (candidates.length > 0) {
        work._selectedAuthorshipIdx = null;
        work._authorshipConfirmed = false;
      } else {
        work._selectedAuthorshipIdx = null;
        work._authorshipConfirmed = false;
      }
    });
  } catch (err) {
    console.error('Work search error:', err);
    results.value = [];
    totalResults.value = 0;
  } finally {
    isSearching.value = false;
  }
}

function showAllAuthors(work) {
  work._showAllAuthors = true;
  work._candidateAuthorships = [];
}

function selectAuthorship(work, idx) {
  work._selectedAuthorshipIdx = idx;
  work._authorshipConfirmed = true;
  // Auto-check the work when authorship is selected
  work._isSelected = true;
}

function submitSelectedWorks() {
  const selected = results.value.filter(w => w._isSelected && w._authorshipConfirmed);
  selected.forEach(work => {
    const authorship = work.authorships[work._selectedAuthorshipIdx];
    emit('add-work', {
      workId: work.id,
      authorshipIdx: work._selectedAuthorshipIdx,
      authorship,
    });
    work._matchState = 'added';
  });
}

function clearResults() {
  results.value = [];
  totalResults.value = 0;
  hasSearched.value = false;
  alreadyOnProfile.value = false;
  searchedName.value = '';
}
</script>

<style scoped>
.search-result-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item--selected {
  background: rgba(76, 175, 80, 0.04);
  border-left: 3px solid #4CAF50;
  padding-left: 12px;
}

.search-result-title {
  color: rgba(0, 0, 0, 0.87);
  line-height: 1.4;
}

.search-result-checkbox {
  flex-shrink: 0;
}

.authorship-section {
  padding: 4px 0;
}

.search-footer {
  position: sticky;
  bottom: 0;
  background: white;
  z-index: 1;
  margin: 0 -16px;
  padding: 0 16px;
}

.search-footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
}
</style>
