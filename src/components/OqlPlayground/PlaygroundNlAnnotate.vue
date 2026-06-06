<template>
  <div class="nl-annotate">
    <!-- Top bar: progress + nav + filter + serialize -->
    <div class="annotate-bar">
      <div class="bar-left">
        <v-btn
          icon="mdi-chevron-left"
          variant="text"
          size="small"
          :disabled="!canPrev"
          aria-label="Previous case"
          @click="goPrev"
        />
        <div class="progress">
          <strong>{{ position }}</strong> / {{ visibleCases.length }}
          <span v-if="filterNeedsWork" class="text-caption text-medium-emphasis">(needs-work)</span>
        </div>
        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          size="small"
          :disabled="!canNext"
          aria-label="Next case"
          @click="goNext"
        />
        <span class="kbd-hint text-caption text-medium-emphasis">
          &larr;/&rarr; to move (⌘+&larr;/&rarr; while typing)
        </span>
      </div>
      <div class="bar-right">
        <v-switch
          v-model="filterNeedsWork"
          label="Needs work"
          density="compact"
          hide-details
          color="primary"
          class="needs-work-switch"
        />
        <v-chip v-if="dirtyCount" size="small" color="amber-darken-2" variant="tonal" label>
          {{ dirtyCount }} edited
        </v-chip>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          prepend-icon="mdi-content-save-outline"
          @click="openSerialize"
        >Serialize</v-btn>
      </div>
    </div>

    <div v-if="!currentCase" class="empty-state">
      <v-icon size="40" color="grey-lighten-1">mdi-check-all</v-icon>
      <p class="text-body-1 mt-3">No cases match the filter.</p>
    </div>

    <div v-else class="split">
      <!-- LEFT: read-only expected output -->
      <section class="pane pane-left">
        <header class="case-head">
          <div class="eyebrow">{{ currentCase.display.category }}</div>
          <h2 class="case-key">{{ currentCase.ref != null ? `corpus #${currentCase.ref}` : currentCase.id }}</h2>
        </header>

        <div class="block">
          <div class="block-label">OQL</div>
          <pre class="code-block">{{ currentCase.display.oql || "—" }}</pre>
        </div>

        <div class="block">
          <div class="block-label">OQO</div>
          <pre class="code-block">{{ currentCase.display.oqo ? toYaml(currentCase.display.oqo) : "—" }}</pre>
        </div>

        <div v-if="currentCase.display.oxurl" class="block">
          <div class="block-label">Run it</div>
          <a :href="currentCase.display.oxurl" target="_blank" rel="noopener" class="oxurl-link">
            <v-icon size="15" class="mr-1">mdi-open-in-new</v-icon>{{ prettyUrl(currentCase.display.oxurl) }}
          </a>
        </div>

        <div class="block">
          <div class="block-label">Provenance</div>
          <span class="prov">
            {{ currentCase.display.provenance.type || "—" }}
            <template v-if="currentCase.display.provenance.label">
              &mdash;
              <a
                v-if="currentCase.display.provenance.url"
                :href="currentCase.display.provenance.url"
                target="_blank"
                rel="noopener"
                class="prov-link"
              >{{ currentCase.display.provenance.label }}</a>
              <span v-else>{{ currentCase.display.provenance.label }}</span>
            </template>
          </span>
        </div>
      </section>

      <!-- RIGHT: editable NL formulations -->
      <section class="pane pane-right">
        <div class="right-head">
          <div class="block-label">
            NL formulations
            <span class="text-caption text-medium-emphasis">
              ({{ currentCase.nl.length }} &middot; {{ humanCount(currentCase) }} human)
            </span>
          </div>
        </div>

        <div
          v-for="(item, idx) in currentCase.nl"
          :key="cardKey(item, idx)"
          class="nl-card"
          :class="{ 'nl-card--human': item.source === 'human' }"
        >
          <div class="nl-text">{{ item.text }}</div>
          <div class="nl-controls">
            <v-btn-toggle
              :model-value="item.difficulty"
              density="compact"
              variant="outlined"
              divided
              mandatory
              @update:model-value="(d) => setDifficulty(item, d)"
            >
              <v-btn value="easy" size="x-small">easy</v-btn>
              <v-btn value="hard" size="x-small">hard</v-btn>
            </v-btn-toggle>
            <v-chip
              size="x-small"
              :color="item.source === 'human' ? 'green' : 'grey'"
              variant="tonal"
              label
            >{{ item.source }}</v-chip>
            <v-spacer />
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="small"
              color="red-darken-1"
              aria-label="Delete formulation"
              @click="removeItem(currentCase, idx)"
            />
          </div>
        </div>

        <!-- Blank add card -->
        <div class="nl-card nl-card--add">
          <v-textarea
            ref="draftEl"
            v-model="draft"
            placeholder="Add a formulation… (⌘+Enter)"
            rows="2"
            auto-grow
            density="compact"
            variant="outlined"
            hide-details
            @keydown.meta.enter.prevent="addDraft"
            @keydown.ctrl.enter.prevent="addDraft"
          />
          <div class="nl-controls">
            <v-btn-toggle
              v-model="draftDifficulty"
              density="compact"
              variant="outlined"
              divided
              mandatory
            >
              <v-btn value="easy" size="x-small">easy</v-btn>
              <v-btn value="hard" size="x-small">hard</v-btn>
            </v-btn-toggle>
            <v-spacer />
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              :disabled="!draft.trim()"
              prepend-icon="mdi-plus"
              @click="addDraft"
            >Add</v-btn>
          </div>
        </div>
      </section>
    </div>

    <!-- Undo snackbar -->
    <v-snackbar v-model="snack.show" :timeout="6000" location="bottom">
      {{ snack.text }}
      <template #actions>
        <v-btn variant="text" color="primary" @click="undoDelete">Undo</v-btn>
      </template>
    </v-snackbar>

    <!-- Serialize dialog -->
    <v-dialog v-model="serializeDialog" max-width="860" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          Serialize
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="serializeDialog = false" />
        </v-card-title>
        <v-card-text>
          <div class="text-body-2 mb-2">
            Paste the YAML below over
            <code>openalex-elastic-api/docs/oql/nl_eval.yaml</code>, then re-run
            <code>scripts/gen_nl_eval_source.py</code>. Only the
            <code>nl:</code> lines you touched will change.
          </div>

          <div class="block-label mt-3">Changelog</div>
          <pre class="code-block code-block--log">{{ changelogText || "(no changes yet)" }}</pre>

          <div class="d-flex align-center mt-4 mb-1">
            <div class="block-label">Full nl_eval.yaml</div>
            <v-spacer />
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-content-copy"
              @click="copyYaml"
            >Copy YAML</v-btn>
          </div>
          <pre class="code-block code-block--yaml">{{ serializedYaml }}</pre>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHead } from "@unhead/vue";
import { stringify as yamlStringify } from "yaml";
import { nlEvalSource } from "@/nlEvalSource";

defineOptions({ name: "PlaygroundNlAnnotate" });

const props = defineProps({
  caseId: { type: String, default: undefined },
});

const route = useRoute();
const router = useRouter();

// A case's stable URL key: the ref number (ints) or the standalone id ("NL-…").
// These never collide, so one slug addresses either shape.
const caseKey = (c) => (c.ref != null ? String(c.ref) : c.id);

// Working copy. We mutate `nl` in place; `head`/`display` stay read-only carriers.
// origDifficulty lets us detect difficulty edits for the changelog; the original
// `raw` line is the lossless serialize carrier (see gen_nl_eval_source.py).
const origCounts = {};
const cases = reactive(
  nlEvalSource.cases.map((c) => {
    origCounts[caseKey(c)] = c.nl.length;
    return {
      ref: c.ref,
      id: c.id,
      display: c.display,
      head: c.head,
      nl: c.nl.map((it) => ({ ...it, origDifficulty: it.difficulty })),
    };
  })
);

// --- needs-work filter + navigation ---------------------------------------
const filterNeedsWork = ref(false);
const needsWork = (c) => c.nl.length < 3 || c.nl.every((it) => it.source !== "human");
const visibleCases = computed(() => (filterNeedsWork.value ? cases.filter(needsWork) : cases));

const currentKey = ref(
  props.caseId && cases.some((c) => caseKey(c) === props.caseId)
    ? props.caseId
    : cases.length
      ? caseKey(cases[0])
      : null
);

const currentCase = computed(() => cases.find((c) => caseKey(c) === currentKey.value) || null);
const currentIndex = computed(() =>
  visibleCases.value.findIndex((c) => caseKey(c) === currentKey.value)
);
const position = computed(() => (currentIndex.value >= 0 ? currentIndex.value + 1 : 0));
const canPrev = computed(() => visibleCases.value.length > 0 && currentIndex.value !== 0);
const canNext = computed(
  () => visibleCases.value.length > 0 && currentIndex.value !== visibleCases.value.length - 1
);

const goPrev = () => {
  const list = visibleCases.value;
  if (!list.length) return;
  const i = currentIndex.value;
  currentKey.value = caseKey(list[i <= 0 ? list.length - 1 : i - 1]);
};
const goNext = () => {
  const list = visibleCases.value;
  if (!list.length) return;
  const i = currentIndex.value;
  currentKey.value = caseKey(list[i < 0 || i >= list.length - 1 ? 0 : i + 1]);
};

// If the filter hides the current case, snap to the first visible one.
watch(filterNeedsWork, () => {
  if (currentIndex.value < 0 && visibleCases.value.length) {
    currentKey.value = caseKey(visibleCases.value[0]);
  }
});

// --- URL <-> currentKey sync ----------------------------------------------
watch(
  () => props.caseId,
  (v) => {
    if (v && v !== currentKey.value && cases.some((c) => caseKey(c) === v)) currentKey.value = v;
  }
);
watch(
  currentKey,
  (v) => {
    if (v && route.params.id !== v) {
      router.replace({ name: "QueryNlAnnotate", params: { id: v } });
    }
  },
  { immediate: true }
);

useHead({
  title: computed(() => (currentCase.value ? `Annotate ${currentKey.value} — Query` : "Annotate — Query")),
});

// --- editing ---------------------------------------------------------------
// New/edited lines are (re)formatted; untouched lines keep their verbatim `raw`
// so serialize is byte-identical except where the user actually changed something.
const yamlQuote = (s) => JSON.stringify(s); // valid YAML double-quoted scalar
const formatLine = (text, difficulty, source) => {
  const base = `    - {text: ${yamlQuote(text)}, difficulty: ${difficulty}`;
  return source === "human" ? `${base}, source: human}` : `${base}}`;
};

const setDifficulty = (item, d) => {
  if (!d || item.difficulty === d) return;
  item.difficulty = d;
  // Preserve exact text quoting: swap only the difficulty token in the raw line.
  item.raw =
    item.raw && /, difficulty: (?:easy|hard)/.test(item.raw)
      ? item.raw.replace(/, difficulty: (?:easy|hard)/, `, difficulty: ${d}`)
      : formatLine(item.text, d, item.source);
};

const draft = ref("");
const draftDifficulty = ref("easy");
const draftEl = ref(null);

const addDraft = () => {
  const text = draft.value.trim();
  if (!text || !currentCase.value) return;
  currentCase.value.nl.push({
    text,
    difficulty: draftDifficulty.value,
    source: "human",
    origDifficulty: null,
    raw: formatLine(text, draftDifficulty.value, "human"),
  });
  draft.value = "";
  nextTick(() => draftEl.value?.focus());
};

const snack = reactive({ show: false, text: "" });
let undoData = null;
const removeItem = (c, idx) => {
  undoData = { key: caseKey(c), idx, item: c.nl[idx] };
  c.nl.splice(idx, 1);
  snack.text = `Deleted: "${truncate(undoData.item.text)}"`;
  snack.show = true;
};
const undoDelete = () => {
  if (!undoData) return;
  const c = cases.find((x) => caseKey(x) === undoData.key);
  if (c) c.nl.splice(Math.min(undoData.idx, c.nl.length), 0, undoData.item);
  undoData = null;
  snack.show = false;
};

const humanCount = (c) => c.nl.filter((it) => it.source === "human").length;
const truncate = (s) => (s.length > 48 ? s.slice(0, 47) + "…" : s);

// Distinct card key so Vue re-renders cleanly across add/delete (no stable id on
// items): combine source + a content hash-ish + index.
const cardKey = (item, idx) => `${item.source}:${idx}:${item.text.length}`;

// --- changelog + dirty count ----------------------------------------------
const caseDelta = (c) => {
  const key = caseKey(c);
  const addedHuman = c.nl.filter((it) => it.source === "human").length;
  const survivingAgent = c.nl.filter((it) => it.source !== "human").length;
  const removed = (origCounts[key] || 0) - survivingAgent;
  const editedDiff = c.nl.filter(
    (it) => it.source !== "human" && it.origDifficulty != null && it.difficulty !== it.origDifficulty
  ).length;
  return { key, addedHuman, removed, editedDiff };
};

const changelogText = computed(() =>
  cases
    .map(caseDelta)
    .filter((d) => d.addedHuman || d.removed || d.editedDiff)
    .map((d) => {
      const segs = [];
      if (d.addedHuman) segs.push(`+${d.addedHuman} human`);
      if (d.removed) segs.push(`−${d.removed} agent`);
      if (d.editedDiff) segs.push(`~${d.editedDiff} difficulty`);
      return `case ${d.key}: ${segs.join(", ")}`;
    })
    .join("\n")
);

const dirtyCount = computed(
  () => cases.map(caseDelta).filter((d) => d.addedHuman || d.removed || d.editedDiff).length
);

// --- serialize -------------------------------------------------------------
const serializeYaml = () => {
  const parts = [nlEvalSource.preamble];
  for (const c of cases) {
    parts.push(c.head);
    for (const it of c.nl) parts.push(it.raw);
  }
  parts.push(nlEvalSource.tail);
  return parts.join("\n");
};

const serializeDialog = ref(false);
const serializedYaml = ref("");
const openSerialize = () => {
  serializedYaml.value = serializeYaml();
  serializeDialog.value = true;
  copyToClipboard(serializedYaml.value, "YAML copied to clipboard");
};
const copyYaml = () => copyToClipboard(serializedYaml.value, "YAML copied to clipboard");
const copyToClipboard = async (text, msg) => {
  try {
    await navigator.clipboard.writeText(text);
    snack.text = msg;
    snack.show = true;
  } catch (e) {
    snack.text = "Copy failed — select the text manually.";
    snack.show = true;
  }
};

// --- keyboard nav ----------------------------------------------------------
const onKey = (e) => {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  const meta = e.metaKey || e.ctrlKey;
  const el = document.activeElement;
  const tag = (el?.tagName || "").toLowerCase();
  const typing = tag === "textarea" || tag === "input" || el?.isContentEditable;
  // Cmd/Ctrl+arrow always navigates (overriding Mac's cursor-to-line-edge);
  // bare arrows only when not typing.
  if (meta || !typing) {
    e.preventDefault();
    e.key === "ArrowLeft" ? goPrev() : goNext();
  }
};
onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));

const toYaml = (obj) => yamlStringify(obj).trimEnd();
const prettyUrl = (url) => {
  try {
    return decodeURIComponent(url);
  } catch (e) {
    return url;
  }
};
</script>

<style scoped>
.nl-annotate {
  max-width: 1200px;
  margin: 0 auto;
}
.annotate-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.bar-left,
.bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.progress {
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
  min-width: 64px;
  text-align: center;
}
.kbd-hint {
  margin-left: 6px;
}
.needs-work-switch {
  flex: 0 0 auto;
}
.split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}
.pane-left {
  position: sticky;
  top: 16px;
}
.case-head {
  margin-bottom: 16px;
}
.eyebrow {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(0, 0, 0, 0.5);
}
.case-key {
  font-family: "Roboto Mono", monospace;
  font-size: 1.25rem;
  font-weight: 600;
}
.block {
  margin-bottom: 16px;
}
.block-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.5);
  font-weight: 600;
  margin-bottom: 6px;
}
.code-block {
  font-family: "Roboto Mono", monospace;
  font-size: 0.8rem;
  background: rgba(0, 0, 0, 0.035);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 10px 12px;
  border-radius: 6px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}
.code-block--yaml {
  max-height: 340px;
  overflow: auto;
  font-size: 0.74rem;
}
.code-block--log {
  background: rgba(25, 118, 210, 0.06);
  border-color: rgba(25, 118, 210, 0.16);
  white-space: pre-wrap;
}
.oxurl-link {
  display: inline-flex;
  align-items: center;
  font-family: "Roboto Mono", monospace;
  font-size: 0.78rem;
  color: #1565c0;
  text-decoration: none;
  word-break: break-all;
}
.oxurl-link:hover {
  text-decoration: underline;
}
.prov {
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.8);
}
.prov-link {
  color: #1565c0;
  text-decoration: none;
}
.prov-link:hover {
  text-decoration: underline;
}
.right-head {
  margin-bottom: 10px;
}
.nl-card {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 10px;
  background: #fff;
}
.nl-card--human {
  border-color: rgba(46, 125, 50, 0.4);
  background: rgba(46, 125, 50, 0.03);
}
.nl-card--add {
  border-style: dashed;
  background: rgba(0, 0, 0, 0.015);
}
.nl-text {
  font-size: 0.92rem;
  line-height: 1.4;
  margin-bottom: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}
.nl-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
}
@media (max-width: 860px) {
  .split {
    grid-template-columns: 1fr;
  }
  .pane-left {
    position: static;
  }
}
</style>
