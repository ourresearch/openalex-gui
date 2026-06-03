import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase } from '@/apiConfig';
import {
  shortWorkId,
  shortAuthorId,
  bucketWorksByName,
  buildNameRows,
  namePending,
  nameRemoved,
} from '@/composables/observedNamesMapping';

// Name-level "remove observed names" curation for the author entity page.
// oxjob #342.
//
// An author's "observed names" (`display_name_alternatives`) are the exact
// `raw_author_name` strings seen across their works (Walden builds them with
// ARRAY_DISTINCT and NO normalization — so each observed name is one exact,
// case-sensitive raw string; EXPLORE Q1). Removing a name = removing every
// work where this author appears under that exact name, via the SAME
// `works/remove` curation the per-work flow uses.
//
// The name->works mapping comes from ONE paginated pass over the author's
// works (read each authorship's `raw_author_name` for this author, bucket
// exactly). That single pass yields the per-name counts (the dialog preview)
// AND the exact work-id sets for the curations. `include_xpac=true` is
// mandatory — ~22% of an author's works can be xpac and are otherwise
// silently dropped from `?filter=` queries (workspace learning, bit #240 in
// this exact dialog area).
export function useObservedNamesCuration({
  authorId,
  observedNames,
  onSubmitted,
}) {
  const store = useStore();

  const loading = ref(false); // mapping pass in flight
  const mapped = ref(false); // mapping has completed at least once
  const submitting = ref(false);
  const progress = ref({ done: 0, total: 0 });

  // exact raw_author_name string -> [shortWorkId, ...]
  const nameToWorkIds = ref({});
  // shortWorkId -> true for every work with a remove-curation (pending OR
  // applied). Drives curation-derived name visibility (EXPLORE Q2): the
  // server `display_name_alternatives` lags the removal by >24h, so we never
  // trust it for "is this name gone" — we derive from the user's curations.
  const removedWorkIds = ref({});
  // shortWorkId -> true only while the remove-curation is still pending
  // (not yet applied). A name with >=1 of these is "deletion pending".
  const pendingWorkIds = ref({});

  const authorShort = computed(() => shortAuthorId(authorId.value));

  // One paginated pass over the author's works, bucketing by this author's
  // exact raw_author_name. Cursor-paged for stability over large sets.
  async function buildMapping() {
    if (!authorShort.value) return;
    loading.value = true;
    progress.value = { done: 0, total: 0 };
    const buckets = {};
    let cursor = '*';
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const url =
          `${urlBase.api}/works` +
          `?filter=authorships.author.id:${authorShort.value}` +
          `&select=id,authorships&per_page=200` +
          `&cursor=${encodeURIComponent(cursor)}` +
          `&include_xpac=true`;
        const resp = await axios.get(url);
        const results = resp.data?.results || [];
        const meta = resp.data?.meta || {};
        if (!progress.value.total) progress.value.total = meta.count || 0;
        bucketWorksByName(results, authorShort.value, buckets);
        progress.value.done += results.length;
        cursor = meta.next_cursor;
        if (!cursor || !results.length) break;
      }
      nameToWorkIds.value = buckets;
      mapped.value = true;
    } finally {
      loading.value = false;
    }
  }

  // Pull the user's own works-curations for this author and index the
  // remove-curations by work id (pending vs applied). Cheap GET; the per-work
  // composable does the same fetch, but keeping our own copy decouples the two.
  async function refreshCurations() {
    if (!authorShort.value) return;
    const curations = await store.dispatch(
      'user/fetchAuthorCurations',
      authorId.value
    );
    const removed = {};
    const pending = {};
    (curations || [])
      .filter((c) => c.action === 'remove')
      .forEach((c) => {
        const sid = shortWorkId(c.entity_id);
        removed[sid] = true;
        if (c.status !== 'applied') pending[sid] = true;
      });
    removedWorkIds.value = removed;
    pendingWorkIds.value = pending;
  }

  // Dialog rows: one per observed name still carrying >=1 NOT-yet-removed work.
  const nameRows = computed(() =>
    buildNameRows(observedNames.value, nameToWorkIds.value, removedWorkIds.value)
  );

  // Name-level visibility for the entity-page row (curation-derived, EXPLORE
  // Q2). Requires the mapping; callers should only consult these once `mapped`.
  const isNamePending = (name) =>
    namePending(name, nameToWorkIds.value, pendingWorkIds.value);
  const isNameRemoved = (name) =>
    nameRemoved(name, nameToWorkIds.value, removedWorkIds.value);

  // Submit removals for the given observed names: union their NOT-yet-removed
  // work ids and POST one `works/remove` curation per work, chunked (the
  // workspace "no monolithic ops" rule). Funnels through the same
  // `user/submitAuthorCurations` action as the per-work flow, so the existing
  // {n} pending chip + per-work strikethrough pick the removals up via
  // `onSubmitted` (wired to the per-work composable's reconcile).
  async function removeNames(names) {
    if (!authorShort.value || !names?.length) return { rows: 0, errors: 0 };
    const set = new Set(names);
    const workIds = [
      ...new Set(
        nameRows.value
          .filter((r) => set.has(r.name))
          .flatMap((r) => r.removableIds)
      ),
    ];
    if (!workIds.length) return { rows: 0, errors: 0 };

    submitting.value = true;
    progress.value = { done: 0, total: workIds.length };
    const CHUNK = 50;
    let totalRows = 0;
    let totalErrors = 0;
    try {
      for (let i = 0; i < workIds.length; i += CHUNK) {
        const chunk = workIds.slice(i, i + CHUNK);
        const curations = chunk.map((wid) => ({
          entity: 'works',
          entity_id: wid,
          property: 'authorships.author.id',
          action: 'remove',
          value: authorShort.value,
        }));
        try {
          const { rows, errors } = await store.dispatch(
            'user/submitAuthorCurations',
            curations
          );
          totalRows += rows.length;
          totalErrors += errors.length;
          // Optimistically mark these works removed+pending so the name flips
          // to struck-through immediately, before the reconcile round-trip.
          const nextRemoved = { ...removedWorkIds.value };
          const nextPending = { ...pendingWorkIds.value };
          rows.forEach((r) => {
            const sid = shortWorkId(r.entity_id);
            nextRemoved[sid] = true;
            nextPending[sid] = true;
          });
          removedWorkIds.value = nextRemoved;
          pendingWorkIds.value = nextPending;
        } catch (e) {
          totalErrors += chunk.length;
        }
        progress.value.done = Math.min(i + CHUNK, workIds.length);
      }
      const parts = [];
      if (totalRows) {
        parts.push(
          `${totalRows} work${totalRows === 1 ? '' : 's'} removed. Applied in 1-2 days.`
        );
      }
      if (totalErrors) {
        parts.push(`${totalErrors} couldn't be submitted.`);
      }
      if (parts.length) store.commit('snackbar', parts.join(' '));
      if (onSubmitted) await onSubmitted();
    } finally {
      submitting.value = false;
    }
    return { rows: totalRows, errors: totalErrors };
  }

  return {
    loading,
    mapped,
    submitting,
    progress,
    nameToWorkIds,
    nameRows,
    buildMapping,
    refreshCurations,
    removeNames,
    isNamePending,
    isNameRemoved,
  };
}
