<template>
  <!-- An import's progress (oxjob #1527): a search's results being added to a
       collection on the server. Polls until it finishes; the import keeps running
       if this goes away. -->
  <div class="collection-import-progress" role="status" aria-live="polite">
    <template v-if="current.status === 'failed'">
      <v-alert type="error" variant="tonal" density="compact">
        {{ current.error?.message || "The results couldn't be added." }}
      </v-alert>
    </template>
    <template v-else>
      <v-progress-linear
        :model-value="percent"
        :indeterminate="current.status === 'queued' || current.result_count == null"
        color="primary"
        rounded
        height="6"
        class="mb-2"
      />
      <div class="text-body-2">{{ statusText }}</div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import { MAX_MEMBERS_PER_COLLECTION } from "@/collectionLimits";

defineOptions({ name: "CollectionImportProgress" });

const props = defineProps({
  collectionId: { type: String, required: true },
  // The import as POST /imports (or GET) returned it.
  initial: { type: Object, required: true },
  // Plural noun for the members ("works", "authors").
  noun: { type: String, default: "items" },
});
const emit = defineEmits(["finished"]);

const store = useStore();
const current = ref(props.initial);
let timer = null;
let stopped = false;

const POLL_MS = 1500;

const percent = computed(() => Math.round((current.value.progress || 0) * 100));
const fmt = (n) => (n || 0).toLocaleString();

const statusText = computed(() => {
  const c = current.value;
  if (c.status === "queued") return "Waiting to start…";
  if (c.status === "done") {
    const added = `Added ${fmt(c.added)} ${props.noun}`;
    const present = c.already_present ? ` (${fmt(c.already_present)} were already in it)` : "";
    const full = c.stopped_at_limit
      ? ` The collection is full: it holds at most ${fmt(MAX_MEMBERS_PER_COLLECTION)}.`
      : "";
    return `${added}${present}.${full}`;
  }
  const total = c.result_count == null ? "" : ` of ${fmt(c.result_count)}`;
  return `Adding results: ${fmt((c.added || 0) + (c.already_present || 0))}${total}…`;
});

async function poll() {
  if (stopped) return;
  try {
    current.value = await store.dispatch("collections/fetchImport", {
      id: props.collectionId, importId: current.value.id,
    });
  } catch {
    // A blip: try again on the next tick.
  }
  if (stopped) return;
  if (current.value.status === "done" || current.value.status === "failed") {
    emit("finished", current.value);
    return;
  }
  timer = setTimeout(poll, POLL_MS);
}

watch(
  () => props.initial,
  (imp) => {
    clearTimeout(timer);
    current.value = imp;
    if (imp.status === "done" || imp.status === "failed") emit("finished", imp);
    else timer = setTimeout(poll, POLL_MS);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopped = true;
  clearTimeout(timer);
});
</script>
