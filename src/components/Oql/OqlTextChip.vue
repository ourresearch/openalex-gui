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
    emit  select / batch-menu / select-clear — selection gestures (#472).
  NOTE focus: the <input> keeps :data-vid="tok.id" so the parent's focusValueSoon can land.
-->
<template>
  <span class="val-leaf" :class="{ negated: tok.negated }">
    <!-- DISPLAY: borderless teal chip; single-click selects, double-click edits -->
    <span v-if="!showInput" class="val-chip" :class="{ numeric: tok._numeric, selected: active, 'multi-selected': selected, dragging }"
      tabindex="0" :data-vid="tok.id" draggable="true"
      @click="onClick" @dblclick="onDblclick" @keydown="onKeydown"
      @dragstart="onDragstart" @dragend="onDragend">
      <span v-if="tok.negated" class="notpfx">not</span>{{ valueText }}
    </span>

    <!-- EDIT: bordered input. Shown while editing or for a still-empty value. -->
    <span v-else class="val-wrap" :class="{ numeric: tok._numeric }">
      <span v-if="tok.negated" class="notpfx">not</span>
      <input ref="inputEl" class="val-input" :type="tok._numeric ? 'number' : 'text'"
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
  "select", "batch-menu", "select-clear"]);

const valueText = computed(() => {
  const t = props.tok;
  return t.display != null ? t.display : (t.value != null ? t.value : t.text || "");
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
  if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) { editing.value = false; closingViaEnter.value = true; }
  else if (e.key === "Escape") { editing.value = false; e.target.blur(); }
  emit("value-keydown", e); // Enter (parent commits) / Backspace-at-col-0 un-negate / …
};
const onBlur = () => {
  editing.value = false;
  if (closingViaEnter.value) { closingViaEnter.value = false; return; }
  emit("value-blur");
};

// Single-click selects; double-click / Enter edits; Cmd/Ctrl+Enter new sibling; ⌫ deletes.
const { dragging, onClick, onDblclick, onKeydown, onDragstart, onDragend } = useChipShortcuts({
  idRef: () => props.tok.id,
  onEdit: startEdit,
  onCmdEnter: () => emit("add"),
  onDelete: () => emit("remove"),
  selectedRef: () => props.selected,
  selectionActiveRef: () => props.selectionActive,
  onSelect: (p) => emit("select", p),
  onBatchMenu: (el) => emit("batch-menu", el),
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
