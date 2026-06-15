<template>
  <v-dialog v-model="open" max-width="1180" scrollable>
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

      <!-- footer -->
      <div class="vcd-foot">
        <span class="text-caption text-medium-emphasis">
          Editing here doesn’t change your search until you choose “Use this query”.
        </span>
        <v-spacer />
        <v-btn variant="text" size="small" @click="open = false">Close</v-btn>
        <v-btn
          color="black"
          variant="flat"
          size="small"
          :disabled="!oql"
          @click="apply"
        >Use this query</v-btn>
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
 * Alignment (v1, oxjob #463): shared logical line numbers (both panes number lines,
 * and line N<->N holds for query lines because the editor mirrors the builder's
 * canonical OQL) + scroll & hover linking. A true pixel-banded grid is deferred —
 * the editor is CodeMirror and owns its own vertical layout.
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

// (re)seed both panes from the snapshot every time the dialog opens
watch(open, (isOpen) => {
  if (!isOpen) return;
  const seed = props.seedOql || "";
  oql.value = seed;
  editorText.value = seed;
  nextTick(attachSync);
});

// builder -> editor: mirror the builder's canonical OQL into the editor text.
// The builder only emits `update:oql` from its own render path (a real brick edit);
// its reseed-from-prop path (`rebuildFromOqo`) sets `lastEmittedOql` and stays silent,
// so an editor-driven push produces NO echo here — there is nothing to guard against,
// and we always mirror. (An earlier `reseedFromEditor` guard assumed an echo that never
// fires, so it stuck `true` after the first editor edit and swallowed the next genuine
// builder->editor update, desyncing the panes — oxjob #463 prod-verify, 2026-06-15.)
function onBuilderOql(s) {
  oql.value = s;
  editorText.value = s;
}

// editor -> builder: a valid parse pushes canonical OQL into `oql`, reseeding the
// builder (silently, via its prop watch). Invalid text emits nothing, so the builder
// holds its last good state. The builder's prop-watch dedupes (`incoming === lastEmittedOql`)
// and `OqlEditor` guards external sets (`applyingExternal`), so no loop forms.
function onEditorValid(v) {
  if (!v || !v.oql || v.oql === oql.value) return;
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
function builderRows() {
  return builderPane.value ? [...builderPane.value.querySelectorAll(".bline")] : [];
}
function cmLines() {
  return oqlPane.value ? [...oqlPane.value.querySelectorAll(".cm-line")] : [];
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

// hover linking: highlight the matching line on the other side (1-based logical line)
function highlight(line) {
  builderRows().forEach((el, i) => el.classList.toggle("vcd-hl", i === line - 1));
  cmLines().forEach((el, i) => el.classList.toggle("vcd-hl", i === line - 1));
}
function clearHighlight() { highlight(0); }

function indexOfAncestor(target, selector, list) {
  const el = target.closest && target.closest(selector);
  if (!el) return null;
  const i = list().indexOf(el);
  return i >= 0 ? i + 1 : null;
}

function attachSync() {
  detachSync();
  const bp = builderPane.value;
  const cm = cmScroller();
  if (!bp || !cm) return;

  const onBp = () => syncScroll(bp, cm);
  const onCm = () => syncScroll(cm, bp);
  bp.addEventListener("scroll", onBp, { passive: true });
  cm.addEventListener("scroll", onCm, { passive: true });

  const onBpHover = (e) => {
    const n = indexOfAncestor(e.target, ".bline", builderRows);
    if (n) highlight(n);
  };
  const onCmHover = (e) => {
    const n = indexOfAncestor(e.target, ".cm-line", cmLines);
    if (n) highlight(n);
  };
  bp.addEventListener("mouseover", onBpHover);
  bp.addEventListener("mouseleave", clearHighlight);
  cm.addEventListener("mouseover", onCmHover);
  cm.addEventListener("mouseleave", clearHighlight);

  detachers = [
    () => bp.removeEventListener("scroll", onBp),
    () => cm.removeEventListener("scroll", onCm),
    () => bp.removeEventListener("mouseover", onBpHover),
    () => bp.removeEventListener("mouseleave", clearHighlight),
    () => cm.removeEventListener("mouseover", onCmHover),
    () => cm.removeEventListener("mouseleave", clearHighlight),
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

/* line linking — highlight the hovered line and its counterpart. The targets live
   inside the child components, so reach them with :deep(). */
.vcd-col :deep(.bline.vcd-hl),
.vcd-col :deep(.cm-line.vcd-hl) {
  background: rgba(124, 77, 255, 0.10);
  border-radius: 4px;
}
</style>
