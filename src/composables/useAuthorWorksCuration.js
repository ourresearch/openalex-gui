import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase } from '@/apiConfig';

// Owner-only add/remove-works curation for the author entity page. Layers
// pending state onto the EXISTING works list + selection store — it does not
// own a list or render checkboxes. oxjob #187.
export function useAuthorWorksCuration({ authorId, authorName, works }) {
  const store = useStore();

  // ref (not reactive) + whole-object reassignment on every mutation so the
  // "n pending" chip recomputes instantly and monotonically. oxjob #187.
  const pendingRemovals = ref({}); // shortWorkId -> curationId (ALL removals)
  const pendingAdditions = ref([]); // [{ work, curationId }]
  // Removed works that are NOT in the loaded feed (e.g. after a reload, when
  // only page 1 is loaded) — fetched so the pending view can still show them.
  const pendingRemovalWorks = ref([]); // [{ work, curationId }]
  const busyCurationIds = reactive(new Set());
  const searchOpen = ref(false);
  const cvOpen = ref(false);

  // Cached so badges can be re-derived as the feed paginates without
  // re-hitting the API.
  let cachedCurations = [];

  const shortId = (id) =>
    (String(id || '').match(/[WA]\d+/i) || [''])[0].toUpperCase();
  const feedIdSet = () => new Set((works.value || []).map((w) => shortId(w.id)));

  const isPendingRemoval = (workId) =>
    Object.prototype.hasOwnProperty.call(
      pendingRemovals.value,
      shortId(workId)
    );

  const pendingRemovalCount = computed(
    () => Object.keys(pendingRemovals.value).length
  );
  const pendingCount = computed(
    () => pendingAdditions.value.length + pendingRemovalCount.value
  );

  const selectedCount = computed(
    () => store.getters['selection/selectedCount']
  );
  const canRemove = computed(() => selectedCount.value > 0);

  function selectedWorkIds() {
    const sel = store.state.selection;
    if (sel.selectAllMode) {
      return (sel.loadedIds || []).filter(
        (id) => !sel.excludedIds.includes(id)
      );
    }
    return [...(sel.selectedIds || [])];
  }

  function applyReconcile() {
    const feed = feedIdSet();
    const next = {};
    cachedCurations
      .filter((c) => c.action === 'remove' && c.status !== 'applied')
      .forEach((c) => {
        next[shortId(c.entity_id)] = c.id;
      });
    pendingRemovals.value = next;
    pendingAdditions.value = pendingAdditions.value.filter(
      (item) => !feed.has(shortId(item.work.id))
    );
    // Drop fetched removal-works that are now in the feed (the feed branch
    // will render them) or no longer a pending removal (undone/applied).
    pendingRemovalWorks.value = pendingRemovalWorks.value.filter((item) => {
      const sid = shortId(item.work.id);
      return !feed.has(sid) && Object.prototype.hasOwnProperty.call(next, sid);
    });
  }

  async function fetchWorksByIds(shortIds) {
    const out = [];
    for (let i = 0; i < shortIds.length; i += 50) {
      const chunk = shortIds.slice(i, i + 50);
      try {
        const resp = await axios.get(
          `${urlBase.api}/works?filter=ids.openalex:${chunk.join('|')}&per_page=50`
        );
        out.push(...(resp.data?.results || []));
      } catch (e) {
        console.warn('batch works fetch failed', e);
      }
    }
    return out;
  }

  async function reconcile() {
    if (!authorId.value) return;
    cachedCurations = await store.dispatch(
      'user/fetchAuthorCurations',
      authorId.value
    );
    applyReconcile();
    const feed = feedIdSet();

    // Additions: replace-curations whose work isn't in the feed yet.
    const addCurations = cachedCurations.filter(
      (c) =>
        c.action === 'replace' &&
        c.status !== 'applied' &&
        !feed.has(shortId(c.entity_id))
    );
    if (addCurations.length) {
      const byWork = {};
      addCurations.forEach((c) => {
        byWork[shortId(c.entity_id)] = c.id;
      });
      const have = new Set(
        pendingAdditions.value.map((i) => shortId(i.work.id))
      );
      const fetched = await fetchWorksByIds(
        Object.keys(byWork).filter((sid) => !have.has(sid))
      );
      fetched.forEach((work) => {
        const sid = shortId(work.id);
        // Re-check the LIVE feed + array at push time, not the snapshots taken
        // before the await. reconcile captures `feed` and `have` up front, but
        // its awaits give the works feed time to finish loading and concurrent
        // reconciles (onMounted + authorId watch + onSubmitted) time to push —
        // a stale snapshot then double-renders a work (in the feed AND here).
        // oxjob #342.
        if (feedIdSet().has(sid)) return;
        if (pendingAdditions.value.some((i) => shortId(i.work.id) === sid)) return;
        pendingAdditions.value.push({ work, curationId: byWork[sid] });
      });
    }

    // Removals whose work isn't in the loaded feed (e.g. after a reload):
    // fetch them so the pending view can still show + cancel them.
    const removeCurations = cachedCurations.filter(
      (c) =>
        c.action === 'remove' &&
        c.status !== 'applied' &&
        !feed.has(shortId(c.entity_id))
    );
    if (removeCurations.length) {
      const byWork = {};
      removeCurations.forEach((c) => {
        byWork[shortId(c.entity_id)] = c.id;
      });
      const have = new Set(
        pendingRemovalWorks.value.map((i) => shortId(i.work.id))
      );
      const fetched = await fetchWorksByIds(
        Object.keys(byWork).filter((sid) => !have.has(sid))
      );
      fetched.forEach((work) => {
        // Same race guard as the additions branch: skip works now in the feed
        // (rendered via visibleResults) or already queued, re-checked live.
        const sid = shortId(work.id);
        if (feedIdSet().has(sid)) return;
        if (pendingRemovalWorks.value.some((i) => shortId(i.work.id) === sid)) return;
        pendingRemovalWorks.value.push({ work, curationId: byWork[sid] });
      });
    }
  }

  onMounted(reconcile);
  watch(authorId, (v, old) => {
    if (v && v !== old) reconcile();
  });
  watch(works, applyReconcile);

  // Adds arrive one event per work (search submits a batch; CV loops).
  // Buffer into a single batched POST.
  let addBuffer = [];
  let addTimer = null;

  function onAddWork(payload) {
    addBuffer.push(payload);
    clearTimeout(addTimer);
    addTimer = setTimeout(flushAdds, 50);
  }

  async function flushAdds() {
    const rawBatch = addBuffer;
    addBuffer = [];
    if (!rawBatch.length) return;
    // Proactive no-op guard (oxjob #199): a work already on this profile (in
    // the feed or already a pending addition) would just be 409'd by the API.
    // Skip it client-side and tell the user, rather than create junk.
    const feed = feedIdSet();
    const pendingSet = new Set(
      pendingAdditions.value.map((i) => shortId(i.work.id))
    );
    const batch = [];
    let alreadyOn = 0;
    rawBatch.forEach((p) => {
      const sid = shortId(p.workId);
      if (feed.has(sid) || pendingSet.has(sid)) {
        alreadyOn += 1;
      } else {
        batch.push(p);
      }
    });
    if (alreadyOn) {
      store.commit(
        'snackbar',
        `${alreadyOn} work${alreadyOn === 1 ? '' : 's'} already on this profile — skipped.`
      );
    }
    if (!batch.length) return;
    const curations = batch.map((p) => {
      const raw =
        p.authorship?.raw_author_name ||
        p.authorship?.author?.display_name ||
        authorName.value;
      return {
        entity: 'works',
        entity_id: p.workId,
        property: `authorships[raw_author_name="${raw}"].author.id`,
        action: 'replace',
        value: authorId.value,
      };
    });
    try {
      // submitAuthorCurations returns {rows, skipped, errors} (oxjob #291).
      // Pre-#291 it returned a bare array and a single no-op threw a 409
      // that silently rolled back the whole batch. Now we get partial
      // success: commit the rows, surface skipped as a friendly tail
      // message, and snackbar any per-item errors verbatim.
      const {rows, skipped, errors} = await store.dispatch(
        'user/submitAuthorCurations',
        curations
      );
      const byWork = {};
      rows.forEach((r) => {
        byWork[shortId(r.entity_id)] = r.id;
      });
      const missing = Object.keys(byWork).filter(
        (sid) =>
          !feed.has(sid) &&
          !pendingAdditions.value.some((i) => shortId(i.work.id) === sid)
      );
      const fetched = await fetchWorksByIds(missing);
      fetched.forEach((work) => {
        pendingAdditions.value.push({
          work,
          curationId: byWork[shortId(work.id)],
        });
      });
      const parts = [];
      if (rows.length) {
        parts.push(`${rows.length} work${rows.length === 1 ? '' : 's'} added. Applied in 1-2 days.`);
      }
      if (skipped.length) {
        parts.push(`${skipped.length} already on profile — skipped.`);
      }
      if (errors.length) {
        parts.push(`${errors.length} couldn't be submitted.`);
      }
      if (parts.length) store.commit('snackbar', parts.join(' '));
    } catch (e) {
      // submitAuthorCurations maps 429 to a friendly daily-limit message.
      store.commit('snackbar', e.message);
    }
  }

  async function removeSelected() {
    const ids = selectedWorkIds();
    if (!ids.length) return;
    const curations = ids.map((workId) => ({
      entity: 'works',
      entity_id: workId,
      property: 'authorships.author.id',
      action: 'remove',
      value: authorId.value,
    }));
    try {
      // {rows, skipped, errors} since oxjob #291 — partial success is now
      // the default for bulk removes. Only commit pendingRemovals for the
      // rows the server actually created, so an `unremove` undo always
      // round-trips a real curation id.
      const {rows, skipped, errors} = await store.dispatch(
        'user/submitAuthorCurations',
        curations
      );
      const byWork = {};
      rows.forEach((r) => {
        byWork[shortId(r.entity_id)] = r.id;
      });
      const nextRemovals = { ...pendingRemovals.value };
      Object.entries(byWork).forEach(([sid, cid]) => {
        nextRemovals[sid] = cid;
        // Hydrate cachedCurations from the actual returned row so entity_id
        // matches the server's canonical form (it may be a full URL).
        const row = rows.find((r) => shortId(r.entity_id) === sid);
        cachedCurations.push({
          id: cid,
          action: 'remove',
          status: 'pending',
          entity_id: row?.entity_id,
        });
      });
      pendingRemovals.value = nextRemovals;
      store.commit('selection/deselectAll');
      const parts = [];
      if (rows.length) {
        parts.push(`${rows.length} work${rows.length === 1 ? '' : 's'} removed. Applied in 1-2 days.`);
      }
      if (skipped.length) {
        parts.push(`${skipped.length} not on profile — nothing to remove.`);
      }
      if (errors.length) {
        parts.push(`${errors.length} couldn't be submitted.`);
      }
      if (parts.length) store.commit('snackbar', parts.join(' '));
    } catch (e) {
      store.commit('snackbar', e.message);
    }
  }

  async function undoRemoval(workId) {
    const sid = shortId(workId);
    const curationId = pendingRemovals.value[sid];
    if (!curationId) return;
    busyCurationIds.add(curationId);
    try {
      await store.dispatch('user/deleteAuthorCuration', curationId);
      const nextRemovals = { ...pendingRemovals.value };
      delete nextRemovals[sid];
      pendingRemovals.value = nextRemovals;
      pendingRemovalWorks.value = pendingRemovalWorks.value.filter(
        (i) => shortId(i.work.id) !== sid
      );
      cachedCurations = cachedCurations.filter((c) => c.id !== curationId);
      store.commit('snackbar', 'Removal canceled.');
    } catch (e) {
      store.commit('snackbar', "Couldn't cancel. Please try again.");
    } finally {
      busyCurationIds.delete(curationId);
    }
  }

  async function undoAddition(idx) {
    const item = pendingAdditions.value[idx];
    if (!item) return;
    busyCurationIds.add(item.curationId);
    try {
      await store.dispatch('user/deleteAuthorCuration', item.curationId);
      pendingAdditions.value.splice(idx, 1);
      cachedCurations = cachedCurations.filter(
        (c) => c.id !== item.curationId
      );
      store.commit('snackbar', 'Addition canceled.');
    } catch (e) {
      store.commit('snackbar', "Couldn't cancel. Please try again.");
    } finally {
      busyCurationIds.delete(item.curationId);
    }
  }

  return {
    pendingAdditions,
    pendingRemovalWorks,
    busyCurationIds,
    searchOpen,
    cvOpen,
    canRemove,
    pendingCount,
    isPendingRemoval,
    pendingRemovalCurationId: (workId) =>
      pendingRemovals.value[shortId(workId)],
    onAddWork,
    removeSelected,
    undoRemoval,
    undoAddition,
    openSearch: () => {
      searchOpen.value = true;
    },
    openCv: () => {
      cvOpen.value = true;
    },
  };
}
