// The results page's order (oxjob #1658): one order, set from the sort menu or a column
// header, read back from the echo. On a `/q?oql=` page the store runs it inside the OQO and
// writes the echoed OQL, which ends with the order's words, into the link. On a
// `/works?filter=` link it rides as `sort=`, which the API reads into the query. Either way
// the store's `sort` is the echo's order (query.store.js syncFromResponse), so it is what
// the headers show.
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { url } from '@/url';

export function useQueryOrder() {
  const store = useStore();
  const route = useRoute();
  // a `/q?oql=` page under the oql flag: edits go through the canonical query store
  const inOqlMode = computed(() => !!store.getters.featureFlags['oql'] && !!route.query.oql);
  const sortBy = computed(() => store.state.query?.sort || []);

  function setOrder(order) {
    if (inOqlMode.value) store.dispatch('query/setSortBy', { sortBy: order });
    else url.setSortBy(order);
  }
  return { inOqlMode, sortBy, setOrder };
}
