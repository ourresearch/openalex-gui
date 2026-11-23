<template>
  <!-- oxjob #2540: the reviews linked to this work. Nothing shows for a work with
       none: an empty list would read as "never reviewed", and it only means no
       review is linked yet. Fetched in the browser (record pages render on the
       server without API calls). EntityNew keys this by work id, so a new work
       mounts a fresh list. -->
  <div v-if="rows.length">
    <span class="font-weight-bold">{{ reviewsHeading(rows.length) }}:</span>
    <ul class="work-reviews-list">
      <li v-for="row in shownRows" :key="row.id">
        <router-link :to="filters.entityZoomLink(row.id)">{{ row.title }}</router-link>
        <span v-if="row.meta" class="text-medium-emphasis"> ({{ row.meta }})</span>
      </li>
    </ul>
    <!-- Same inline toggle as the authors row (EntityDatumRow). -->
    <button
      v-if="rows.length > REVIEWS_SHOWN"
      type="button"
      class="work-reviews-toggle font-weight-bold text-primary"
      :aria-expanded="showAll ? 'true' : 'false'"
      @click="showAll = !showAll"
    >
      <template v-if="showAll">(less)</template>
      <template v-else>show all {{ rows.length.toLocaleString('en-US') }}</template>
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api';
import filters from '@/filters';
import { REVIEWS_SHOWN, linksParams, reviewRows, reviewWorkIds, reviewWorksParams, reviewsHeading } from '@/workReviews';

defineOptions({ name: 'WorkReviews' });

const props = defineProps({
  work: Object,
});

const rows = ref([]);
const showAll = ref(false);
const shownRows = computed(() => (showAll.value ? rows.value : rows.value.slice(0, REVIEWS_SHOWN)));

// Browser only: on the server the API call would stay pending (src/api.js pendingOnServer).
onMounted(async () => {
  try {
    const ids = reviewWorkIds(await api.get('/links', linksParams(props.work.id)));
    if (ids.length) rows.value = reviewRows(ids, await api.get('/works', reviewWorksParams(ids)));
  } catch (e) {
    // The list is extra: a failed lookup leaves the rest of the page as it is.
    console.warn('[work reviews] lookup failed', e?.message || e);
  }
});
</script>

<style scoped>
.work-reviews-list {
  list-style: none;
  padding-left: 0;
  margin: 2px 0 0 0;
}
.work-reviews-list li {
  padding: 1px 0;
}
.work-reviews-toggle {
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;
}
.work-reviews-toggle:hover {
  text-decoration: underline;
}
</style>
