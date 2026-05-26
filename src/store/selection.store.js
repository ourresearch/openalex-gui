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
  state: defaultState,
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
    // Master-checkbox "select all on this page" — unions loadedIds into
    // selectedIds so selections from prior pages are preserved. In
    // selectAllMode (where all N are conceptually selected), this removes
    // this page's ids from excludedIds.
    selectAllOnPage(state) {
      if (state.selectAllMode) {
        const loaded = new Set(state.loadedIds);
        state.excludedIds = state.excludedIds.filter(id => !loaded.has(id));
        return;
      }
      const set = new Set(state.selectedIds);
      for (const id of state.loadedIds) set.add(id);
      state.selectedIds = [...set];
    },
    // Master-checkbox "deselect all on this page" — removes only this
    // page's ids from selectedIds (or adds them to excludedIds in
    // selectAllMode). Does NOT wipe selections from other pages; use
    // deselectAll for that.
    deselectAllOnPage(state) {
      if (state.selectAllMode) {
        const set = new Set(state.excludedIds);
        for (const id of state.loadedIds) set.add(id);
        state.excludedIds = [...set];
        return;
      }
      const loaded = new Set(state.loadedIds);
      state.selectedIds = state.selectedIds.filter(id => !loaded.has(id));
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
    // Page-scoped: reflects whether items ON THIS PAGE are selected. A page
    // 2 user who selected items on page 1 sees an "unselected" master here
    // unless they also picked items on page 2.
    masterState: (state) => {
      const loaded = state.loadedIds;
      if (state.selectAllMode) {
        if (loaded.length === 0) {
          return state.excludedIds.length === 0 ? 'all-set' : 'some';
        }
        const excluded = new Set(state.excludedIds);
        let excludedOnPage = 0;
        for (const id of loaded) if (excluded.has(id)) excludedOnPage++;
        if (excludedOnPage === 0) return 'all-set';
        if (excludedOnPage < loaded.length) return 'some';
        return 'none';
      }
      if (loaded.length === 0) {
        return state.selectedIds.length === 0 ? 'none' : 'some';
      }
      const selected = new Set(state.selectedIds);
      let selectedOnPage = 0;
      for (const id of loaded) if (selected.has(id)) selectedOnPage++;
      if (selectedOnPage === 0) return 'none';
      if (selectedOnPage < loaded.length) return 'some';
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
