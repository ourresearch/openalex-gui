// The sort menu's logic (oxjob #1658): the menu and the OQL text are two views of one
// order (Jason 2026-10-12/13). Its choices come from the API (GET /query/orders: the
// orders the editor offers after a comma, each with the exact `sort_by` it sets) and its
// current label from the results echo (`meta.x_query.order`), so the website keeps no
// word list and never parses OQL. Plain functions, so they're testable without a mount.

// The menu label for an order's OQL words: "most cited (age-adjusted) first" ->
// "Most cited (age-adjusted)", "newest first" -> "Newest", "open access last" stays.
export function orderLabel(words) {
  if (!words) return 'Custom order';
  const w = words.replace(/ first$/, '');
  return w.charAt(0).toUpperCase() + w.slice(1);
}

const key = (sortBy) => (sortBy || [])
  .map((s) => `${s.column_id}:${s.direction === 'asc' ? 'asc' : 'desc'}`)
  .join(',');

// Two orders are the same when every key matches, in order.
export function sameOrder(a, b) {
  return key(a) === key(b);
}

// An order as the URL's `sort=` param ("cited_by_count:desc,id:asc"), or undefined for
// the default (no param).
export function sortParam(sortBy) {
  return key(sortBy) || undefined;
}

// The order the shown results came in, from their echo: {words, isDefault, sortBy}, or
// null when the results have no order to choose (one number).
export function currentOrder(xQuery) {
  if (!xQuery) return null;
  const sortBy = xQuery.oqo?.sort_by || [];
  if (!xQuery.order && !sortBy.length) return null;
  return { words: xQuery.order || null, isDefault: !!xQuery.order_default, sortBy };
}

// The menu's rows: the API's options with the current one marked, and the current order
// on top when no option is it (set from a column header: `highest reference count first`).
export function menuItems(options, current) {
  const items = (options || []).map((o) => ({
    label: orderLabel(o.words),
    words: o.words,
    sortBy: o.sort_by || [],
    isDefault: !!o.default,
    active: !!current && (current.isDefault ? !!o.default : !o.default && sameOrder(o.sort_by, current.sortBy)),
  }));
  if (current && !items.some((it) => it.active)) {
    items.unshift({
      label: orderLabel(current.words), words: current.words, sortBy: current.sortBy,
      isDefault: current.isDefault, active: true,
    });
  }
  return items;
}
