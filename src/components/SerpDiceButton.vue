<!--
  Admin-only "random real query" dice (oxjob #369).

  Clicking the dice fetches a random *real* day-to-day GUI search of the
  current SERP's entity type (works -> works, authors -> authors, …) from the
  api-proxy's Cloudflare Analytics Engine log (via the admin-gated users-api
  endpoint /admin/random-query) and navigates the page in place to those
  results. A dropdown caret exposes a min-complexity control ("at least N
  filter leaves"), using the same oqoLeafCount metric as the OQL playground —
  computed client-side via the canonical URL->OQO converter (oxjob #372).

  Privacy: the endpoint returns only the query (filter/sort/search) — never any
  user identity — and the button is hidden for non-admins.
-->
<template>
  <span v-if="isAdmin" class="d-inline-flex align-center">
    <!-- Dice: draw a random query -->
    <v-tooltip text="Random real query" location="bottom" aria-label="Random real query">
      <template #activator="{ props }">
        <v-btn
          icon
          variant="text"
          v-bind="props"
          :loading="loading"
          aria-label="Random real query"
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
      <v-card min-width="280" rounded>
        <v-card-text>
          <div class="text-subtitle-2 mb-1">Minimum complexity</div>
          <div class="text-caption text-medium-emphasis mb-3">
            Only draw queries with at least this many filter leaves
            (OQO leaves, like the OQL playground). 0 = any.
          </div>
          <v-text-field
            v-model.number="minComplexity"
            type="number"
            min="0"
            density="compact"
            variant="outlined"
            hide-details
            label="Min. leaves"
            style="max-width: 140px"
            @keyup.enter="closeAndRoll"
          />
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
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';

import { urlBase, axiosConfig } from '@/apiConfig';
import { oqoLeafCount } from '@/oqlCorpusMetrics';

defineOptions({ name: 'SerpDiceButton' });

const store = useStore();
const router = useRouter();

const isAdmin = computed(() => store.getters['user/isAdmin']);
const entityType = computed(() => store.getters.entityType);
const snackbar = (val) => store.commit('snackbar', val);

const BATCH = 40;
const MAX_BATCHES = 4; // re-roll windows when hunting for high complexity
const MAX_COMPLEXITY_CHECKS = 24; // cap converter round-trips per roll (bounds the spinner)
const STORAGE_KEY = 'diceMinComplexity';

const loading = ref(false);
const isMenuOpen = ref(false);
const minComplexity = ref(loadMinComplexity());

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

// Fetch one batch of candidate queries (ranked high-complexity first) from the
// admin-gated users-api endpoint.
async function fetchBatch() {
  const resp = await axios.get(
    `${urlBase.userApi}/admin/random-query`,
    { ...axiosConfig({ userAuth: true }), params: { entity_type: entityType.value, batch: BATCH } },
  );
  return resp.data?.candidates || [];
}

// Accurate leaf count for a candidate: build its full oxurl (filter+sort+search)
// and run it through the canonical URL->OQO converter (oxjob #372), then
// oqoLeafCount. Returns null if it can't be translated.
async function complexityOf(candidate) {
  try {
    const qs = new URLSearchParams(candidate).toString();
    const oxurl = `${entityType.value}?${qs}`;
    const resp = await axios.get(
      `${urlBase.api}/query/oxurl/${encodeURIComponent(oxurl)}`,
      axiosConfig(),
    );
    return oqoLeafCount(resp.data?.oqo);
  } catch (e) {
    return null;
  }
}

function navigateTo(candidate) {
  // In-place navigation: same SERP, swap the query. Vuetify/Vue-router encodes.
  router.push({ path: `/${entityType.value}`, query: { ...candidate } });
}

async function rollDice() {
  if (loading.value) return;
  const minC = persistMinComplexity();
  loading.value = true;
  try {
    let chosen = null;
    const batches = minC > 0 ? MAX_BATCHES : 1;
    // Budget the per-roll converter calls so an unsatisfiable min-complexity
    // can't spin for dozens of sequential round-trips before giving up.
    let checksLeft = MAX_COMPLEXITY_CHECKS;
    for (let b = 0; b < batches && !chosen; b++) {
      const candidates = await fetchBatch();
      if (!candidates.length) continue;
      if (minC <= 0) {
        chosen = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        // Candidates are already ranked by descending filter-comma-count, so
        // the gnarly ones come first — usually the first call qualifies.
        for (const c of candidates) {
          if (checksLeft <= 0) break;
          checksLeft--;
          const leaves = await complexityOf(c);
          if (leaves != null && leaves >= minC) { chosen = c; break; }
        }
        if (checksLeft <= 0) break;
      }
    }
    if (chosen) {
      navigateTo(chosen);
    } else if (minC > 0) {
      snackbar(`No query found with ≥ ${minC} filter leaves — try a lower complexity.`);
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
