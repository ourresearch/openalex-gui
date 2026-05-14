import { watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

// View-only query params that shouldn't reset selection when toggled
// (e.g. the /works drawer uses `?zoom=`, the work entity page uses `?tab=`).
const VIEW_ONLY_QUERY_KEYS = new Set(['zoom', 'tab', 'view', 'data-version']);

function buildContextKey(route) {
  const meaningful = Object.entries(route.query)
    .filter(([k]) => !VIEW_ONLY_QUERY_KEYS.has(k))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `${route.path}?${meaningful}`;
}

// Publishes the loaded ids + total count of a results object into the
// `selection` Vuex module. Reactive — call once with a getter or ref
// returning the current results object.
export function useSelectionContext(resultsObjectGetter) {
  const store = useStore();
  const route = useRoute();

  watch(
    resultsObjectGetter,
    (resultsObject) => {
      const ids = (resultsObject?.results || []).map(r => r.id).filter(Boolean);
      store.commit('selection/setContext', {
        contextKey: buildContextKey(route),
        totalCount: resultsObject?.meta?.count || 0,
      });
      store.commit('selection/setLoadedIds', ids);
    },
    { immediate: true }
  );
}
