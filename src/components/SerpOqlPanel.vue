<template>
  <!-- Read-only "Show as OQL" panel (oxjob #346). Renders the current SERP query
       as OQL v2.1 by asking the server's /query endpoint to translate the live
       oxurl (entity + filter + sort). Render-only: there is intentionally no way
       to submit OQL back from here (editing is later work — needs the parser +
       validation surface). Shown only behind the `OQL` feature flag. -->
  <v-card variant="outlined" class="bg-white mb-4 px-3 py-2">
    <div class="d-flex align-center mb-1">
      <span class="text-overline text-medium-emphasis" style="letter-spacing: 0.08em;">OQL</span>
      <v-spacer />
      <v-tooltip text="Copy OQL" location="bottom">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            size="x-small"
            variant="text"
            :disabled="!oql"
            aria-label="Copy OQL"
            @click="copyOql"
          >
            <v-icon size="18" color="grey-darken-1">mdi-content-copy</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="d-flex align-center text-medium-emphasis text-body-2 py-1">
      <v-progress-circular indeterminate size="14" width="2" class="mr-2" />
      Rendering…
    </div>

    <!-- Error (translation failed) -->
    <div v-else-if="error" class="d-flex align-start text-error text-body-2 py-1">
      <v-icon size="16" class="mr-1 mt-1" color="error">mdi-alert-circle-outline</v-icon>
      <span>{{ error }}</span>
    </div>

    <!-- OQL render (read-only). OQL reads as a sentence, so plain text, not code. -->
    <div v-else-if="oql" class="oql-text text-body-2">{{ oql }}</div>

    <div v-else class="text-medium-emphasis text-body-2 py-1">No query.</div>
  </v-card>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

defineOptions({ name: 'SerpOqlPanel' });

const store = useStore();
const route = useRoute();

const entityType = computed(() => store.getters.entityType);
const filter = computed(() => route.query.filter || null);
const sort = computed(() => route.query.sort || null);

const queryObject = computed(() => store.getters.queryObject);
const loading = computed(() => store.getters.queryObjectLoading);
const error = computed(() => store.getters.queryObjectError);
const oql = computed(() => queryObject.value?.oql || '');

function refresh() {
  store.dispatch('fetchQueryObject', {
    entityType: entityType.value,
    filter: filter.value,
    sort: sort.value,
  });
}

const snackbar = (val) => store.commit('snackbar', val);
async function copyOql() {
  if (!oql.value) return;
  await navigator.clipboard.writeText(oql.value);
  snackbar('OQL copied to clipboard.');
}

// Re-render whenever the live query changes (entity, filter, or sort).
watch([entityType, filter, sort], refresh);
onMounted(refresh);
</script>

<style scoped>
.oql-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}
</style>
