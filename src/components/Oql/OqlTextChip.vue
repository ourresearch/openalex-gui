<!--
  OqlTextChip — the inline-editable scalar/search value brick. Two visual modes:
    DISPLAY  — a committed value renders as a borderless teal value chip. Single-click
               SELECTS it (its actions appear in the toolbar); double-click / Enter / the
               toolbar "Edit" button switches to EDIT.
    EDIT     — a bordered <input>. Shown while editing (double-click / toolbar Edit / a
               freshly-added empty value). Commits back to DISPLAY on Enter / blur.

  Display-only chip menu was removed (oxjob #428 toolbar-actions move): Negate / Delete are
  now toolbar buttons. EDIT stays IN PLACE (text editing is best where the value lives, and
  it's editing — not a menu), triggered by the toolbar "Edit" (the `editOpen` prop) as well
  as double-click / Enter. The negation `not` renders INSIDE the chip fill as a bold leading
  sub-part; in EDIT mode Backspace-at-col-0 un-negates (via the parent).

  PURELY PRESENTATIONAL — owns only UI mode (`editing`); all query mutation is the parent's.

  Contract:
    prop  tok            the vbrick token. Reads: id, negated, _numeric, and display/value/text.
    prop  active         this chip is the highlighted one.
    prop  editOpen       toolbar "Edit" asked this chip to enter EDIT mode.
    emit  value-input / value-keydown / value-blur — input editing.
    emit  add            () — add a sibling value to the right (Cmd/Ctrl+Enter).
    emit  remove         () — remove this value (⌫).
    emit  select / select-clear — selection gestures (#472).
  NOTE focus: the <input> keeps :data-vid="tok.id" so the parent's focusValueSoon can land.
-->
<template>
  <span class="val-leaf" :class="{ negated: tok.negated }">
    <!-- DISPLAY: borderless teal chip; single-click selects + opens its menu, Enter edits -->
    <span v-if="!showInput" class="val-chip" :class="{ numeric: tok._numeric, selected: active, 'multi-selected': selected, dragging }"
      tabindex="0" :data-vid="tok.id" draggable="true"
      @click="onClick" @dblclick="onDblclick" @keydown="onKeydown"
      @dragstart="onDragstart" @dragend="onDragend">
      <!-- OQL grouping parens (#523 round 9): rendered INSIDE the chip fill, faded + low-key, as
           pure pedagogical scaffolding. They show only on the COMMITTED chip (this !showInput
           display branch) — never in the EDIT input below — so they're never part of editable text. -->
      <!-- #603 round 27 (Jason): a value joined by `or` carries the conjunction INSIDE
           the chip as a faded non-editable prefix — the connector chip is gone. -->
      <span v-if="tok._connPrefix" class="orpfx">{{ tok._connPrefix }}</span
      ><span v-if="tok._pOpen" class="val-paren">{{ '('.repeat(tok._pOpen) }}</span
      ><span v-if="tok.negated" class="notpfx">not</span>{{ valueText }}<span
      v-if="tok._pClose" class="val-paren">{{ ')'.repeat(tok._pClose) }}</span>
    </span>

    <!-- EDIT: bordered input — JUST an outline around the text area. (#595 round 4: the
         Enter/⇧Enter term-chaining is gone — Enter commits & ends the draft — so the #523
         hover-title hint went with it. Multi-term values are typed as `foo or bar`.) -->
    <span v-else class="val-wrap" :class="{ numeric: tok._numeric }">
      <span v-if="tok._connPrefix" class="orpfx">{{ tok._connPrefix }}</span>
      <span v-if="tok.negated" class="notpfx">not</span>
      <!-- #603 round 27 (Jason): numeric inputs are PLAIN TEXT now — the type="number"
           spinner chrome confused users, and it silently blocked the #527 expression
           syntax (`>2020`, `2000-2020`, `2020, 2021`) the commit path already parses. -->
      <input ref="inputEl" class="val-input" type="text"
        :value="valueText" :data-vid="tok.id"
        :placeholder="tok._numeric ? 'number' : 'text'" spellcheck="false"
        @input="$emit('value-input', $event)"
        @focus="onInputFocus"
        @keydown="onInputKeydown"
        @blur="onBlur" />
    </span>
  </span>
</template>

<script setup>
import { computed, ref, nextTick, watch } from "vue";
import { useChipShortcuts } from "@/components/Oql/useChipShortcuts";
import { proxSegments, surfaceSegments } from "@/components/Oql/proxSegments";
import "@/components/Oql/oqlChip.css"; // shared .val-chip styles

const props = defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
  editOpen: { type: Boolean, default: false },
  // multi-select (oxjob #472)
  selected: { type: Boolean, default: false },
  selectionActive: { type: Boolean, default: false },
});

const emit = defineEmits(["value-input", "value-keydown", "value-blur", "add", "remove",
  "select", "select-clear"]);

// The chip's surface text is the SERVER-BAKED display when there is one (#560 Phase 3):
// a factored vleaf's `display` / a simple clause's value-segment `text` already IS the
// canonical readable surface (`stemmed "…"`, `within N (…)`, `"…"`, bare term) — per-value
// exactness lives in that surface's own quoting, NOT in the clause column (which stays the
// stemmed BASE for a whole or-group even when this value is exact). Reconstructing the
// surface from (value, _column) wrongly relabeled exact phrases in or-groups as
// `stemmed "…"` — and, via the edit box showing that rewrite, converted their semantics
// on the next commit. So: render the baked surface and only BOLD its structural operator
// (surfaceSegments); fall back to proxSegments' value-driven `~`-string reconstruction
// (#514 — that shape is unambiguous whatever the column) for a canonical proximity value
// that never got a readable display.
// A `_rawInput` token holds the user's literal typed text, not yet routed to its
// `.search`/`.search.exact` column (#560 bug 2) — render it verbatim, no derivation at
// all; the server round-trip bakes the true surface.
const surfaceBase = (t) =>
  String(t.display != null ? t.display : (t.text != null ? t.text : (t.value != null ? t.value : "")));
const prox = computed(() => {
  const t = props.tok;
  if (t._rawInput) return null;
  return surfaceSegments(surfaceBase(t)) || proxSegments(t.value, t._column);
});

const valueText = computed(() => {
  // An operator-carrying value displays/edits as its readable surface form (the segments
  // concatenated), so editing shows the same text `searchSurfaceToFilter` parses back.
  if (prox.value) return prox.value.map((s) => s.text).join("");
  return surfaceBase(props.tok);
});

// Local UI mode (NOT query state): show the bordered input while actively editing, or
// whenever the value is still empty (a freshly-added box). `editing` is set on focus so a
// freshly-added box STAYS open as you type the first character.
const editing = ref(false);
const inputEl = ref(null);
const showInput = computed(() => editing.value || !String(valueText.value).length);
const closingViaEnter = ref(false);
const startEdit = () => {
  editing.value = true;
  nextTick(() => { inputEl.value?.focus(); inputEl.value?.select?.(); });
};
// The toolbar "Edit" button (or Enter routed through the builder) asks this chip to edit.
watch(() => props.editOpen, (v) => { if (v) startEdit(); });

const onInputFocus = () => { editing.value = true; };
const onInputKeydown = (e) => {
  // Enter (save) AND Cmd/Ctrl+Enter (save + add a sibling, oxjob #475) both LEAVE edit mode;
  // the parent's value-keydown decides whether to also add a sibling. closingViaEnter suppresses
  // the redundant blur-commit.
  if (e.key === "Enter") { editing.value = false; closingViaEnter.value = true; }
  else if (e.key === "Escape") { editing.value = false; e.target.blur(); }
  emit("value-keydown", e); // Enter (parent commits / +sibling) / Backspace-at-col-0 un-negate / …
};
const onBlur = () => {
  editing.value = false;
  if (closingViaEnter.value) { closingViaEnter.value = false; return; }
  emit("value-blur");
};

// Single-click selects + opens the menu; Enter edits; Cmd/Ctrl+Enter new sibling; ⌫ deletes.
const { dragging, onClick, onDblclick, onKeydown, onDragstart, onDragend } = useChipShortcuts({
  idRef: () => props.tok.id,
  onEdit: startEdit,
  onCmdEnter: () => emit("add"),
  onDelete: () => emit("remove"),
  selectedRef: () => props.selected,
  selectionActiveRef: () => props.selectionActive,
  onSelect: (p) => emit("select", p),
  onSelectClear: () => emit("select-clear"),
});
</script>

<style scoped>
/* .val-chip / .notpfx live in the shared oqlChip.css. Only the edit-mode box is here. */
.val-leaf { display: inline-flex; align-items: center; }

.val-wrap {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  height: 26px;
  gap: 2px;
  background: var(--val-bg, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--val-fg, rgba(0, 0, 0, 0.15));
  border-radius: 4px;
  padding: 0 8px;
}
.val-input {
  border: none; outline: none; background: transparent;
  font-size: var(--brick-fs, 0.8125rem); color: var(--val-fg, rgba(0, 0, 0, 0.87));
  min-width: 56px; max-width: 360px; field-sizing: content;
}
.val-input::placeholder { color: rgba(0, 0, 0, 0.4); }
.val-wrap.numeric .val-input { min-width: 72px; }
</style>
