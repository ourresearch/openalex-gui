// The sort menu's logic (oxjob #1658): labels are the OQL's order words, the current
// order comes from the results echo, the choices from GET /query/orders.
import { describe, it, expect } from 'vitest';
import { currentOrder, menuItems, orderLabel, sameOrder, sortParam } from '@/sortMenu';

const MOST_CITED = [{ column_id: 'cited_by_count', direction: 'desc' }];
const NEWEST = [{ column_id: 'publication_date', direction: 'desc' }];
const OPTIONS = [
  { words: 'best matches first', sort_by: [], default: true },
  { words: 'most cited first', sort_by: MOST_CITED },
  { words: 'newest first', sort_by: NEWEST },
  { words: 'most cited (age-adjusted) first', sort_by: [
    { column_id: 'cited_by_percentile_year.max', direction: 'desc' },
    { column_id: 'cited_by_count', direction: 'desc' }] },
];

describe('orderLabel: the OQL words, as a menu label', () => {
  it('drops the trailing "first" and capitalizes', () => {
    expect(orderLabel('most cited (age-adjusted) first')).toBe('Most cited (age-adjusted)');
    expect(orderLabel('newest first')).toBe('Newest');
    expect(orderLabel('fewest works first')).toBe('Fewest works');
    expect(orderLabel('alphabetical by title')).toBe('Alphabetical by title');
    expect(orderLabel('open access last')).toBe('Open access last');
  });
  it('names an order with no words', () => {
    expect(orderLabel(null)).toBe('Custom order');
  });
});

describe('sameOrder / sortParam', () => {
  it('compares every key, in order, with desc as the missing direction', () => {
    expect(sameOrder(MOST_CITED, [{ column_id: 'cited_by_count' }])).toBe(true);
    expect(sameOrder(MOST_CITED, NEWEST)).toBe(false);
    expect(sameOrder([], null)).toBe(true);
  });
  it("writes the URL's sort= param, none for the default", () => {
    expect(sortParam(OPTIONS[3].sort_by)).toBe('cited_by_percentile_year.max:desc,cited_by_count:desc');
    expect(sortParam([])).toBeUndefined();
    expect(sortParam(null)).toBeUndefined();
  });
});

describe('currentOrder: from the results echo', () => {
  it('reads the order words, the default flag and the sort_by', () => {
    expect(currentOrder({ order: 'newest first', order_default: false, oqo: { sort_by: NEWEST } }))
      .toEqual({ words: 'newest first', isDefault: false, sortBy: NEWEST });
    expect(currentOrder({ order: 'best matches first', order_default: true, oqo: {} }))
      .toEqual({ words: 'best matches first', isDefault: true, sortBy: [] });
  });
  it('is null when there is nothing to order (one number) or no echo', () => {
    expect(currentOrder({ order: null, order_default: false, oqo: {} })).toBeNull();
    expect(currentOrder(null)).toBeNull();
  });
  it('keeps an order with no words (still an order)', () => {
    expect(currentOrder({ order: null, oqo: { sort_by: MOST_CITED } }).sortBy).toEqual(MOST_CITED);
  });
});

describe('menuItems', () => {
  it('marks the default when the results are in it', () => {
    const items = menuItems(OPTIONS, { words: 'best matches first', isDefault: true, sortBy: [] });
    expect(items.map((i) => i.label)).toEqual(['Best matches', 'Most cited', 'Newest', 'Most cited (age-adjusted)']);
    expect(items.filter((i) => i.active).map((i) => i.label)).toEqual(['Best matches']);
  });
  it('marks a picked or typed order by its sort_by', () => {
    const items = menuItems(OPTIONS, { words: 'newest first', isDefault: false, sortBy: NEWEST });
    expect(items.filter((i) => i.active).map((i) => i.label)).toEqual(['Newest']);
  });
  it('puts an order from a column header on top when no option is it', () => {
    const refs = [{ column_id: 'referenced_works_count', direction: 'desc' }];
    const items = menuItems(OPTIONS, { words: 'highest reference count first', isDefault: false, sortBy: refs });
    expect(items[0]).toMatchObject({ label: 'Highest reference count', active: true, sortBy: refs });
    expect(items.filter((i) => i.active)).toHaveLength(1);
  });
  it('never marks the default for an explicit order with the same keys', () => {
    // the default option's sort_by is [] (the engine's own); an explicit order isn't it
    const items = menuItems(OPTIONS, { words: 'most cited first', isDefault: false, sortBy: MOST_CITED });
    expect(items.find((i) => i.isDefault).active).toBe(false);
  });
});
