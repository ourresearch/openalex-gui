// Multi-select state for SERPs and entity-page works lists.
// Selection clears on every route change. "Select all in result set"
// is represented as a mode flag plus an excludedIds set, not as an
// enumerated ID list — bulk-action UIs translate (filter, sort, mode,
// excluded) into an API call rather than enumerating up front.

const defaultState = () => ({
  contextKey: null,
  totalCount: 0,
  loadedIds: [],
  selectedIds: [],
  excludedIds: [],
  selectAllMode: false,
});

export default {
  namespaced: true,
  state: defaultState(),
  mutations: {
    reset(state) {
      Object.assign(state, defaultState());
    },
    setContext(state, { contextKey, totalCount }) {
      if (state.contextKey !== contextKey) {
        Object.assign(state, defaultState());
        state.contextKey = contextKey;
      }
      state.totalCount = totalCount ?? 0;
    },
    setLoadedIds(state, ids) {
      state.loadedIds = ids;
    },
    setTotalCount(state, total) {
      state.totalCount = total ?? 0;
    },
    toggleId(state, id) {
      if (state.selectAllMode) {
        const idx = state.excludedIds.indexOf(id);
        if (idx >= 0) state.excludedIds.splice(idx, 1);
        else state.excludedIds.push(id);
      } else {
        const idx = state.selectedIds.indexOf(id);
        if (idx >= 0) state.selectedIds.splice(idx, 1);
        else state.selectedIds.push(id);
      }
    },
    selectAllOnPage(state) {
      state.selectedIds = [...state.loadedIds];
      state.selectAllMode = false;
      state.excludedIds = [];
    },
    deselectAll(state) {
      state.selectedIds = [];
      state.excludedIds = [];
      state.selectAllMode = false;
    },
    enterSelectAllMode(state) {
      state.selectAllMode = true;
      state.selectedIds = [];
      state.excludedIds = [];
    },
  },
  getters: {
    isSelected: (state) => (id) => {
      if (state.selectAllMode) return !state.excludedIds.includes(id);
      return state.selectedIds.includes(id);
    },
    selectedCount: (state) => {
      if (state.selectAllMode) {
        return Math.max(0, state.totalCount - state.excludedIds.length);
      }
      return state.selectedIds.length;
    },
    // 'none' | 'some' | 'all-loaded' | 'all-set'
    masterState: (state) => {
      const loaded = state.loadedIds.length;
      if (state.selectAllMode) {
        return state.excludedIds.length === 0 ? 'all-set' : 'some';
      }
      const sel = state.selectedIds.length;
      if (sel === 0) return 'none';
      if (sel < loaded) return 'some';
      return 'all-loaded';
    },
    // Banner kinds: null | 'offer-select-all' | 'in-select-all'
    bannerKind: (state, getters) => {
      if (state.selectAllMode) return 'in-select-all';
      if (
        getters.masterState === 'all-loaded' &&
        state.totalCount > state.loadedIds.length
      ) {
        return 'offer-select-all';
      }
      return null;
    },
  },
};
