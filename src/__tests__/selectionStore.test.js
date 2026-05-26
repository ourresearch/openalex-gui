import { createStore } from 'vuex';
import { describe, it, expect, beforeEach } from 'vitest';

import selection from '@/store/selection.store';

const makeStore = () => createStore({ modules: { selection } });

const page1 = ['W1', 'W2', 'W3'];
const page2 = ['W4', 'W5', 'W6'];

describe('selection store — cross-page semantics (#240 Kyle bug, 2026-05-25)', () => {
  let store;

  beforeEach(() => {
    store = makeStore();
    store.commit('selection/setContext', { contextKey: '/works?', totalCount: 1000 });
    store.commit('selection/setLoadedIds', page1);
  });

  it('selectAllOnPage on page 1, then page 2, unions across pages (Kyle: not just page 1)', () => {
    store.commit('selection/selectAllOnPage');
    expect(store.state.selection.selectedIds).toEqual(page1);

    // Navigate to page 2 — same contextKey, just new loadedIds
    store.commit('selection/setContext', { contextKey: '/works?', totalCount: 1000 });
    store.commit('selection/setLoadedIds', page2);
    expect(store.state.selection.selectedIds).toEqual(page1);
    expect(store.getters['selection/masterState']).toBe('none');

    store.commit('selection/selectAllOnPage');
    expect(store.state.selection.selectedIds.sort()).toEqual([...page1, ...page2].sort());
    expect(store.getters['selection/selectedCount']).toBe(6);
    expect(store.getters['selection/masterState']).toBe('all-loaded');
  });

  it('masterState is page-scoped, not total-scoped', () => {
    store.commit('selection/selectAllOnPage');
    expect(store.getters['selection/masterState']).toBe('all-loaded');

    store.commit('selection/setLoadedIds', page2);
    // Page 1 still in selectedIds, but none of page 2 is selected
    expect(store.getters['selection/masterState']).toBe('none');

    store.commit('selection/toggleId', 'W4');
    expect(store.getters['selection/masterState']).toBe('some');
  });

  it('deselectAllOnPage removes only this page from the set', () => {
    store.commit('selection/selectAllOnPage');
    store.commit('selection/setLoadedIds', page2);
    store.commit('selection/selectAllOnPage');
    expect(store.getters['selection/selectedCount']).toBe(6);

    store.commit('selection/deselectAllOnPage');
    expect(store.state.selection.selectedIds.sort()).toEqual(page1.sort());
    expect(store.getters['selection/masterState']).toBe('none');
  });

  it('deselectAll wipes everything across all pages (Clear selection link)', () => {
    store.commit('selection/selectAllOnPage');
    store.commit('selection/setLoadedIds', page2);
    store.commit('selection/selectAllOnPage');
    store.commit('selection/deselectAll');
    expect(store.state.selection.selectedIds).toEqual([]);
    expect(store.getters['selection/selectedCount']).toBe(0);
  });

  it('contextKey change (filter/sort) resets selection across all pages', () => {
    store.commit('selection/selectAllOnPage');
    store.commit('selection/setLoadedIds', page2);
    store.commit('selection/selectAllOnPage');
    expect(store.getters['selection/selectedCount']).toBe(6);

    // User changes filter → new contextKey
    store.commit('selection/setContext', { contextKey: '/works?filter=is_oa:true', totalCount: 500 });
    expect(store.state.selection.selectedIds).toEqual([]);
    expect(store.getters['selection/selectedCount']).toBe(0);
  });

  it('selectAllMode masterState is page-scoped via excludedIds', () => {
    store.commit('selection/enterSelectAllMode');
    expect(store.getters['selection/masterState']).toBe('all-set');

    store.commit('selection/toggleId', 'W2');
    expect(store.getters['selection/masterState']).toBe('some');

    // Navigate to a page where none are excluded
    store.commit('selection/setLoadedIds', page2);
    expect(store.getters['selection/masterState']).toBe('all-set');

    store.commit('selection/deselectAllOnPage');
    // All of page 2 now excluded; W2 still excluded from page 1
    expect(store.getters['selection/masterState']).toBe('none');

    store.commit('selection/selectAllOnPage');
    expect(store.getters['selection/masterState']).toBe('all-set');
    expect(store.state.selection.excludedIds).toEqual(['W2']);
  });
});
