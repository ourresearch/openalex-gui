<template>
  <v-card variant="outlined" class="rounded-o bg-white">
    <v-toolbar flat color="white" class="entity-page-section-title">
      <v-toolbar-title class="font-weight-bold">Works</v-toolbar-title>
      <v-spacer />
      <v-btn
        variant="text"
        rounded
        size="small"
        color="error"
        :disabled="selectedForRemoval.size === 0"
        @click="removeConfirmOpen = true"
      >
        Remove<template v-if="selectedForRemoval.size"> {{ selectedForRemoval.size }}</template>
      </v-btn>
      <v-btn
        variant="text"
        rounded
        size="small"
        color="primary"
        @click="dialogOpen = true"
      >
        <v-icon start size="16">mdi-plus</v-icon>
        Add works
      </v-btn>
    </v-toolbar>

    <v-divider />

    <!-- Pending additions: pinned at top (cannot interleave — sort/pagination
         make a correct in-list position impossible). -->
    <div v-if="pendingAdditions.length" class="pending-additions">
      <div class="px-4 pt-3 pb-1 text-caption text-medium-emphasis font-weight-medium">
        Pending additions
      </div>
      <div
        v-for="(item, idx) in pendingAdditions"
        :key="item.work.id"
        class="curation-row"
      >
        <div class="curation-row-body">
          <serp-results-list-item :result="item.work" />
        </div>
        <div class="curation-row-badge">
          <v-chip size="x-small" color="success" variant="flat" label>
            addition pending
          </v-chip>
          <v-btn
            variant="text"
            size="x-small"
            class="ml-1"
            :loading="busyCurationIds.has(item.curationId)"
            @click="undoAddition(idx)"
          >
            Undo
          </v-btn>
        </div>
      </div>
      <v-divider />
    </div>

    <div>
      <div
        v-for="work in works"
        :key="work.id"
        class="curation-row"
        :class="{ 'is-pending-removal': isPendingRemoval(work) }"
      >
        <v-checkbox
          :model-value="selectedForRemoval.has(work.id)"
          density="compact"
          hide-details
          class="curation-row-check"
          :disabled="isPendingRemoval(work)"
          @update:model-value="toggleSelect(work)"
        />
        <div class="curation-row-body">
          <serp-results-list-item :result="work" />
        </div>
        <div v-if="isPendingRemoval(work)" class="curation-row-badge">
          <v-chip size="x-small" color="error" variant="flat" label>
            removal pending
          </v-chip>
          <v-btn
            variant="text"
            size="x-small"
            class="ml-1"
            :loading="busyCurationIds.has(pendingRemovals[shortId(work.id)])"
            @click="undoRemoval(work)"
          >
            Undo
          </v-btn>
        </div>
      </div>
    </div>

    <div v-if="hasMore" class="pa-3 text-center">
      <v-btn
        variant="text"
        rounded
        size="small"
        color="primary"
        :loading="loadingMore"
        @click="$emit('show-more')"
      >
        Show more works
      </v-btn>
    </div>

    <AddWorksDialog
      v-model="dialogOpen"
      :author-name="authorName"
      :author-id="authorId"
      @add-work="onAddWork"
    />

    <v-dialog v-model="removeConfirmOpen" max-width="440">
      <v-card rounded>
        <v-card-title class="text-body-1 font-weight-bold">
          Remove {{ selectedForRemoval.size }}
          work{{ selectedForRemoval.size === 1 ? '' : 's' }}?
        </v-card-title>
        <v-card-text class="text-body-2 text-medium-emphasis">
          These works will be removed from your profile. The change is
          submitted now and applied within 24 hours; you can undo it until
          then.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" size="small" rounded @click="removeConfirmOpen = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            size="small"
            rounded
            :loading="removing"
            @click="confirmRemove"
          >
            Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase } from '@/apiConfig';
import SerpResultsListItem from '@/components/SerpResultsListItem.vue';
import AddWorksDialog from './AddWorksDialog.vue';

defineOptions({ name: 'AuthorWorksCurationPanel' });

const props = defineProps({
  authorId: { type: String, required: true },
  authorName: { type: String, default: '' },
  works: { type: Array, default: () => [] },
  hasMore: { type: Boolean, default: false },
  loadingMore: { type: Boolean, default: false },
});

defineEmits(['show-more']);

const store = useStore();

const dialogOpen = ref(false);
const removeConfirmOpen = ref(false);
const removing = ref(false);
const selectedForRemoval = reactive(new Set());
const pendingRemovals = reactive({}); // shortWorkId -> curationId
const pendingAdditions = ref([]); // [{ work, curationId }]
const busyCurationIds = reactive(new Set());

// Cached curations from the last fetch so we can re-derive badges as the
// canonical feed grows (pagination) without re-hitting the API.
let cachedCurations = [];

const shortId = (id) =>
  (String(id || '').match(/[WA]\d+/i) || [''])[0].toUpperCase();

const feedIdSet = () => new Set(props.works.map((w) => shortId(w.id)));

const isPendingRemoval = (work) =>
  Object.prototype.hasOwnProperty.call(pendingRemovals, shortId(work.id));

function applyReconcile() {
  const feed = feedIdSet();
  // Removals: badge a work only if it's still in the canonical feed and the
  // remove curation has not been applied yet.
  Object.keys(pendingRemovals).forEach((k) => delete pendingRemovals[k]);
  cachedCurations
    .filter((c) => c.action === 'remove' && !c.is_applied)
    .forEach((c) => {
      const wid = shortId(c.entity_id);
      if (feed.has(wid)) pendingRemovals[wid] = c.id;
    });
  // Additions that have since landed in the canonical feed (pipeline applied
  // them) must lose their green badge.
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
  cachedCurations = await store.dispatch(
    'user/fetchAuthorCurations',
    props.authorId
  );
  applyReconcile();

  const feed = feedIdSet();
  const pendingAddCurations = cachedCurations.filter(
    (c) => c.action === 'replace' && !c.is_applied && !feed.has(shortId(c.entity_id))
  );
  if (!pendingAddCurations.length) return;
  const byWork = {};
  pendingAddCurations.forEach((c) => {
    byWork[shortId(c.entity_id)] = c.id;
  });
  const fetched = await fetchWorksByIds(Object.keys(byWork));
  const have = new Set(pendingAdditions.value.map((i) => shortId(i.work.id)));
  fetched.forEach((work) => {
    const sid = shortId(work.id);
    if (!have.has(sid)) {
      pendingAdditions.value.push({ work, curationId: byWork[sid] });
    }
  });
}

onMounted(reconcile);
watch(() => props.works, applyReconcile, { deep: false });

function toggleSelect(work) {
  if (selectedForRemoval.has(work.id)) selectedForRemoval.delete(work.id);
  else selectedForRemoval.add(work.id);
}

async function confirmRemove() {
  removing.value = true;
  try {
    const ids = Array.from(selectedForRemoval);
    const curations = ids.map((workId) => ({
      entity: 'works',
      entity_id: workId,
      property: 'authorships.author.id',
      action: 'remove',
      value: props.authorId,
    }));
    const rows = await store.dispatch('user/submitAuthorCurations', curations);
    const byWork = {};
    (rows || []).forEach((r) => {
      byWork[shortId(r.entity_id)] = r.id;
    });
    ids.forEach((workId) => {
      const sid = shortId(workId);
      pendingRemovals[sid] = byWork[sid];
      cachedCurations.push({
        id: byWork[sid],
        action: 'remove',
        is_applied: false,
        entity_id: workId,
      });
    });
    selectedForRemoval.clear();
    removeConfirmOpen.value = false;
    store.commit(
      'snackbar',
      `${ids.length} work${ids.length === 1 ? '' : 's'} removed. Applied within 24 hours.`
    );
  } catch (e) {
    store.commit('snackbar', e.message);
  } finally {
    removing.value = false;
  }
}

// Adds arrive one event per work (search submits a batch; CV loops). Buffer
// them into a single batched POST.
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
      props.authorName;
    return {
      entity: 'works',
      entity_id: p.workId,
      property: `authorships[raw_author_name="${raw}"].author.id`,
      action: 'replace',
      value: props.authorId,
    };
  });
  try {
    const rows = await store.dispatch('user/submitAuthorCurations', curations);
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
      `${batch.length} work${batch.length === 1 ? '' : 's'} added. Applied within 24 hours.`
    );
  } catch (e) {
    // submitAuthorCurations maps 429 to a friendly daily-limit message.
    store.commit('snackbar', e.message);
  }
}

async function undoRemoval(work) {
  const sid = shortId(work.id);
  const curationId = pendingRemovals[sid];
  if (!curationId) return;
  busyCurationIds.add(curationId);
  try {
    await store.dispatch('user/deleteAuthorCuration', curationId);
    delete pendingRemovals[sid];
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
    cachedCurations = cachedCurations.filter((c) => c.id !== item.curationId);
    store.commit('snackbar', 'Addition canceled.');
  } catch (e) {
    store.commit('snackbar', "Couldn't cancel. Please try again.");
  } finally {
    busyCurationIds.delete(item.curationId);
  }
}
</script>

<style scoped>
.curation-row {
  display: flex;
  align-items: flex-start;
}

.curation-row-check {
  flex: 0 0 auto;
  margin: 8px 0 0 8px;
}

.curation-row-body {
  flex: 1 1 auto;
  min-width: 0;
}

.curation-row-badge {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: 12px 12px 0 4px;
  white-space: nowrap;
}

.is-pending-removal {
  opacity: 0.55;
}

.is-pending-removal .curation-row-check {
  opacity: 0;
}
</style>
