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

      <!-- Common-name hint (oxjob #240 Phase 2): typed name returned >1000
           hits on the unwidened query; results are ranked but inherently
           noisy, so suggest adding a middle name / initial. -->
      <div v-if="commonNameHint" class="common-name-hint text-caption text-medium-emphasis mb-3">
        <v-icon size="16" class="mr-1">mdi-information-outline</v-icon>
        <strong>{{ commonNameHint }}</strong> is a very common name — not all matches can be shown. Try adding a middle name or initial for better results.
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
import {
  nameTokens,
  detectSearchType,
  buildLadderFilterValue,
  findMatchedAuthorship,
  MIN_TITLE_SEARCH_WORDS,
} from './addWorksSearch.helpers.js';

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
// Phase 2 ladder: progressively widen the name-search query until the API
// reports ≥ COUNT_THRESHOLD hits (cap at LADDER_STEPS rungs). Each rung is
// ONE OR'd-phrase request — see oxjob #240 PLAN.md for the locked spec.
const LADDER_STEPS = 5;
const COUNT_THRESHOLD = 100;
const COMMON_NAME_THRESHOLD = 1000;

const searchQuery = ref('');
const results = ref([]);
const isSearching = ref(false);
const isLoadingMore = ref(false);
const hasSearched = ref(false);
const alreadyOnProfile = ref(false);
const bodyEl = ref(null);

// "<typed name> is a very common name" hint shown above results when step 1
// of the ladder returns > COMMON_NAME_THRESHOLD hits.
const commonNameHint = ref('');

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

function clampText(s, max) {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

// Pick which authorship to display for a row.
// - name-source rows (ladder/search hits): require an authorship that
//   matches the typed query on surname AND given-token-or-initial;
//   otherwise DROP the row. Without this gate, ladder step 3's
//   first-initial widening (e.g. `"j priem"` matching "Richard J.
//   Priem") returns works the user didn't mean, and falling back to
//   authorship[0] surfaces an unrelated co-author's name (e.g. "M. F.
//   Heidmann") as the displayed match. Restored from oxjob #187 —
//   Phase 2's drop of this gate was based on the incorrect assumption
//   that quoted-phrase scoping made it redundant. (oxjob #240 follow-up,
//   2026-05-25.)
// - non-name sources ('title', 'doi'): user has already expressed
//   intent (typed a title fragment or pasted an exact ID), so we
//   surface the work even if no authorship matches the profile owner;
//   best-effort pick authorship[0] for display.
function transformWork(work, source) {
  if (!work.authorships?.length) return null;
  let useIdx;
  if (source === 'name') {
    useIdx = findMatchedAuthorship(work, matchName);
    if (useIdx < 0) return null;
  } else {
    useIdx = findMatchedAuthorship(work, props.authorName);
    if (useIdx < 0) useIdx = 0;
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
  commonNameHint.value = '';
  results.value = [];
  sources = { name: makeSource(), title: makeSource() };

  try {
    const detected = detectSearchType(query);
    matchName =
      (detected.type === 'author_name' ? detected.value : props.authorName) ||
      props.authorName;

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
      // Paratext (issue covers, TOCs) is filter-excluded on search paths;
      // drop it here too so a user pasting a paratext DOI gets the same
      // "not found" UX rather than a stuck-curation later. Drop first so
      // the alreadyOnProfile signal isn't triggered by a paratext-only
      // result.
      rawResults = rawResults.filter(work => work.type !== 'paratext');
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
      results.value = transformWorks(rawResults, 'doi');
    } else {
      // Text query — Phase 2 (oxjob #240): walk the progressive ladder for
      // raw_author_name.search (sequential, with per-step threshold gate);
      // fire title.search ONCE in parallel for ≥2-token queries. Both legs
      // get `&include_xpac=true` (fixes the ~22% under-count from #187 /
      // Phase 1 — verified empirically per EXPLORE.md).
      const authorShortId = props.authorId.replace(
        'https://openalex.org/',
        ''
      );
      const tokenCount = query.split(/\s+/).filter(Boolean).length;

      // Title fires in parallel with the ladder (independent request).
      // type:!paratext: paratext works (issue covers, TOCs) have authors
      // conflated across the whole issue and apply can't attach to bylines
      // missing from `work_authors` Delta. See follow-up oxjob.
      let titlePromise = null;
      if (tokenCount >= MIN_TITLE_SEARCH_WORDS) {
        sources.title.url = `${urlBase.api}/works?filter=title.search:${encodeURIComponent(query)},authorships.author.id:!${authorShortId},type:!paratext&include_xpac=true`;
        titlePromise = axios
          .get(`${sources.title.url}&per_page=${PER_PAGE}&page=1`)
          .then(r => ({ ok: true, resp: r }))
          .catch(e => ({ ok: false, error: e }));
      }

      // Ladder loop. Only fire the name ladder when the query was
      // classified as a person name. Without this gate, title-shaped
      // queries (e.g. "the state of oa") would advance to step 3's
      // first-initial form `"t oa"` and dump garbage authorship matches
      // on top of the real title.search results. oxjob #240 follow-up
      // (2026-05-25).
      if (detected.type === 'author_name') {
        const tokens = nameTokens(query);
        let lastFilterValue = null;
        for (let step = 1; step <= LADDER_STEPS; step++) {
          const filterValue = buildLadderFilterValue(tokens, step);
          if (!filterValue) break;
          if (filterValue === lastFilterValue) continue;
          lastFilterValue = filterValue;

          const url = `${urlBase.api}/works?filter=raw_author_name.search:${encodeURIComponent(filterValue)},authorships.author.id:!${authorShortId},type:!paratext&include_xpac=true`;
          let resp;
          try {
            resp = await axios.get(`${url}&per_page=${PER_PAGE}&page=1`);
          } catch (e) {
            console.error(`Ladder step ${step} error:`, e);
            continue;
          }

          const count = resp.data.meta?.count || 0;
          // Latest fired step becomes the pagination source for loadMore.
          // Earlier steps' result sets are strict subsets, so paginating
          // the final step covers everything visible.
          sources.name.url = url;
          sources.name.total = count;
          sources.name.page = 1;

          // Common-name hint after step 1 only.
          if (step === 1 && count > COMMON_NAME_THRESHOLD) {
            commonNameHint.value = query.trim();
          }

          appendUnique(transformWorks(resp.data.results || [], 'name'));

          if (count >= COUNT_THRESHOLD) break;
        }
      }

      if (titlePromise) {
        const r = await titlePromise;
        if (r.ok) {
          sources.title.page = 1;
          sources.title.total = r.resp.data.meta?.count || 0;
          appendUnique(transformWorks(r.resp.data.results || [], 'title'));
        } else {
          console.error('Title search error:', r.error);
        }
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
  commonNameHint.value = '';
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

.common-name-hint {
  padding: 8px 12px;
  background: rgba(33, 150, 243, 0.06);
  border-left: 3px solid rgba(33, 150, 243, 0.5);
  border-radius: 2px;
  line-height: 1.5;
}
</style>
