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
        :disabled="isSearching"
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
      <div v-if="commonNameHint" class="aws-hint text-caption text-medium-emphasis mb-3">
        <v-icon size="16" class="mr-1">mdi-information-outline</v-icon>
        <strong>{{ commonNameHint }}</strong> is a very common name — not all matches can be shown. Try adding a middle name or initial for better results.
      </div>

      <!-- Search progress log (Phase 4 follow-up, 2026-05-28).
           Replaces the prior skeleton-row loader. Each phase of the
           multi-step search — title leg, name ladder widening steps,
           pre-fetch, sort — pushes one entry that fades in below the
           previous ones. Past entries stay visible (muted, with a
           check); the latest entry is rendered at full emphasis with
           a small dot. Inspired by AI thinking-trace UX: makes the
           multi-second search feel responsive AND explains the
           multi-search nature of the query to the user. -->
      <div v-if="isSearching" class="search-log" data-test="search-log">
        <transition-group name="log" tag="div">
          <div
            v-for="(entry, idx) in searchLog"
            :key="entry.id"
            class="search-log-entry"
            :class="{
              'search-log-entry--past': idx < searchLog.length - 1,
              'search-log-entry--current': idx === searchLog.length - 1,
            }"
          >
            <v-icon size="14" class="search-log-icon">
              {{ idx === searchLog.length - 1 ? 'mdi-circle-small' : 'mdi-check' }}
            </v-icon>
            <span class="search-log-text">{{ entry.text }}</span>
          </div>
        </transition-group>
      </div>

      <!-- Already on profile (DOI/ID path only) -->
      <div v-if="alreadyOnProfile && !isSearching" class="text-body-2 text-medium-emphasis pa-4">
        <v-icon size="18" class="mr-1" color="primary">mdi-check-circle-outline</v-icon>
        This work is already on your author profile.
      </div>

      <!-- No results (entire merged set is empty) -->
      <div v-else-if="hasSearched && !isSearching && results.length === 0" class="text-body-2 text-medium-emphasis pa-4">
        <v-icon size="18" class="mr-1">mdi-file-search-outline</v-icon>
        No works found. Try a different search.
      </div>

      <!-- Tabs + results (Phase 4, oxjob #240): split the merged result
           set into "Not in profile" (default) and "In profile" (read-
           only). The dialog is reached by clicking "+ Add works" — the
           dominant intent is adding, so the not-in-profile slice gets
           top billing. The in-profile tab exists for the user to see
           what's already attributed, but its checkboxes are disabled
           (only ADDITIONS, no removals — removals live on the works
           list itself). -->
      <div v-if="!isSearching && results.length > 0" class="search-results">
        <v-tabs
          v-model="selectedTab"
          density="compact"
          class="aws-tabs"
          color="primary"
        >
          <v-tab value="not">
            Not in profile ({{ notInProfileResults.length }})
          </v-tab>
          <v-tab value="in" :disabled="inProfileResults.length === 0">
            Already in profile ({{ inProfileResults.length }})
          </v-tab>
        </v-tabs>

        <!-- Per-tab empty state: every match was already on profile.
             Only relevant on the not-in-profile tab — the in-profile
             tab is disabled when its count is 0, so the user can't
             land on an empty in-profile view. -->
        <div
          v-if="selectedTab === 'not' && currentTabResults.length === 0"
          class="text-body-2 text-medium-emphasis pa-4"
        >
          <v-icon size="18" class="mr-1">mdi-check-circle-outline</v-icon>
          All {{ results.length }} matching works are already in your profile. Try a different search to find more.
        </div>

        <div
          v-for="work in visibleResults"
          :key="work.id"
          class="search-result-item"
          :class="{
            'search-result-item--selected': work._isSelected,
          }"
        >
          <div class="d-flex align-start">
            <!-- Checkbox. Disabled on in-profile rows — the dialog is
                 add-only; removals happen on the works list. -->
            <v-checkbox
              v-model="work._isSelected"
              hide-details
              density="compact"
              class="search-result-checkbox mt-0 pt-0 mr-2"
              :disabled="work._alreadyOnProfile"
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

        <!-- Top-N overshoot hint (oxjob #240 Phase 3.3): a leg overshot
             MAX_PREFETCH_PER_LEG. Only relevant on the Not-in-profile
             tab — the In-profile tab is read-only review, "try a more
             specific search to find others" doesn't apply there. -->
        <div
          v-if="overshootHint && !hasMore && selectedTab === 'not'"
          class="results-footer-hint text-caption text-medium-emphasis"
        >
          Showing the top {{ MAX_PREFETCH_PER_LEG }} results. Try a more specific search to find others.
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
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { urlBase } from '@/apiConfig';
import {
  nameTokens,
  detectSearchType,
  buildLadderFilterValue,
  findMatchedAuthorship,
  computeFullMatchCount,
  isAlreadyOnProfile,
  mergeSortPreflight,
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

const PAGE_SIZE = 25;
// Phase 3 (oxjob #240): pre-fetch all pages of each leg up to this cap,
// then sort once and paginate client-side. Beyond this point, the
// common-name / overshoot hints tell the user to refine — more results
// won't help because they won't scroll past the top of a sorted-by-tier
// list anyway.
const MAX_PREFETCH_PER_LEG = 100;
// Phase 2 ladder: progressively widen the name-search query until the API
// reports ≥ COUNT_THRESHOLD hits (cap at LADDER_STEPS rungs). Each rung is
// ONE OR'd-phrase request — see oxjob #240 PLAN.md for the locked spec.
const LADDER_STEPS = 5;
const COUNT_THRESHOLD = 100;
const COMMON_NAME_THRESHOLD = 1000;

const searchQuery = ref('');
const results = ref([]);
const visibleCount = ref(PAGE_SIZE);
const isSearching = ref(false);
const hasSearched = ref(false);
const alreadyOnProfile = ref(false);
const bodyEl = ref(null);
// Phase 4 (oxjob #240): which tab is active — 'not' = works NOT yet on
// the user's profile (default, the add-flow target), 'in' = works
// already on profile (read-only review surface). Reset to 'not' on each
// new search.
const selectedTab = ref('not');

// Phase 4 follow-up (oxjob #240, 2026-05-28): live progress log shown
// in place of a skeleton loader during isSearching. Each call to
// `logStep` appends a {id, text} entry; the template renders them as
// a stacked thinking-trace list with the latest entry highlighted.
// `nextLogId` is just a monotonically increasing key for v-for so
// Vue can animate appends cleanly.
const searchLog = ref([]);
let nextLogId = 0;
function logStep(text) {
  searchLog.value.push({ id: nextLogId++, text });
}

// "<typed name> is a very common name" hint shown above results when step 1
// of the ladder returns > COMMON_NAME_THRESHOLD hits.
const commonNameHint = ref('');
// "Showing top 100 — refine for more" — set when either leg's reported
// total exceeds the MAX_PREFETCH_PER_LEG cap. Mutually-exclusive with
// commonNameHint; the template prefers the more-specific common-name hint.
const overshootHint = ref(false);

// Used by transformWork — set inside doSearch before tagging.
let matchName = '';
let authorShortId = '';

// Phase 4: results are partitioned by `_alreadyOnProfile` into two
// tabs; `visibleResults` paginates the active tab's slice. The full
// merged `results` array stays the source of truth (selections persist
// across tab switches — though in-profile rows can't actually be
// selected since their checkboxes are disabled).
const notInProfileResults = computed(() =>
  results.value.filter(w => !w._alreadyOnProfile)
);
const inProfileResults = computed(() =>
  results.value.filter(w => w._alreadyOnProfile)
);
const currentTabResults = computed(() =>
  selectedTab.value === 'in' ? inProfileResults.value : notInProfileResults.value
);
const visibleResults = computed(() =>
  currentTabResults.value.slice(0, visibleCount.value)
);
const hasMore = computed(() => visibleCount.value < currentTabResults.value.length);

const selectedWorksCount = computed(() =>
  results.value.filter(w => w._isSelected).length
);

// Switching tabs resets the client pagination + scrolls the body back
// to the top (otherwise the user lands halfway down a different list).
watch(selectedTab, () => {
  visibleCount.value = PAGE_SIZE;
  nextTick(() => {
    if (bodyEl.value) bodyEl.value.scrollTop = 0;
  });
});

function clampText(s, max) {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

// Pick which authorship to display for a row and stamp the Phase 3
// sort-key fields onto it.
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
  // Phase 3 sort-key tagging
  work._alreadyOnProfile = isAlreadyOnProfile(work, authorShortId);
  const qTokens = source === 'name'
    ? nameTokens(matchName)
    : nameTokens(props.authorName);
  work._fullMatchCount = computeFullMatchCount(a, qTokens);
  work._relevanceScore = work.relevance_score || 0;
  return work;
}

function transformWorks(rawResults, source) {
  return rawResults.map(w => transformWork(w, source)).filter(Boolean);
}

// Pre-fetch pages 2..N of a leg, capped at MAX_PREFETCH_PER_LEG total
// rows. Page 1 is fetched separately (it's the threshold-gate check for
// the name leg, and the count-discovery hop for the title leg). Failures
// on individual pages are swallowed — partial results are better than
// no results, and the leg's "top N" framing already implies some
// trimming is fine.
async function fetchRestPages(baseUrl, total) {
  const desired = Math.min(total, MAX_PREFETCH_PER_LEG);
  const totalPages = Math.ceil(desired / PAGE_SIZE);
  if (totalPages <= 1) return [];
  const requests = [];
  for (let p = 2; p <= totalPages; p++) {
    requests.push(
      axios
        .get(`${baseUrl}&per_page=${PAGE_SIZE}&page=${p}`)
        .then(r => r.data.results || [])
        .catch(e => {
          console.error(`Pre-fetch page ${p} failed for ${baseUrl}:`, e);
          return [];
        })
    );
  }
  const pages = await Promise.all(requests);
  return pages.flat();
}

async function doSearch() {
  const query = searchQuery.value?.trim();
  if (!query) return;

  isSearching.value = true;
  hasSearched.value = true;
  alreadyOnProfile.value = false;
  commonNameHint.value = '';
  overshootHint.value = false;
  results.value = [];
  visibleCount.value = PAGE_SIZE;
  selectedTab.value = 'not';
  searchLog.value = [];

  try {
    const detected = detectSearchType(query);
    matchName =
      (detected.type === 'author_name' ? detected.value : props.authorName) ||
      props.authorName;
    authorShortId = props.authorId
      .replace('https://openalex.org/', '')
      .toUpperCase();

    if (detected.type === 'doi' || detected.type === 'openalex_id') {
      logStep(detected.type === 'doi' ? `Looking up DOI ${detected.value}` : `Looking up work ${detected.value}`);
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
      // Paratext (issue covers, TOCs) is filter-excluded on search paths;
      // drop it here too so a user pasting a paratext DOI gets the same
      // "not found" UX rather than a stuck-curation later. Drop first so
      // the alreadyOnProfile signal isn't triggered by a paratext-only
      // result.
      rawResults = rawResults.filter(work => work.type !== 'paratext');
      // For an explicit DOI/ID lookup, "already on your profile" is the
      // clearer UX than dim-with-badge — the user expected this specific
      // work, so tell them outright.
      const before = rawResults.length;
      rawResults = rawResults.filter(
        work => !isAlreadyOnProfile(work, authorShortId)
      );
      if (rawResults.length === 0 && before > 0) alreadyOnProfile.value = true;
      results.value = transformWorks(rawResults, 'doi');
      return;
    }

    // Text query — Phase 3 (oxjob #240): walk the ladder to PICK the leg
    // URL, then pre-fetch ALL pages of both name + title legs (capped at
    // MAX_PREFETCH_PER_LEG) in parallel, merge, sort once, and reveal
    // client-side. URLs no longer carry the
    // `authorships.author.id:!<me>` exclusion — already-on-profile rows
    // are kept and sorted to the bottom with a dimmed badge (Google
    // Scholar UX). #187 client name gate still runs first via
    // transformWork's findMatchedAuthorship check.
    const tokenCount = query.split(/\s+/).filter(Boolean).length;

    // Title leg: fire page 1 in parallel with the ladder walk.
    // type:!paratext excluded for the reason documented in the DOI branch.
    let titleLeg = { url: null, total: 0, page1Results: [] };
    let titlePromise = null;
    if (tokenCount >= MIN_TITLE_SEARCH_WORDS) {
      logStep(`Searching titles for "${query}"`);
      titleLeg.url = `${urlBase.api}/works?filter=title.search:${encodeURIComponent(query)},type:!paratext&include_xpac=true`;
      titlePromise = axios
        .get(`${titleLeg.url}&per_page=${PAGE_SIZE}&page=1`)
        .then(r => ({ ok: true, resp: r }))
        .catch(e => ({ ok: false, error: e }));
    }

    // Name ladder. Only fire when the query was classified as a person
    // name. Without this gate, title-shaped queries (e.g. "the state of
    // oa") would advance to step 3's first-initial form `"t oa"` and
    // dump garbage authorship matches into the merged stream. oxjob
    // #240 follow-up (2026-05-25).
    let nameLeg = { url: null, total: 0, page1Results: [] };
    if (detected.type === 'author_name') {
      const tokens = nameTokens(query);
      let lastFilterValue = null;
      let step1Count = -1;
      for (let step = 1; step <= LADDER_STEPS; step++) {
        const filterValue = buildLadderFilterValue(tokens, step);
        if (!filterValue) break;
        if (filterValue === lastFilterValue) continue;
        lastFilterValue = filterValue;

        // User-facing log: paraphrase what each ladder step is doing
        // so the user understands the multi-search nature. Keep these
        // short — they appear stacked under each other during the
        // ~1-3s the multi-step search takes. (oxjob #240, 2026-05-28.)
        const ladderLabel = {
          1: `Searching for author "${query}"`,
          2: 'Trying name variants',
          3: 'Trying initial-only forms',
          4: 'Allowing flexible word order',
          5: 'Allowing more variations',
        }[step];
        if (ladderLabel) logStep(ladderLabel);

        const url = `${urlBase.api}/works?filter=raw_author_name.search:${encodeURIComponent(filterValue)},type:!paratext&include_xpac=true`;
        let resp;
        try {
          resp = await axios.get(`${url}&per_page=${PAGE_SIZE}&page=1`);
        } catch (e) {
          console.error(`Ladder step ${step} error:`, e);
          continue;
        }

        const count = resp.data.meta?.count || 0;
        if (step1Count < 0) step1Count = count;
        // Latest fired step becomes the pre-fetch source. Earlier steps'
        // result sets are strict subsets, so pre-fetching only the final
        // step covers everything visible.
        nameLeg.url = url;
        nameLeg.total = count;
        nameLeg.page1Results = resp.data.results || [];

        if (count >= COUNT_THRESHOLD) break;
      }

      if (step1Count > COMMON_NAME_THRESHOLD) {
        commonNameHint.value = query.trim();
      }
    }

    // Resolve title leg's page 1.
    if (titlePromise) {
      const r = await titlePromise;
      if (r.ok) {
        titleLeg.total = r.resp.data.meta?.count || 0;
        titleLeg.page1Results = r.resp.data.results || [];
      } else {
        console.error('Title search error:', r.error);
      }
    }

    // Pre-fetch pages 2..N for both legs in parallel.
    const needsPrefetch =
      (nameLeg.url && nameLeg.total > PAGE_SIZE) ||
      (titleLeg.url && titleLeg.total > PAGE_SIZE);
    if (needsPrefetch) logStep('Loading top matches…');

    const [nameRest, titleRest] = await Promise.all([
      nameLeg.url ? fetchRestPages(nameLeg.url, nameLeg.total) : [],
      titleLeg.url ? fetchRestPages(titleLeg.url, titleLeg.total) : [],
    ]);

    const nameRows = transformWorks(
      [...nameLeg.page1Results, ...nameRest],
      'name'
    );
    const titleRows = transformWorks(
      [...titleLeg.page1Results, ...titleRest],
      'title'
    );

    if (
      !commonNameHint.value &&
      (nameLeg.total > MAX_PREFETCH_PER_LEG ||
        titleLeg.total > MAX_PREFETCH_PER_LEG)
    ) {
      overshootHint.value = true;
    }

    results.value = mergeSortPreflight(nameRows, titleRows, detected.type);
    visibleCount.value = PAGE_SIZE;
  } catch (err) {
    console.error('Work search error:', err);
    results.value = [];
  } finally {
    isSearching.value = false;
  }
}

// Synchronous reveal — no network, no re-sort. Phase 3 invariant
// ("scroll never re-orders rows") relies on this. Phase 4: cap against
// the active tab's count, not the full merged set.
function loadMore() {
  if (!hasMore.value) return;
  visibleCount.value = Math.min(
    visibleCount.value + PAGE_SIZE,
    currentTabResults.value.length
  );
}

function onBodyScroll() {
  const el = bodyEl.value;
  if (!el || !hasMore.value) return;
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
  overshootHint.value = false;
  visibleCount.value = PAGE_SIZE;
  selectedTab.value = 'not';
  searchLog.value = [];
}

// Auto-search on open with the profile's display name (Google Scholar
// UX — opening the dialog should immediately show the user what kinds
// of works are findable). Parent AddWorksModal bumps `instanceKey` on
// every open, which remounts this component, so this fires once per
// dialog session. (oxjob #240, 2026-05-25.)
onMounted(() => {
  if (props.authorName?.trim()) {
    searchQuery.value = props.authorName.trim();
    doSearch();
  }
});
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

/* Phase 4 (oxjob #240): tabs separate already-on-profile rows from
   not-on-profile rows, so the per-row dim + IN PROFILE tag are gone —
   the tab labels carry that signal at the column level instead. */
.aws-tabs {
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
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

/* Search progress log (Phase 4 follow-up, 2026-05-28). Each entry
   is a short line of text with a leading icon; the latest entry is
   rendered at full emphasis with a small dot, past entries fade
   back with a check. Entries fade in from above via the `log-`
   transition classes. */
.search-log {
  padding: 4px 0 16px;
}

.search-log-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 13px;
  line-height: 1.4;
  transition: opacity 0.25s ease;
}

.search-log-entry--past {
  color: rgba(0, 0, 0, 0.45);
}

.search-log-entry--current {
  color: rgba(0, 0, 0, 0.78);
  font-weight: 500;
}

.search-log-icon {
  flex-shrink: 0;
}

.search-log-entry--past .search-log-icon {
  color: rgba(76, 175, 80, 0.75);
}

.search-log-entry--current .search-log-icon {
  color: rgba(0, 0, 0, 0.55);
}

.log-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.log-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.log-leave-active {
  transition: opacity 0.15s ease;
}

.log-leave-to {
  opacity: 0;
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

.aws-hint {
  padding: 8px 12px;
  background: rgba(33, 150, 243, 0.06);
  border-left: 3px solid rgba(33, 150, 243, 0.5);
  border-radius: 2px;
  line-height: 1.5;
}

/* End-of-list note for the top-N overshoot. Deliberately plain — no
   info-box chrome, no icon — because the user only encounters it
   after scrolling to the bottom of the list, and at that point a
   subtle "here's what's going on" line reads better than a styled
   alert. */
.results-footer-hint {
  padding: 20px 16px 4px;
  text-align: center;
  line-height: 1.5;
}
</style>
