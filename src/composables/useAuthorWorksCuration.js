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
  const pendingRemovals = ref({}); // shortWorkId -> curationId
  const pendingAdditions = ref([]); // [{ work, curationId }]
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
      .filter((c) => c.action === 'remove' && !c.is_applied)
      .forEach((c) => {
        const wid = shortId(c.entity_id);
        if (feed.has(wid)) next[wid] = c.id;
      });
    pendingRemovals.value = next;
    pendingAdditions.value = pendingAdditions.value.filter(
      (item) => !feed.has(shortId(item.work.id))
    );
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
    const addCurations = cachedCurations.filter(
      (c) =>
        c.action === 'replace' &&
        !c.is_applied &&
        !feed.has(shortId(c.entity_id))
    );
    if (!addCurations.length) return;
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
      pendingAdditions.value.push({
        work,
        curationId: byWork[shortId(work.id)],
      });
    });
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
    const batch = addBuffer;
    addBuffer = [];
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
      const rows = await store.dispatch(
        'user/submitAuthorCurations',
        curations
      );
      const byWork = {};
      (rows || []).forEach((r) => {
        byWork[shortId(r.entity_id)] = r.id;
      });
      const feed = feedIdSet();
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
      store.commit(
        'snackbar',
        `${batch.length} work${batch.length === 1 ? '' : 's'} added. Applied in 1 to 2 days.`
      );
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
      const rows = await store.dispatch(
        'user/submitAuthorCurations',
        curations
      );
      const byWork = {};
      (rows || []).forEach((r) => {
        byWork[shortId(r.entity_id)] = r.id;
      });
      const nextRemovals = { ...pendingRemovals.value };
      ids.forEach((workId) => {
        const sid = shortId(workId);
        nextRemovals[sid] = byWork[sid];
        cachedCurations.push({
          id: byWork[sid],
          action: 'remove',
          is_applied: false,
          entity_id: workId,
        });
      });
      pendingRemovals.value = nextRemovals;
      store.commit('selection/deselectAll');
      store.commit(
        'snackbar',
        `${ids.length} work${ids.length === 1 ? '' : 's'} removed. Applied in 1 to 2 days.`
      );
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
