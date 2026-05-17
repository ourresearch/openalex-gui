<template>
  <div class="add-works-search">
    <div class="aws-body">
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
          {{ results.length.toLocaleString() }} result{{ results.length === 1 ? '' : 's' }} found
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
            />

            <div class="flex-grow-1">
              <div class="search-result-title text-body-2 font-weight-medium">
                {{ work.display_name || 'Untitled' }}
              </div>
              <div class="search-result-meta text-caption mt-1">
                by <strong>{{ work._matchedName }}</strong><template
                  v-if="work._otherCount > 0"
                > and {{ work._otherCount }} other{{ work._otherCount === 1 ? '' : 's' }}</template>
                <span class="search-result-source"> - {{ work._sourceLabel }}</span>
                - {{ work._yearLabel }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer pinned to the bottom of the dialog -->
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

const emit = defineEmits(['add-work', 'done']);

const searchQuery = ref('');
const results = ref([]);
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

// raw_author_name.search is fuzzy (it'll return "Jennifer Priem" for
// "Jason Priem"). We tighten it client-side with a deliberately shallow
// rule — surname must match exactly; the first given token must match OR
// be an initial of the other (so "j priem" still finds "Jason Priem").
// No deep name parsing on purpose. oxjob #187.
function nameTokens(name) {
  let n = (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z, ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (n.includes(',')) {
    const p = n.split(',').map(x => x.trim()).filter(Boolean);
    n = `${p[1] ? p[1] + ' ' : ''}${p[0] || ''}`;
  }
  return n.split(/\s+/).filter(Boolean);
}

function clampText(s, max) {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function givenMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length === 1 && b.startsWith(a)) return true;
  if (b.length === 1 && a.startsWith(b)) return true;
  return false;
}

function authorshipMatches(authorship, qTokens) {
  const cand = nameTokens(
    authorship.raw_author_name || authorship.author?.display_name || ''
  );
  if (!cand.length) return false;
  if (qTokens[qTokens.length - 1] !== cand[cand.length - 1]) return false; // surname
  if (qTokens.length === 1) return true; // surname-only query
  return givenMatch(qTokens[0], cand[0]);
}

// Returns the index of the authorship that matches the query name, or -1.
function findMatchedAuthorship(work, queryName) {
  const q = nameTokens(queryName);
  if (!q.length || !work.authorships?.length) return -1;
  for (let i = 0; i < work.authorships.length; i++) {
    if (authorshipMatches(work.authorships[i], q)) return i;
  }
  return -1;
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

    let rawResults = [];
    if (detected.type === 'doi') {
      url = `${urlBase.api}/works/doi:${detected.value}`;
      try {
        const resp = await axios.get(url);
        rawResults = [resp.data];
      } catch {
        rawResults = [];
      }
    } else if (detected.type === 'openalex_id') {
      url = `${urlBase.api}/works/${detected.value.toUpperCase()}`;
      try {
        const resp = await axios.get(url);
        rawResults = [resp.data];
      } catch {
        rawResults = [];
      }
    } else if (detected.type === 'author_name') {
      const authorShortId = props.authorId.replace('https://openalex.org/', '');
      url = `${urlBase.api}/works?filter=raw_author_name.search:${encodeURIComponent(detected.value)},authorships.author.id:!${authorShortId}&per_page=10`;
      const resp = await axios.get(url);
      rawResults = resp.data.results || [];
    } else {
      const authorShortId = props.authorId.replace('https://openalex.org/', '');
      url = `${urlBase.api}/works?filter=title.search:${encodeURIComponent(detected.value)},authorships.author.id:!${authorShortId}&per_page=10`;
      const resp = await axios.get(url);
      rawResults = resp.data.results || [];
    }

    // Filter out works already on profile for DOI/ID lookups
    if (detected.type === 'doi' || detected.type === 'openalex_id') {
      const authorShortId = props.authorId.replace('https://openalex.org/', '').toUpperCase();
      const before = rawResults.length;
      rawResults = rawResults.filter(work => {
        const isAlreadyLinked = work.authorships?.some(a => {
          const aid = (a.author?.id || '').replace('https://openalex.org/', '').toUpperCase();
          return aid === authorShortId;
        });
        return !isAlreadyLinked;
      });
      if (rawResults.length === 0 && before > 0) {
        alreadyOnProfile.value = true;
      }
    }

    // raw_author_name.search is fuzzy — keep only works where an authorship
    // actually matches the searched name, and remember which one (that's the
    // name we'll attribute the work under). oxjob #187.
    const matchName = searchedName.value || props.authorName;
    results.value = rawResults
      .map(work => {
        const idx = findMatchedAuthorship(work, matchName);
        if (idx < 0) return null;
        const a = work.authorships[idx];
        work._matchedIdx = idx;
        work._matchedAuthorship = a;
        work._matchedName =
          a.raw_author_name || a.author?.display_name || 'Unknown';
        work._otherCount = Math.max(0, (work.authorships?.length || 1) - 1);
        const src = work.primary_location?.source?.display_name;
        work._sourceLabel = src ? clampText(src, 45) : 'source unknown';
        work._yearLabel = work.publication_year
          ? String(work.publication_year)
          : 'year unknown';
        work._isSelected = true;
        return work;
      })
      .filter(Boolean);
  } catch (err) {
    console.error('Work search error:', err);
    results.value = [];
  } finally {
    isSearching.value = false;
  }
}

function submitSelectedWorks() {
  const selected = results.value.filter(w => w._isSelected);
  selected.forEach(work => {
    emit('add-work', {
      workId: work.id,
      authorshipIdx: work._matchedIdx,
      authorship: work._matchedAuthorship,
    });
    work._matchState = 'added';
  });
  emit('done');
}

function clearResults() {
  results.value = [];
  hasSearched.value = false;
  alreadyOnProfile.value = false;
  searchedName.value = '';
}
</script>

<style scoped>
.add-works-search {
  display: flex;
  flex-direction: column;
  min-height: 400px;
  max-height: 70vh;
}

.aws-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 16px;
}

.search-result-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item--selected {
  background: rgba(76, 175, 80, 0.05);
}

.search-result-title {
  color: rgba(0, 0, 0, 0.87);
  line-height: 1.4;
}

.search-result-meta {
  color: rgba(0, 0, 0, 0.6);
}

.search-result-checkbox {
  flex-shrink: 0;
}

.search-footer {
  flex: 0 0 auto;
  background: white;
}

.search-footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}
</style>
