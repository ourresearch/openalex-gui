// "Add all" for the column editor (oxjob #635): append every column the
// Available side currently shows (all of them, or the search matches) after the
// selected ones, keeping the selected order and adding none twice.

// The keys shown on the Available side, in display order (category by category).
export function availableKeys(categories) {
  return (categories || []).flatMap((cat) => (cat.items || []).map((item) => item.key));
}

// The selection with every available key appended once.
export function withAllAdded(selected, categories) {
  const out = [...(selected || [])];
  const seen = new Set(out);
  for (const key of availableKeys(categories)) {
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}
