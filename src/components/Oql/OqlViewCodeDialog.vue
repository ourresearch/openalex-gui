<template>
  <v-dialog v-model="open" width="92vw" max-width="1600" scrollable>
    <v-card class="vcd-card">
      <!-- header -->
      <div class="vcd-head">
        <div>
          <div class="text-subtitle-1 font-weight-medium">View code</div>
          <div class="text-caption text-medium-emphasis">
            See how your query maps to OQL — edit either side and they stay in sync.
          </div>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="open = false" />
      </div>
      <v-divider />

      <!-- two columns over one query -->
      <div class="vcd-body">
        <div ref="builderPane" class="vcd-col vcd-col--builder">
          <div class="vcd-col-label">Builder</div>
          <OqlQueryBuilder
            :oql="oql"
            :entity="entity"
            standalone
            :show-header="false"
            :show-foot="false"
            :inline-run="false"
            @update:oql="onBuilderOql"
          />
        </div>

        <v-divider vertical />

        <div ref="oqlPane" class="vcd-col vcd-col--oql">
          <div class="vcd-col-label">OQL</div>
          <OqlEditor
            v-model="editorText"
            min-height="280px"
            max-height="60vh"
            @valid="onEditorValid"
          />
        </div>
      </div>

      <v-divider />

      <!-- footer: just Cancel / Apply (the action is clear from the labels). -->
      <div class="vcd-foot">
        <v-spacer />
        <v-btn variant="text" size="small" @click="open = false">Cancel</v-btn>
        <v-btn
          color="black"
          variant="flat"
          size="small"
          :disabled="!oql"
          @click="apply"
        >Apply</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * OqlViewCodeDialog — the #463 "view code" teaching modal.
 *
 * A host-agnostic modal that mounts the #428 builder and the #357/#441 OQL text
 * editor SIDE BY SIDE, both projections of one query. It is the PARENT of the
 * builder via `v-model:oql`; the builder knows nothing about this dialog.
 *
 *   left  = <OqlQueryBuilder standalone>  (bricks; emits canonical OQL)
 *   right = <OqlEditor>                   (editable OQL text; emits @valid on parse)
 *
 * Two-way sync over one canonical `oql` ref:
 *   - builder edit  -> `@update:oql` -> set `oql` + mirror into the editor text
 *   - editor edit   -> `@valid`      -> push canonical OQL into `oql` -> builder reseeds
 * Both child components already guard their own echo; an extra `reseedFromEditor`
 * flag here keeps a builder reseed from clobbering the user's raw editor text.
 *
 * Alignment (oxjob #428): both panes number their lines in the same code-block
 * style, and a proportional SCROLL sync keeps them roughly together. The old
 * line-for-line hover linking was removed — the builder re-derives its own
 * paren-based line breaks, so a builder line and an OQL line no longer correspond,
 * and pretending they did was misleading.
 */
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
import OqlQueryBuilder from "@/components/Oql/OqlQueryBuilder.vue";
import OqlEditor from "@/components/OqlPlayground/OqlEditor.vue";

const props = defineProps({
  // v-model: dialog open state
  modelValue: { type: Boolean, default: false },
  // snapshot of the query to seed both panes when the dialog opens
  seedOql: { type: String, default: null },
  // entity hint forwarded to the builder
  entity: { type: String, default: null },
});
const emit = defineEmits(["update:modelValue", "apply"]);

const open = ref(props.modelValue);
watch(() => props.modelValue, (v) => { open.value = v; });
watch(open, (v) => emit("update:modelValue", v));

// canonical query (drives the builder via :oql) and the raw editor text (v-model).
const oql = ref(props.seedOql || "");
const editorText = ref(props.seedOql || "");
// when an editor-typed query drives a builder reseed, the builder's resulting
// `update:oql` echo must NOT overwrite the user's raw editor text.
let reseedFromEditor = false;

// (re)seed both panes from the snapshot every time the dialog opens
watch(open, (isOpen) => {
  if (!isOpen) return;
  const seed = props.seedOql || "";
  reseedFromEditor = false;
  oql.value = seed;
  editorText.value = seed;
  nextTick(attachSync);
});

// builder -> editor: mirror the builder's canonical OQL into the editor text
function onBuilderOql(s) {
  oql.value = s;
  if (reseedFromEditor) { reseedFromEditor = false; return; } // editor-driven; keep raw text
  editorText.value = s;
}

// editor -> builder: a valid parse pushes canonical OQL into `oql`, reseeding the
// builder. Invalid text emits nothing, so the builder holds its last good state.
function onEditorValid(v) {
  if (!v || !v.oql || v.oql === oql.value) return;
  reseedFromEditor = true;
  oql.value = v.oql;
}

function apply() {
  if (!oql.value) return;
  emit("apply", oql.value);
  open.value = false;
}

// ---- line linking (scroll + hover) -----------------------------------------
const builderPane = ref(null);
const oqlPane = ref(null);
let detachers = [];

function cmScroller() {
  return oqlPane.value?.querySelector(".cm-scroller") || null;
}

// proportional scroll sync between the two panes
let lock = false;
function syncScroll(from, to) {
  if (lock || !from || !to) return;
  lock = true;
  const max = from.scrollHeight - from.clientHeight;
  const ratio = max > 0 ? from.scrollTop / max : 0;
  to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);
  requestAnimationFrame(() => { lock = false; });
}

function attachSync() {
  detachSync();
  const bp = builderPane.value;
  const cm = cmScroller();
  if (!bp || !cm) return;

  // proportional scroll sync only. The builder and OQL panes no longer share a
  // line-for-line mapping (the builder re-derives its own paren-based line breaks),
  // so the old hover line-linking was misleading and has been removed. (oxjob #428.)
  const onBp = () => syncScroll(bp, cm);
  const onCm = () => syncScroll(cm, bp);
  bp.addEventListener("scroll", onBp, { passive: true });
  cm.addEventListener("scroll", onCm, { passive: true });

  detachers = [
    () => bp.removeEventListener("scroll", onBp),
    () => cm.removeEventListener("scroll", onCm),
  ];
}
function detachSync() {
  detachers.forEach((fn) => fn());
  detachers = [];
}
onBeforeUnmount(detachSync);
</script>

<style scoped>
.vcd-card {
  display: flex;
  flex-direction: column;
  max-height: 88vh;
}
.vcd-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px 12px;
}
.vcd-body {
  display: flex;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
.vcd-col {
  flex: 1 1 50%;
  min-width: 0;
  overflow: auto;
  padding: 14px 16px;
}
.vcd-col--oql {
  background: #fbfbfd;
}
.vcd-col-label {
  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.4);
  margin-bottom: 8px;
}
.vcd-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
}

/* Builder pane: give the number gutter a continuous right rule so the two panes'
   line numbers read the same as the site code blocks (small gray right-aligned
   digits, thin separator) and trim the wasted space before the numbers. The
   builder draws its numbers as `.bline::before`, so the rule is one overlay on the
   lines container rather than a per-row border. */
.vcd-col--builder :deep(.tree-card) { padding-left: 8px; }
.vcd-col--builder :deep(.builder-lines) { position: relative; }
/* a faint gutter strip with a thin right rule, behind the line numbers — matches
   the OQL pane's CodeMirror gutter and the site code blocks. */
.vcd-col--builder :deep(.builder-lines)::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--num-w, 30px);
  background: rgba(0, 0, 0, 0.022);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}
/* keep the bricks (and their numbers) painting above the gutter strip */
.vcd-col--builder :deep(.bline) { position: relative; }
</style>
