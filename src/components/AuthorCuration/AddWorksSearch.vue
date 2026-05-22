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
// Cap on parallel name-variant queries. Keeps request fan-out bounded; the
// permutation generator currently emits at most 3, comma form adds 1 more.
const MAX_NAME_VARIANTS = 4;

const searchQuery = ref('');
const results = ref([]);
const isSearching = ref(false);
const isLoadingMore = ref(false);
const hasSearched = ref(false);
const alreadyOnProfile = ref(false);
const bodyEl = ref(null);

// N+1 parallel paged sources for text queries: N quoted-phrase variants of the
// typed name fired against raw_author_name.search (each one is authorship-scoped
// — see oxjob #240 EXPLORE.md), plus title.search. DOI/ID lookups bypass both.
// Quoted phrases eliminate the cross-authorship noise that required the old
// shallow client-side gate, so the gate is gone in Phase 2.
function makeSource(extra = {}) {
  return { url: null, total: 0, page: 0, ...extra };
}
let sources = { names: [], title: makeSource() };
// Tokenized variants used to pick which authorship to display for each row.
// searchedTokens = variants of the user's typed query (name-source rows).
// profileTokens = variants of props.authorName (title-source + DOI/ID rows).
let searchedTokens = [];
let profileTokens = [];

function sourceHasMore(s) {
  return !!s.url && s.page > 0 && s.page * PER_PAGE < s.total;
}

const hasMore = computed(
  () => sources.names.some(sourceHasMore) || sourceHasMore(sources.title)
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

// Normalize like the OX API's raw_author_name tokenizer: lowercase, strip
// diacritics, treat hyphens/commas/periods as whitespace. Used to pick which
// authorship a quoted variant matched, so the row displays the right name.
// (API diacritic handling is asymmetric — see oxjob #240 EXPLORE.md — but
// the variants we generate are ASCII, so this is fine for picking.)
function normTokens(name) {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function clampText(s, max) {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

// Build a small set of quoted-phrase variants we fire in parallel.
// Rules per oxjob #240 PLAN.md:
//   "Jane Smith"   → [Jane Smith]
//   "Jane M Smith" → [Jane Smith, Jane M Smith, J Smith]
//   "J Smith"      → [J Smith]
//   "Smith, Jane"  → [Jane Smith, Smith Jane]
// Capped at MAX_NAME_VARIANTS to keep request fan-out bounded.
function generateNameVariants(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return [];

  const out = [];
  const seen = new Set();
  const push = v => {
    if (!v) return;
    const k = v.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(v);
  };

  // Comma form: "Smith, Jane" — both orderings, Western order first so it
  // wins display-attribution ties in appendUnique dedup.
  if (trimmed.includes(',')) {
    const parts = trimmed
      .split(',')
      .map(p => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (parts.length === 2) {
      push(`${parts[1]} ${parts[0]}`);
      push(`${parts[0]} ${parts[1]}`);
      return out.slice(0, MAX_NAME_VARIANTS);
    }
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  if (tokens.length === 1) {
    push(tokens[0]);
    return out;
  }

  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  push(`${first} ${last}`);
  if (tokens.length > 2) {
    push(tokens.join(' '));
    push(`${first[0]} ${last}`);
  }
  return out.slice(0, MAX_NAME_VARIANTS);
}

// Returns the index of the authorship whose raw_author_name contains any
// variant phrase as a consecutive token subsequence, or -1.
function findAuthorshipIdxForVariants(work, variantTokensList) {
  if (!work.authorships?.length || !variantTokensList.length) return -1;
  for (let i = 0; i < work.authorships.length; i++) {
    const cand = normTokens(
      work.authorships[i].raw_author_name ||
        work.authorships[i].author?.display_name ||
        ''
    );
    if (!cand.length) continue;
    for (const v of variantTokensList) {
      if (!v.length || v.length > cand.length) continue;
      for (let j = 0; j + v.length <= cand.length; j++) {
        let match = true;
        for (let k = 0; k < v.length; k++) {
          if (cand[j + k] !== v[k]) { match = false; break; }
        }
        if (match) return i;
      }
    }
  }
  return -1;
}

// 'name' rows come from quoted raw_author_name.search, so at least one
// authorship matches a searched variant — pick that authorship for display.
// 'title' / 'lookup' rows may not contain the user's name at all; try the
// profile-name variants, fall back to authorship[0] so the row still appears.
// No more client-side dropping: quoting is authorship-scoped, so the old
// shallow gate from #187 is gone in oxjob #240 Phase 2.
function transformWork(work, source) {
  if (!work.authorships?.length) return null;
  const tokens = source === 'name' ? searchedTokens : profileTokens;
  let useIdx = findAuthorshipIdxForVariants(work, tokens);
  if (useIdx < 0) useIdx = 0;
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
  sources = { names: [], title: makeSource() };

  try {
    const detected = detectSearchType(query);
    // Variants are generated from what the user typed if it looks like a
    // person name; otherwise we don't fire the name path at all (title.search
    // alone covers title-y queries). profileTokens are always set from
    // props.authorName for title/lookup row attribution.
    const searchedName =
      detected.type === 'author_name' ? detected.value : '';
    const nameVariants = searchedName ? generateNameVariants(searchedName) : [];
    searchedTokens = nameVariants.map(normTokens);
    profileTokens = generateNameVariants(props.authorName).map(normTokens);

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
      results.value = transformWorks(rawResults, 'lookup');
    } else {
      // Text query — fire one quoted raw_author_name.search per generated
      // variant in parallel (oxjob #240 Phase 2: quoting is authorship-scoped,
      // eliminating the cross-authorship noise the #187 client gate handled).
      // Plus title.search in parallel when the query has enough tokens.
      const authorShortId = props.authorId.replace(
        'https://openalex.org/',
        ''
      );
      const tokenCount = query.split(/\s+/).filter(Boolean).length;
      const requests = [];

      for (const variant of nameVariants) {
        const url = `${urlBase.api}/works?filter=raw_author_name.search:${encodeURIComponent(`"${variant}"`)},authorships.author.id:!${authorShortId}`;
        const src = makeSource({ url, phrase: variant });
        sources.names.push(src);
        requests.push(
          axios
            .get(`${url}&per_page=${PER_PAGE}&page=1`)
            .then(r => ({ src, resp: r }))
            .catch(e => ({ src, error: e }))
        );
      }

      if (tokenCount >= MIN_TITLE_SEARCH_WORDS) {
        sources.title.url = `${urlBase.api}/works?filter=title.search:${encodeURIComponent(query)},authorships.author.id:!${authorShortId}`;
        requests.push(
          axios
            .get(`${sources.title.url}&per_page=${PER_PAGE}&page=1`)
            .then(r => ({ src: sources.title, source: 'title', resp: r }))
            .catch(e => ({ src: sources.title, source: 'title', error: e }))
        );
      }

      const settled = await Promise.all(requests);
      // Order matters: name-variant results land first so a name-match
      // authorship wins display attribution when the same work id appears
      // in both name and title sets. Variants are processed in generation
      // order (first-and-last name variant wins over initial forms).
      for (const r of settled) {
        if (r.error) {
          console.error('Work search error:', r.error);
          continue;
        }
        r.src.page = 1;
        r.src.total = r.resp.data.meta?.count || 0;
        const source = r.source === 'title' ? 'title' : 'name';
        appendUnique(transformWorks(r.resp.data.results || [], source));
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
    for (const s of sources.names) {
      if (!sourceHasMore(s)) continue;
      const next = s.page + 1;
      requests.push(
        axios
          .get(`${s.url}&per_page=${PER_PAGE}&page=${next}`)
          .then(r => ({ src: s, source: 'name', page: next, resp: r }))
          .catch(e => ({ src: s, source: 'name', error: e }))
      );
    }
    if (sourceHasMore(sources.title)) {
      const next = sources.title.page + 1;
      requests.push(
        axios
          .get(`${sources.title.url}&per_page=${PER_PAGE}&page=${next}`)
          .then(r => ({ src: sources.title, source: 'title', page: next, resp: r }))
          .catch(e => ({ src: sources.title, source: 'title', error: e }))
      );
    }
    const settled = await Promise.all(requests);
    for (const r of settled) {
      if (r.error) {
        console.error(`Load more (${r.source}) failed:`, r.error);
        continue;
      }
      r.src.page = r.page;
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
  sources = { names: [], title: makeSource() };
  searchedTokens = [];
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
