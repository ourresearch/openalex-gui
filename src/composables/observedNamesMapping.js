// Pure helpers for the name-level "remove observed names" feature (oxjob #342).
// Kept free of any app/runtime imports (no apiConfig/window) so they're
// unit-testable in a plain node env. The stateful composable
// (useObservedNamesCuration.js) builds on these.

export const shortWorkId = (id) =>
  (String(id || '').match(/W\d+/i) || [''])[0].toUpperCase();

export const shortAuthorId = (id) =>
  (String(id || '').match(/A\d+/i) || [''])[0].toUpperCase();

// Bucket a page of works by THIS author's exact (case-sensitive)
// raw_author_name — Walden applies no normalization, so an observed name is
// one exact raw string (EXPLORE Q1). Mutates `into` so it accumulates across
// pages.
export function bucketWorksByName(works, authorShort, into = {}) {
  for (const work of works || []) {
    const wid = shortWorkId(work.id);
    for (const a of work.authorships || []) {
      if (shortAuthorId(a.author?.id) !== authorShort) continue;
      const raw = a.raw_author_name;
      if (raw) (into[raw] = into[raw] || []).push(wid);
      break; // this author appears at most once per work
    }
  }
  return into;
}

// Dialog rows: one per observed name still carrying >=1 NOT-yet-removed work.
// Stale 0-work names and fully-removed names drop out (nothing left to act on).
export function buildNameRows(observedNames, nameToWorkIds, removedWorkIds) {
  return (observedNames || [])
    .map((name) => {
      const ids = nameToWorkIds[name] || [];
      const removableIds = ids.filter((id) => !removedWorkIds[id]);
      return { name, workIds: ids, removableIds, count: removableIds.length };
    })
    .filter((row) => row.count > 0);
}

// Curation-derived name visibility (EXPLORE Q2 — never trust the lagging
// server doc). Pending: >=1 constituent work has a pending removal. Removed
// (hidden): EVERY constituent work has a remove-curation (pending or applied).
export function namePending(name, nameToWorkIds, pendingWorkIds) {
  const ids = nameToWorkIds[name] || [];
  return ids.length > 0 && ids.some((id) => pendingWorkIds[id]);
}
export function nameRemoved(name, nameToWorkIds, removedWorkIds) {
  const ids = nameToWorkIds[name] || [];
  return ids.length > 0 && ids.every((id) => removedWorkIds[id]);
}
