<template>
  <div class="add-works-search">
    <!-- Pinned header: search field stays visible while results scroll -->
    <div class="aws-header">
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
      />
    </div>
    <v-divider />

    <div ref="bodyEl" class="aws-body" @scroll="onBodyScroll">
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
      <div v-else-if="hasSearched && !isSearching && !isLoadingMore && !hasMore && results.length === 0" class="text-body-2 text-medium-emphasis pa-4">
        <v-icon size="18" class="mr-1">mdi-file-search-outline</v-icon>
        No works found. Try a different search.
      </div>

      <!-- Results -->
      <div v-if="results.length > 0" class="search-results">
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
              <a
                :href="workHref(work)"
                target="_blank"
                rel="noopener"
                class="search-result-title text-body-2 font-weight-medium"
              >
                {{ work.display_name || 'Untitled' }}
              </a>
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

        <div v-if="isLoadingMore" class="d-flex align-center justify-center text-caption text-medium-emphasis pa-3">
          <v-progress-circular indeterminate size="18" width="2" class="mr-2" />
          Loading more…
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
import { ref, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
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

const router = useRouter();

function workHref(work) {
  const shortId = (work.id || '').split('/').pop();
  return router.resolve({
    name: 'EntityPage',
    params: { entityType: 'works', entityId: shortId },
  }).href;
}

const PER_PAGE = 25;
// Fire title.search in parallel with raw_author_name.search only when the query
// has at least this many whitespace tokens. Single-word title searches are
// noisy (e.g. "neural" → thousands of unrelated hits). oxjob #240 Phase 1.
const MIN_TITLE_SEARCH_WORDS = 2;

const searchQuery = ref('');
const results = ref([]);
const isSearching = ref(false);
const isLoadingMore = ref(false);
const hasSearched = ref(false);
const alreadyOnProfile = ref(false);
const bodyEl = ref(null);

// Track what name the user searched (for name-based filtering)
const searchedName = ref('');

// Two parallel paged sources for text queries: 'name' (raw_author_name.search,
// post-filtered by the shallow name gate from #187) and 'title' (title.search,
// no name post-filter; title rows fall back to authorship[0] when no authorship
// matches props.authorName). DOI/ID lookups bypass both. oxjob #240 Phase 1.
function makeSource() {
  return { url: null, total: 0, page: 0 };
}
let sources = { name: makeSource(), title: makeSource() };
let matchName = '';

function sourceHasMore(s) {
  return !!s.url && s.page > 0 && s.page * PER_PAGE < s.total;
}

const hasMore = computed(
  () => sourceHasMore(sources.name) || sourceHasMore(sources.title)
);

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

// 'name' source: raw_author_name.search is fuzzy — drop works where no
// authorship matches matchName (#187 behavior).
// 'title' source: try the same name-match against props.authorName first; if
// that fails, fall back to authorship[0] so title hits aren't dropped even
// when the user's raw_author_name on the paper differs from their profile
// name. oxjob #240 Phase 1.
function transformWork(work, source) {
  if (!work.authorships?.length) return null;
  const matchTarget = source === 'title' ? props.authorName : matchName;
  let useIdx = findMatchedAuthorship(work, matchTarget);
  if (useIdx < 0) {
    if (source === 'name') return null;
    useIdx = 0; // title fallback
  }
  const a = work.authorships[useIdx];
  work._matchedIdx = useIdx;
  work._matchedAuthorship = a;
  work._matchedName =
    a.raw_author_name || a.author?.display_name || 'Unknown';
  work._otherCount = Math.max(0, work.authorships.length - 1);
  const src = work.primary_location?.source?.display_name;
  work._sourceLabel = src ? clampText(src, 45) : 'source unknown';
  work._yearLabel = work.publication_year
    ? String(work.publication_year)
    : 'year unknown';
  work._isSelected = false;
  work._searchSource = source;
  return work;
}

function transformWorks(rawResults, source) {
  return rawResults.map(w => transformWork(w, source)).filter(Boolean);
}

function appendUnique(works) {
  const seen = new Set(results.value.map(w => w.id));
  results.value.push(...works.filter(w => !seen.has(w.id)));
}

async function doSearch() {
  const query = searchQuery.value?.trim();
  if (!query) return;

  isSearching.value = true;
  hasSearched.value = true;
  alreadyOnProfile.value = false;
  results.value = [];
  sources = { name: makeSource(), title: makeSource() };

  try {
    const detected = detectSearchType(query);
    matchName =
      (detected.type === 'author_name' ? detected.value : props.authorName) ||
      props.authorName;
    searchedName.value =
      detected.type === 'author_name' ? detected.value : props.authorName;

    if (detected.type === 'doi' || detected.type === 'openalex_id') {
      const url =
        detected.type === 'doi'
          ? `${urlBase.api}/works/doi:${detected.value}`
          : `${urlBase.api}/works/${detected.value.toUpperCase()}`;
      let rawResults = [];
      try {
        const resp = await axios.get(url);
        rawResults = [resp.data];
      } catch {
        rawResults = [];
      }
      const authorShortId = props.authorId
        .replace('https://openalex.org/', '')
        .toUpperCase();
      const before = rawResults.length;
      rawResults = rawResults.filter(work => {
        const isAlreadyLinked = work.authorships?.some(a => {
          const aid = (a.author?.id || '')
            .replace('https://openalex.org/', '')
            .toUpperCase();
          return aid === authorShortId;
        });
        return !isAlreadyLinked;
      });
      if (rawResults.length === 0 && before > 0) alreadyOnProfile.value = true;
      results.value = transformWorks(rawResults, 'name');
    } else {
      // Text query — fire raw_author_name.search always; fire title.search in
      // parallel when the query has enough tokens to make it meaningful. The
      // detected.value tracks the heuristic best guess for matchName tracking,
      // but both filters get the raw trimmed query so we don't lose hits when
      // the heuristic guesses wrong (the whole point of #240 Phase 1).
      const authorShortId = props.authorId.replace(
        'https://openalex.org/',
        ''
      );
      const tokenCount = query.split(/\s+/).filter(Boolean).length;

      sources.name.url = `${urlBase.api}/works?filter=raw_author_name.search:${encodeURIComponent(query)},authorships.author.id:!${authorShortId}`;
      const requests = [
        axios
          .get(`${sources.name.url}&per_page=${PER_PAGE}&page=1`)
          .then(r => ({ source: 'name', resp: r }))
          .catch(e => ({ source: 'name', error: e })),
      ];

      if (tokenCount >= MIN_TITLE_SEARCH_WORDS) {
        sources.title.url = `${urlBase.api}/works?filter=title.search:${encodeURIComponent(query)},authorships.author.id:!${authorShortId}`;
        requests.push(
          axios
            .get(`${sources.title.url}&per_page=${PER_PAGE}&page=1`)
            .then(r => ({ source: 'title', resp: r }))
            .catch(e => ({ source: 'title', error: e }))
        );
      }

      const settled = await Promise.all(requests);
      // Order matters: name results land first so name-match attribution wins
      // ties when the same work id appears in both sets.
      for (const r of settled) {
        if (r.error) {
          console.error(`Work search (${r.source}) error:`, r.error);
          continue;
        }
        sources[r.source].page = 1;
        sources[r.source].total = r.resp.data.meta?.count || 0;
        appendUnique(transformWorks(r.resp.data.results || [], r.source));
      }
    }
  } catch (err) {
    console.error('Work search error:', err);
    results.value = [];
  } finally {
    isSearching.value = false;
    fillIfNeeded();
  }
}

async function loadMore() {
  if (isLoadingMore.value || isSearching.value || !hasMore.value) return;
  isLoadingMore.value = true;
  try {
    const requests = [];
    for (const key of ['name', 'title']) {
      const s = sources[key];
      if (!sourceHasMore(s)) continue;
      const next = s.page + 1;
      requests.push(
        axios
          .get(`${s.url}&per_page=${PER_PAGE}&page=${next}`)
          .then(r => ({ source: key, page: next, resp: r }))
          .catch(e => ({ source: key, error: e }))
      );
    }
    const settled = await Promise.all(requests);
    for (const r of settled) {
      if (r.error) {
        console.error(`Load more (${r.source}) failed:`, r.error);
        continue;
      }
      sources[r.source].page = r.page;
      appendUnique(transformWorks(r.resp.data.results || [], r.source));
    }
  } finally {
    isLoadingMore.value = false;
    fillIfNeeded();
  }
}

// Post-filtering can drop a whole page, so a page may add 0 visible rows
// while more pages exist. Keep pulling until the body scrolls or we run out.
let fillGuard = 0;
async function fillIfNeeded() {
  if (!hasMore.value) {
    fillGuard = 0;
    return;
  }
  await nextTick();
  const el = bodyEl.value;
  if (el && el.scrollHeight <= el.clientHeight + 4 && fillGuard < 40) {
    fillGuard += 1;
    loadMore();
  } else {
    fillGuard = 0;
  }
}

function onBodyScroll() {
  const el = bodyEl.value;
  if (!el) return;
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 160) loadMore();
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
  sources = { name: makeSource(), title: makeSource() };
}
</script>

<style scoped>
.add-works-search {
  display: flex;
  flex-direction: column;
  min-height: 400px;
  max-height: 70vh;
}

.aws-header {
  flex: 0 0 auto;
  padding: 16px;
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
  display: inline-block;
  color: #1976d2;
  line-height: 1.4;
  text-decoration: none;
}

.search-result-title:hover {
  text-decoration: underline;
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
