<!--
  OqlBoolChip — the value chip for a BOOLEAN value in the OQL builder. Covers both
  kinds of boolean brick:
    • true/false value (`tok._kind === 'boolean'`, phrase-less bool fields) — shows
      `true`/`false`; the two options are True / False.
    • boolean PHRASE (`tok._boolPhrase`)   — a combined predicate+value ("it's open
      access"); the two options are the affirmative phrasing and its negation, and
      "picking" the other one toggles negation.

  Interaction model (oxjob #467, revised 2026-06-16 — matches the connector chip so the
  two read as one pattern):
    • SINGLE-CLICK opens a dropdown with the TWO value options, each with a checkbox in
      front so it's clear which is active; a divider; then Delete.
    • DOUBLE-CLICK toggles the value directly (true⇄false / negate the phrase).
    • Backspace/Delete (chip focused or menu open) deletes.
  The ⌥-click negate gesture and the New Filter / New Clause items were dropped — the
  two-option picker subsumes negate, and Jason scoped the menu to "two options + Delete".

  PURELY PRESENTATIONAL — owns no query state.

  Contract:
    prop  tok          reads: id, negated, value, text, _boolPhrase, _kind.
    emit  toggle-neg   () — boolean PHRASE: toggle the negative phrasing.
    emit  pick-bool    (Boolean) — true/false value: set the chosen value.
    emit  remove       () — remove this value.
-->
<template>
  <v-menu v-model="menuOpen" :open-on-click="false" location="bottom start" offset="6">
    <template #activator="{ props: mp }">
      <span v-bind="mp" class="val-chip" :class="{ selected: menuOpen, 'multi-selected': selected, negated: tok.negated, dragging }"
        tabindex="0" draggable="true"
        @click="onClick" @dblclick="onDblclick" @keydown="onKeydown"
        @dragstart="onDragstart" @dragend="onDragend">
        {{ label }}
      </span>
    </template>
    <v-card min-width="170" class="menu-card chip-menu" @keydown="onKeydown">
      <v-list density="compact" class="py-0">
        <v-list-item v-for="(opt, i) in options" :key="i" @click="pick(opt)">
          <template #prepend>
            <v-icon size="16" class="mi-check" :class="{ on: opt.selected }">
              {{ opt.selected ? "mdi-checkbox-marked" : "mdi-checkbox-blank-outline" }}
            </v-icon>
          </template>
          <v-list-item-title>{{ opt.label }}</v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item class="mi-danger" @click="onMenuPick('remove')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-delete-outline</v-icon></template>
          <v-list-item-title>Delete</v-list-item-title>
          <template #append><OqlKbdHint :keys="['⌫']" /></template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { computed } from "vue";
import { useChipShortcuts } from "@/components/Oql/useChipShortcuts";
import OqlKbdHint from "@/components/Oql/OqlKbdHint.vue";
import "@/components/Oql/oqlChip.css"; // shared .val-chip + .chip-menu styles (all chips)

const props = defineProps({
  tok: { type: Object, required: true },
  // multi-select (oxjob #472): is THIS chip in the selection / is ANY selection live.
  selected: { type: Boolean, default: false },
  selectionActive: { type: Boolean, default: false },
});
const emit = defineEmits(["toggle-neg", "pick-bool", "remove", "select", "batch-menu", "select-clear"]);

const isPhrase = computed(() => !!props.tok._boolPhrase);
const truthy = computed(() => props.tok.value === true || props.tok.value === "true");
const label = computed(() => (isPhrase.value ? props.tok.text : String(props.tok.value)));

// Derive the affirmative / negated phrasings for a boolean PHRASE from its current text.
// Heuristic (English-ish, best-effort): the menu LABELS are cosmetic — the action is a
// plain negation toggle, which is always correct regardless of how the label reads.
function phraseForms(text, negated) {
  const t = String(text || "").trim();
  if (negated) {
    const aff = t.replace(/\bnot\s+/i, "").replace(/n['’]t\b/i, "").replace(/\s{2,}/g, " ").trim();
    return { affirmative: aff || t, negative: t };
  }
  let neg;
  if (/^it['’]?s\b/i.test(t)) neg = t.replace(/^(it['’]?s)\b/i, "$1 not");
  else if (/^(is|are|was|were|has|have|does|do)\b/i.test(t)) neg = t.replace(/^(\w+)\b/i, "$1 not");
  else neg = "not " + t;
  return { affirmative: t, negative: neg };
}

// The two dropdown options. `selected` drives the checkbox; `act` makes the chip match
// that option (a no-op when it already does — picking the active one just closes).
const options = computed(() => {
  if (isPhrase.value) {
    const { affirmative, negative } = phraseForms(props.tok.text, props.tok.negated);
    const neg = !!props.tok.negated;
    return [
      { label: affirmative, selected: !neg, act: () => { if (neg) emit("toggle-neg"); } },
      { label: negative, selected: neg, act: () => { if (!neg) emit("toggle-neg"); } },
    ];
  }
  const v = truthy.value;
  return [
    { label: "True", selected: v, act: () => { if (!v) emit("pick-bool", true); } },
    { label: "False", selected: !v, act: () => { if (v) emit("pick-bool", false); } },
  ];
});

// Double-click toggles the value directly: flip the phrase's negation, or flip true/false.
const doToggle = () => {
  if (isPhrase.value) emit("toggle-neg");
  else emit("pick-bool", !truthy.value);
};

// Double-click = toggle; single-click → menu; Backspace/Delete = delete. No Enter/
// Cmd+Enter (a boolean has no sibling-value or edit action).
const { menuOpen, dragging, onClick, onDblclick, onKeydown, onDragstart, onDragend } = useChipShortcuts({
  idRef: () => props.tok.id,
  onDouble: doToggle,
  onDelete: () => emit("remove"),
  // multi-select gestures (oxjob #472)
  selectedRef: () => props.selected,
  selectionActiveRef: () => props.selectionActive,
  onSelect: (p) => emit("select", p),
  onBatchMenu: (el) => emit("batch-menu", el),
  onSelectClear: () => emit("select-clear"),
});

const pick = (opt) => { menuOpen.value = false; opt.act(); };
const onMenuPick = (action) => { menuOpen.value = false; if (action === "remove") emit("remove"); };
</script>

<!-- All chip/menu styles live in the shared oqlChip.css (imported in the script). -->
