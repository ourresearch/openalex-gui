import { watch } from 'vue';

// The list/table view follows the SERP mode (Basic = list, Advanced/OQL = table), and
// Serp.vue's results fetch keys on that view, because list and table have different page
// sizes (#1576). If the mode reads one way while a fetch is loading and another once it
// has settled, that wiring never stops: fetch -> loading -> mode flips -> page size
// changes -> refetch -> loading -> ... In a production build Vue has no recursion limit,
// so the tab froze and grew past 1 GB (oxjob #1694).
//
// So after its first write the view follows the mode only while no fetch is loading; a
// mode change during a load is applied once it settles. The first write stays immediate,
// so a first load in Advanced still starts its table-size fetch at once (#1576).
//
// mode: ref/computed/getter of 'basic' | 'advanced' | 'oql'; isLoading: getter;
// setView(view): writes 'list' | 'table'. Returns the watcher's stop handle.
export function mirrorModeToResultsView(mode, isLoading, setView) {
  let first = true;
  return watch([mode, isLoading], ([m, loading]) => {
    if (loading && !first) return;
    first = false;
    setView(m === 'basic' ? 'list' : 'table');
  }, { immediate: true });
}
