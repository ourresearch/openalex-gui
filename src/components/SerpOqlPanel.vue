<template>
  <!-- "Show / edit as OQL" panel (oxjob #346 read-only render + #373 submit).
       Renders the current SERP query as OQL v2.1, and lets you edit + submit OQL
       to run it (Option B: the server executes it and we hydrate results from the
       response). URL-expressible queries upgrade to the normal /works?filter=…
       route so chips render; more expressive (nested boolean) queries run and
       show results with an "advanced query" badge. Behind the `oql` flag. -->
  <v-card variant="outlined" class="bg-white mb-4 px-3 py-2">
    <div class="d-flex align-center mb-1">
      <span class="text-overline text-medium-emphasis" style="letter-spacing: 0.08em;">OQL</span>
      <v-chip
        v-if="isAdvanced"
        size="x-small"
        color="deep-purple"
        variant="tonal"
        class="ml-2"
      >advanced query</v-chip>
      <v-spacer />
      <v-tooltip text="Copy OQL" location="bottom">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            size="x-small"
            variant="text"
            :disabled="!currentOql"
            aria-label="Copy OQL"
            @click="copyOql"
          >
            <v-icon size="18" color="grey-darken-1">mdi-content-copy</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </div>

    <!-- Loading (read-path translation) -->
    <div v-if="loading" class="d-flex align-center text-medium-emphasis text-body-2 py-1">
      <v-progress-circular indeterminate size="14" width="2" class="mr-2" />
      Rendering…
    </div>

    <template v-else>
      <!-- Editable OQL -->
      <v-textarea
        v-model="draft"
        variant="outlined"
        density="compact"
        rows="2"
        auto-grow
        hide-details
        class="oql-textarea text-body-2 mb-2"
        placeholder="works where …"
        :disabled="submitting"
        @keydown.ctrl.enter="submitOql"
        @keydown.meta.enter="submitOql"
      />

      <!-- Read-path translation error (rendering the live query failed) -->
      <div v-if="error && !route.query.oql" class="d-flex align-start text-error text-body-2 mb-2">
        <v-icon size="16" class="mr-1 mt-1" color="error">mdi-alert-circle-outline</v-icon>
        <span>{{ error }}</span>
      </div>

      <!-- Submit-path errors (parse/validation), with position when present -->
      <div v-if="submitErrors.length" class="mb-2">
        <div
          v-for="(e, i) in submitErrors"
          :key="i"
          class="d-flex align-start text-error text-body-2"
        >
          <v-icon size="16" class="mr-1 mt-1" color="error">mdi-alert-circle-outline</v-icon>
          <span>
            {{ e.message }}<span v-if="e.position != null" class="text-medium-emphasis"> (position {{ e.position }})</span>
          </span>
        </div>
      </div>

      <div v-if="isAdvanced" class="text-medium-emphasis text-caption mb-2">
        This query is more expressive than the filter chips can show — results are
        live, but it can’t be edited as chips.
      </div>

      <div class="d-flex align-center">
        <v-spacer />
        <v-btn
          color="primary"
          size="small"
          variant="flat"
          :loading="submitting"
          :disabled="!draft || !draft.trim()"
          @click="submitOql"
        >Run OQL</v-btn>
      </div>
    </template>
  </v-card>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

import { url } from '@/url';

defineOptions({ name: 'SerpOqlPanel' });

const store = useStore();
const route = useRoute();
const router = useRouter();

const entityType = computed(() => store.getters.entityType);

// The API query params that define the query for OQL purposes: filter, sort, and
// every search variant. (Page size / view / group_by are GUI-only and excluded.)
const QUERY_KEYS = [
  'filter', 'sort',
  'search', 'search.exact', 'search.semantic',
  'search.title', 'search.title.exact',
  'search.title_and_abstract', 'search.title_and_abstract.exact',
];
const queryParams = computed(() => {
  const q = {};
  for (const k of QUERY_KEYS) {
    if (route.query[k]) q[k] = route.query[k];
  }
  return q;
});

const queryObject = computed(() => store.getters.queryObject);
const loading = computed(() => store.getters.queryObjectLoading);
const error = computed(() => store.getters.queryObjectError);

// The executed query's canonical multi-form (#373), present after an OQL submit.
const resultsObject = computed(() => store.state.resultsObject);
const xQuery = computed(() => resultsObject.value?.meta?.x_query || null);

// "advanced" = an OQL submit whose query isn't URL-expressible (no chips).
const isAdvanced = computed(
  () => !!route.query.oql && xQuery.value != null && xQuery.value.url == null
);

// The OQL to display/seed: when we're in OQL-submit mode use the canonical
// re-render (falling back to what was submitted); otherwise the translated OQL of
// the live chip query.
const currentOql = computed(() => {
  // Both modes display the translate-backed, name-annotated OQL (queryObject).
  // In OQL-submit mode we fall back to the execute response's meta.x_query.oql
  // (now bare-ID, #378 S3) and then the raw submitted text while the translate
  // request is in flight.
  if (route.query.oql) {
    return queryObject.value?.oql || xQuery.value?.oql || route.query.oql || '';
  }
  return queryObject.value?.oql || '';
});

const submitErrors = computed(() => store.getters.oqlSubmitError?.errors || []);

// Editable draft. Re-seed it from currentOql whenever the live query changes
// (user mid-edits are transient until they Run or navigate).
const draft = ref('');
watch(currentOql, (v) => { draft.value = v; }, { immediate: true });

const submitting = computed(() => store.state.isLoading);

function refresh() {
  // OQL-submit mode: translate the EXECUTED OQO (meta.x_query.oqo) to get the
  // name-annotated canonical OQL for display. Names come from this on-demand
  // translate service (decision 14), not the execute response's bare-ID
  // meta.x_query.oql. Wait until the execute response (xQuery) has landed.
  if (route.query.oql) {
    const oqo = xQuery.value?.oqo;
    if (oqo) {
      store.dispatch('fetchQueryObject', { entityType: entityType.value, oqo });
    }
    return;
  }
  store.dispatch('fetchQueryObject', {
    entityType: entityType.value,
    query: queryParams.value,
  });
}

function submitOql() {
  const oql = (draft.value || '').trim();
  if (!oql) return;
  store.commit('setOqlSubmitError', null);
  // Replace the chip query with `?oql=` (drop filter/sort/search so they can't
  // conflict). The Serp watcher executes it and rehydrates.
  url.pushToRoute(router, {
    name: 'Serp',
    params: { entityType: entityType.value },
    query: { oql },
  });
}

const snackbar = (val) => store.commit('snackbar', val);
async function copyOql() {
  if (!currentOql.value) return;
  await navigator.clipboard.writeText(currentOql.value);
  snackbar('OQL copied to clipboard.');
}

// Re-render whenever the live chip query changes (entity or any query param) or,
// in OQL-submit mode, when the executed OQO arrives in the response.
watch(
  [
    entityType,
    () => JSON.stringify(queryParams.value),
    () => JSON.stringify(xQuery.value?.oqo || null),
  ],
  refresh,
);
onMounted(refresh);
</script>

<style scoped>
.oql-textarea :deep(textarea) {
  line-height: 1.5;
  font-family: inherit;
}
</style>
