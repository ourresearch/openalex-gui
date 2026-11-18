// Export only the first N rows of a list (oxjob #635): e.g. the 200 most relevant works of a search, for a
// systematic review. The export service stops after max_rows, in the list's own order (relevance for a search).
export const ROW_LIMIT_CHOICES = [100, 200, 500, 1000, 5000, 10000];

// The dialog's choices for a list of `count` rows: everything, then each limit smaller than the list.
export function rowLimitOptions(count) {
  const n = Number(count) || 0;
  return [
    { title: `All ${n.toLocaleString()} rows`, value: null },
    ...ROW_LIMIT_CHOICES.filter(limit => limit < n).map(limit => ({ title: `First ${limit.toLocaleString()}`, value: limit })),
  ];
}

// How many rows the export will hold.
export function exportRowCount(count, limit) {
  const n = Number(count) || 0;
  return limit ? Math.min(limit, n) : n;
}
