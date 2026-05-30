import { computed } from 'vue';
import { useStore } from 'vuex';

// Shared "select all on this page" master-checkbox logic, used by both the
// list view (SelectionToolbar) and the table view (ResultsTable header), so
// the two stay in lockstep. The master checkbox is checked when every loaded
// row is selected, indeterminate when only some are.
export function useMasterSelection() {
  const store = useStore();

  const masterState = computed(() => store.getters['selection/masterState']);
  const masterChecked = computed(
    () => masterState.value === 'all-loaded' || masterState.value === 'all-set'
  );
  const masterIndeterminate = computed(() => masterState.value === 'some');

  function onMasterClick() {
    const s = masterState.value;
    if (s === 'all-loaded' || s === 'all-set') {
      store.commit('selection/deselectAllOnPage');
    } else {
      store.commit('selection/selectAllOnPage');
    }
  }

  return { masterState, masterChecked, masterIndeterminate, onMasterClick };
}
