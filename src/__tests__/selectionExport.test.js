import { describe, it, expect } from 'vitest';

import {
  resolveExportSelection,
  idsOpenAlexFilter,
  bareId,
  MAX_INLINE_EXPORT_IDS,
} from '@/utils/selectionExport';

// Mirrors the shape committed by useSelectionContext into the `selection` store.
const sel = (over = {}) => ({
  selectAllMode: false,
  loadedIds: [],
  selectedIds: [],
  excludedIds: [],
  totalCount: 0,
  ...over,
});

const url = (id) => `https://openalex.org/${id}`;

describe('bareId', () => {
  it('normalizes full URLs, namespaced, and short ids to the bare short form', () => {
    expect(bareId('https://openalex.org/W2035669333')).toBe('W2035669333');
    expect(bareId('works/w123')).toBe('W123');
    expect(bareId('W123')).toBe('W123');
  });
});

describe('idsOpenAlexFilter', () => {
  it('builds an ids.openalex pipe-joined clause of bare ids', () => {
    expect(idsOpenAlexFilter([url('W1'), 'works/w2', 'W3'])).toBe('ids.openalex:W1|W2|W3');
  });
});

describe('resolveExportSelection — explicit selection', () => {
  it('scopes to the ticked rows', () => {
    const r = resolveExportSelection(sel({ selectedIds: [url('W1'), url('W2')] }));
    expect(r.scoped).toBe(true);
    expect(r.count).toBe(2);
    expect(r.ids).toEqual([url('W1'), url('W2')]);
  });

  it('produces an ids filter that targets exactly those rows', () => {
    const r = resolveExportSelection(sel({ selectedIds: [url('W1'), url('W2')] }));
    expect(idsOpenAlexFilter(r.ids)).toBe('ids.openalex:W1|W2');
  });
});

describe('resolveExportSelection — fallbacks to full set', () => {
  it('empty selection is not scoped', () => {
    const r = resolveExportSelection(sel());
    expect(r.scoped).toBe(false);
    expect(r.reason).toBe('empty');
  });

  it('null/undefined selection is safe and not scoped', () => {
    expect(resolveExportSelection(undefined).scoped).toBe(false);
    expect(resolveExportSelection(null).reason).toBe('empty');
  });

  it('select-all mode with more results than loaded is not enumerable', () => {
    const r = resolveExportSelection(sel({
      selectAllMode: true,
      loadedIds: [url('W1'), url('W2')],
      totalCount: 237,
    }));
    expect(r.scoped).toBe(false);
    expect(r.reason).toBe('select-all');
  });

  it('over-cap selection falls back (does not overflow the request line)', () => {
    const many = Array.from({ length: MAX_INLINE_EXPORT_IDS + 1 }, (_, i) => url(`W${i}`));
    const r = resolveExportSelection(sel({ selectedIds: many }));
    expect(r.scoped).toBe(false);
    expect(r.reason).toBe('over-cap');
    expect(r.count).toBe(MAX_INLINE_EXPORT_IDS + 1);
  });

  it('exactly at the cap is still scoped', () => {
    const many = Array.from({ length: MAX_INLINE_EXPORT_IDS }, (_, i) => url(`W${i}`));
    const r = resolveExportSelection(sel({ selectedIds: many }));
    expect(r.scoped).toBe(true);
    expect(r.count).toBe(MAX_INLINE_EXPORT_IDS);
  });
});

describe('resolveExportSelection — select-all on a fully-loaded page', () => {
  it('enumerates loaded ids minus exclusions when all results are loaded', () => {
    const r = resolveExportSelection(sel({
      selectAllMode: true,
      loadedIds: [url('W1'), url('W2'), url('W3')],
      excludedIds: [url('W2')],
      totalCount: 3,
    }));
    expect(r.scoped).toBe(true);
    expect(r.count).toBe(2);
    expect(idsOpenAlexFilter(r.ids)).toBe('ids.openalex:W1|W3');
  });
});
