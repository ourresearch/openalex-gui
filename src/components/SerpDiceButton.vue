<!--
  Admin-only "random real query" dice (oxjob #369).

  Clicking the dice fetches a random *real* day-to-day GUI search of the
  current SERP's entity type (works -> works, authors -> authors, …) from the
  api-proxy's Cloudflare Analytics Engine log (via the admin-gated users-api
  endpoint /admin/random-query) and navigates the page in place to those
  results. A dropdown caret exposes a min-complexity control ("at least N
  filter clauses"); the backend floors the AE sample to that many comma-
  separated filter clauses and the dice picks at random among them (oxjob #369
  Phase 2 — fixes the Phase 1 bug where it "ran out" of high-complexity queries).

  Privacy: the endpoint returns only the query (filter/sort/search) — never any
  user identity — and the button is hidden for non-admins.
-->
<template>
  <span v-if="isAdmin" class="d-inline-flex align-center">
    <!-- Dice: draw a random query (or OQL worked example) -->
    <v-tooltip :text="diceTooltip" location="bottom" :aria-label="diceTooltip">
      <template #activator="{ props }">
        <v-btn
          icon
          variant="text"
          :size="size"
          v-bind="props"
          :loading="loading"
          :aria-label="diceTooltip"
          @click="rollDice"
        >
          <v-icon color="grey-darken-1">mdi-dice-5-outline</v-icon>
        </v-btn>
      </template>
    </v-tooltip>

    <!-- Caret: min-complexity options -->
    <v-menu location="bottom end" :close-on-content-click="false" v-model="isMenuOpen">
      <template #activator="{ props }">
        <v-btn
          icon
          size="x-small"
          variant="text"
          v-bind="props"
          aria-label="Random query options"
          class="dice-caret"
        >
          <v-icon size="18" color="grey-darken-1">mdi-menu-down</v-icon>
        </v-btn>
      </template>
      <v-card min-width="300" rounded>
        <v-card-text>
          <!-- Top-level: which source does the dice draw from? (sticky) -->
          <div class="text-subtitle-2 mb-1">Query source</div>
          <v-select
            v-model="source"
            :items="SOURCE_ITEMS"
            item-title="label"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-3"
          />

          <!-- Random-query mode: min-complexity option -->
          <template v-if="source === 'random'">
            <div class="text-subtitle-2 mb-1">Minimum complexity</div>
            <div class="text-caption text-medium-emphasis mb-3">
              Only draw queries with at least this many filter clauses
              (comma-separated terms). 0 = any.
            </div>
            <v-text-field
              v-model.number="minComplexity"
              type="number"
              min="0"
              density="compact"
              variant="outlined"
              hide-details
              label="Min. clauses"
              style="max-width: 140px"
              @keyup.enter="closeAndRoll"
            />
          </template>

          <!-- OQL-examples mode: no extra options -->
          <template v-else>
            <div class="text-caption text-medium-emphasis">
              Loads a random OQL worked example ({{ OQL_EXAMPLES.length }} available,
              hand-picked for testing) in Advanced/OQL mode.
            </div>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="isMenuOpen = false">Close</v-btn>
          <v-btn variant="flat" color="primary" rounded :loading="loading" @click="closeAndRoll">
            Roll
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </span>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';

import { urlBase, axiosConfig } from '@/apiConfig';
import { url } from '@/url';
import { oqlCorpus } from '@/oqlCorpus';

defineOptions({ name: 'SerpDiceButton' });

defineProps({
  // Optional size for the dice button (e.g. "small" in the compact SERP header).
  // Default undefined → Vuetify's default size (flag-off SerpRightToolbar unchanged).
  size: { type: String, default: undefined },
});

const store = useStore();
const router = useRouter();

const isAdmin = computed(() => store.getters['user/isAdmin']);
const entityType = computed(() => store.getters.entityType);
const snackbar = (val) => store.commit('snackbar', val);

const BATCH = 50;
const MAX_BATCHES = 4; // re-roll windows (each a fresh random time-window server-side)
const STORAGE_KEY = 'diceMinComplexity';
const SOURCE_KEY = 'diceSource';

// Top-level sticky setting: where the dice draws from.
const SOURCE_ITEMS = [
  { label: 'Random queries', value: 'random' },
  { label: 'OQL worked examples', value: 'oql-examples' },
];

// The OQL-examples pool: only valid examples (status==="ok"). All of these carry
// an `oql` string and `oqo.get_rows`, so every one is loadable via the ?oql= path.
const OQL_EXAMPLES = oqlCorpus.filter((e) => e.status === 'ok');

const loading = ref(false);
const isMenuOpen = ref(false);
const minComplexity = ref(loadMinComplexity());
const source = ref(loadSource());

// Persist the source choice immediately so it's sticky across reloads.
watch(source, (val) => localStorage.setItem(SOURCE_KEY, val));

const diceTooltip = computed(() =>
  source.value === 'oql-examples' ? 'Random OQL worked example' : 'Random real query',
);

function loadSource() {
  return localStorage.getItem(SOURCE_KEY) === 'oql-examples' ? 'oql-examples' : 'random';
}

function loadMinComplexity() {
  const raw = parseInt(localStorage.getItem(STORAGE_KEY), 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

function persistMinComplexity() {
  const n = Number(minComplexity.value);
  const clean = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  minComplexity.value = clean;
  localStorage.setItem(STORAGE_KEY, String(clean));
  return clean;
}

// Fetch one batch of candidate queries from the admin-gated users-api endpoint.
// The backend floors the sample to filters with >= minC clauses (when minC > 1)
// and draws from a random time-window, so every batch is a fresh, dense slice
// of real high-complexity queries.
async function fetchBatch(minC) {
  const resp = await axios.get(
    `${urlBase.userApi}/admin/random-query`,
    {
      ...axiosConfig({ userAuth: true }),
      params: { entity_type: entityType.value, batch: BATCH, min_complexity: minC },
    },
  );
  return resp.data?.candidates || [];
}

// Complexity = number of comma-separated filter clauses (same metric the
// backend floors on). Exact, local, no round-trip — closes the small slack in
// the server's LIKE comma-floor (which can match a stray trailing comma).
function clauseCount(candidate) {
  const f = candidate?.filter;
  return f ? f.split(',').length : 0;
}

function navigateTo(candidate) {
  // In-place navigation: same SERP, swap the query. Vuetify/Vue-router encodes.
  router.push({ path: `/${entityType.value}`, query: { ...candidate } });
}

// Load an OQL worked example via the entity-less `/q?oql=` submit path so the SERP
// opens in Advanced/OQL mode and runs it through the OQL pipeline (the example's
// entity rides inside its own OQL, e.g. `works where …`). oqlForUrl collapses the
// corpus's pretty-printed OQL to a single line. .catch swallows the
// NavigationDuplicated rejection when the same example is rolled twice in a row.
// (oxjob #373 Phase 2)
function navigateToExample(example) {
  router
    .push({ name: 'OqlQuery', query: { oql: url.oqlForUrl(example.oql) } })
    .catch(() => {});
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function rollDice() {
  if (loading.value) return;
  if (source.value === 'oql-examples') {
    rollOqlExample();
    return;
  }
  await rollRandomQuery();
}

function rollOqlExample() {
  if (!OQL_EXAMPLES.length) {
    snackbar('No OQL worked examples available.');
    return;
  }
  navigateToExample(pickRandom(OQL_EXAMPLES));
}

async function rollRandomQuery() {
  const minC = persistMinComplexity();
  loading.value = true;
  try {
    let chosen = null;
    // Each batch is a fresh random window server-side; re-roll a few times if a
    // sparse high-complexity window comes up empty. We pick at RANDOM among all
    // qualifiers (not first-by-rank) — that's what makes the dice keep finding
    // new queries instead of repeating the gnarliest one (oxjob #369 Phase 2).
    const batches = minC > 1 ? MAX_BATCHES : 1;
    for (let b = 0; b < batches && !chosen; b++) {
      const candidates = await fetchBatch(minC);
      const qualifying = minC > 1
        ? candidates.filter((c) => clauseCount(c) >= minC)
        : candidates;
      if (qualifying.length) chosen = pickRandom(qualifying);
    }
    if (chosen) {
      navigateTo(chosen);
    } else if (minC > 1) {
      snackbar(`No query found with ≥ ${minC} filter clauses — try a lower complexity.`);
    } else {
      snackbar('No random query found right now — try again.');
    }
  } catch (e) {
    console.error('Random-query dice failed:', e);
    snackbar('Could not load a random query. Please try again.');
  } finally {
    loading.value = false;
  }
}

function closeAndRoll() {
  isMenuOpen.value = false;
  rollDice();
}
</script>

<style scoped>
/* Tuck the caret tight against the dice so they read as one split control. */
.dice-caret {
  margin-left: -10px;
}
</style>
