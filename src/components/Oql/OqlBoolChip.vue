<!--
  OqlBoolChip — the value chip for a BOOLEAN value in the OQL builder. Covers both
  kinds of boolean brick:
    • boolean PHRASE (`tok._boolPhrase`)   — a combined predicate+value ("it's open
      access"); the phrase text itself carries the negation. Negate → emit toggle-neg.
    • true/false value (`tok._kind === 'boolean'`, phrase-less bool fields) — shows
      `true`/`false`; "negate" flips the value. Negate → emit pick-bool(!value).

  Converged onto the same click→menu pattern as the other chips (oxjob #467 round 2).
  A boolean is a HYBRID property+value brick, so besides negate/delete it also carries
  the filter-level affordances the property chips get:
    Negate (double-click) · New Filter (enter) · New Clause (stub) · Delete (⌫)
  — double-click negates (feels natural for a 2-state thing), and there is NO ⌥-click
  negate gesture/hint here (unlike the text/entity chips). Single-click opens the menu.
  "New Filter" adds a sibling filter (works); "New Clause" is a stub (no subclause
  support yet).

  PURELY PRESENTATIONAL — owns no query state.

  Contract:
    prop  tok          reads: id, negated, value, text, _boolPhrase, _kind.
    emit  toggle-neg   () — boolean PHRASE: toggle the negative phrase.
    emit  pick-bool    (Boolean) — true/false value: set the (flipped) value.
    emit  add-filter   () — New Filter: add a sibling filter (works).
    emit  new-clause   () — New Clause: add a sub-clause (STUB for now).
    emit  remove       () — remove this value.
-->
<template>
  <v-menu v-model="menuOpen" :open-on-click="false" location="bottom start" offset="6">
    <template #activator="{ props: mp }">
      <span v-bind="mp" class="val-chip" :class="{ selected: menuOpen, negated: tok.negated, dragging }"
        tabindex="0" draggable="true"
        @click="onClick" @dblclick="onDblclick" @keydown="onKeydown"
        @dragstart="onDragstart" @dragend="onDragend">
        {{ label }}
      </span>
    </template>
    <v-card min-width="170" class="menu-card chip-menu" @keydown="onKeydown">
      <v-list density="compact" class="py-0">
        <v-list-item @click="onMenuPick('negate')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-cancel</v-icon></template>
          <v-list-item-title>Negate</v-list-item-title>
          <template #append><span class="mi-hint">double-click</span></template>
        </v-list-item>
        <v-list-item @click="onMenuPick('add-filter')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-plus</v-icon></template>
          <v-list-item-title>New Filter</v-list-item-title>
          <template #append><span class="mi-hint">enter</span></template>
        </v-list-item>
        <v-list-item @click="onMenuPick('new-clause')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-code-parentheses</v-icon></template>
          <v-list-item-title>New Clause</v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item class="mi-danger" @click="onMenuPick('remove')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-delete-outline</v-icon></template>
          <v-list-item-title>Delete</v-list-item-title>
          <template #append><span class="mi-hint glyph">⌫</span></template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { computed } from "vue";
import { useChipShortcuts } from "@/components/Oql/useChipShortcuts";
import "@/components/Oql/oqlChip.css"; // shared .val-chip + .chip-menu styles (all 3 chips)

const props = defineProps({
  tok: { type: Object, required: true },
});
const emit = defineEmits(["toggle-neg", "pick-bool", "add-filter", "new-clause", "remove"]);

const isPhrase = computed(() => !!props.tok._boolPhrase);
const label = computed(() => (isPhrase.value ? props.tok.text : String(props.tok.value)));

// "Negate" means: flip the phrase (boolPhrase) or flip the true/false value.
const doNegate = () => {
  if (isPhrase.value) emit("toggle-neg");
  else emit("pick-bool", !props.tok.value);
};

// Double-click = negate; single-click → menu; Enter = New Filter; Backspace/Delete =
// delete. No ⌥-click for booleans.
const { menuOpen, dragging, onClick, onDblclick, onKeydown, onDragstart, onDragend } = useChipShortcuts({
  idRef: () => props.tok.id,
  onDouble: doNegate,
  onEnter: () => emit("add-filter"),
  onDelete: () => emit("remove"),
});

const onMenuPick = (action) => {
  menuOpen.value = false;
  if (action === "negate") doNegate();
  else emit(action); // add-filter | new-clause | remove
};
</script>

<!-- All chip/menu styles live in the shared oqlChip.css (imported in the script). -->
