<!--
  OqlEntityChip — the value chip for a resolved ENTITY value in the OQL builder
  (e.g. `institution is I97018004` → "Harvard University"). Converged onto the same
  click→menu pattern as the text chip (oxjob #467 round 2).

  Single-click SELECTS the chip (darker) and opens a context menu:
    New (Enter)   — add a sibling value to the right (emits `add`).
    Negate (⌥ click) — toggle "is" ↔ "is not" (emits `toggle-neg`).
    Delete (⌫)    — remove this value (sole value → parent prunes the clause).
  EDIT (re-opening the entity picker) is deliberately NOT here this round — re-picking
  a committed entity needs the builder's draft-only picker (parent territory); it's a
  deferred follow-up. So there's no double-click action and single-click opens the menu
  immediately.

  PURELY PRESENTATIONAL — owns no query state. Reads `tok` and emits intents the parent
  maps onto v2 edit ops. The negation `not` renders INSIDE the chip fill as a bold
  leading sub-part (LEGO negate), matching the text chip.

  Contract:
    prop  tok          reads: id, negated, _sole, _entityName / display / text.
    emit  toggle-neg   () — toggle negation.
    emit  add          () — add a sibling value to the right.
    emit  remove       () — remove this value.
-->
<template>
  <v-menu v-model="menuOpen" :open-on-click="false" location="bottom start" offset="6">
    <template #activator="{ props: mp }">
      <span v-bind="mp" class="val-chip" :class="{ selected: menuOpen }"
        tabindex="0" @click="onClick" @keydown="onKeydown">
        <span v-if="tok.negated" class="notpfx">not</span>{{ entityName }}
      </span>
    </template>
    <v-card min-width="180" class="menu-card chip-menu" @keydown="onKeydown">
      <v-list density="compact" class="py-0">
        <v-list-item @click="onMenuPick('add')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-arrow-right</v-icon></template>
          <v-list-item-title>New</v-list-item-title>
          <template #append><span class="mi-hint glyph">⏎</span></template>
        </v-list-item>
        <v-list-item @click="onMenuPick('toggle-neg')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-cancel</v-icon></template>
          <v-list-item-title>{{ tok.negated ? "Remove negation" : "Negate" }}</v-list-item-title>
          <template #append><span class="mi-hint glyph">⌥</span><span class="mi-hint">click</span></template>
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

const props = defineProps({
  tok: { type: Object, required: true },
});
const emit = defineEmits(["toggle-neg", "add", "remove"]);

const entityName = computed(() => props.tok._entityName || props.tok.display || props.tok.text);

// No double-click action this round (Edit deferred) → single-click opens the menu
// immediately. ⌥-click negates; Enter adds a sibling; Backspace/Delete deletes.
const { menuOpen, onClick, onKeydown } = useChipShortcuts({
  idRef: () => props.tok.id,
  onAltClick: () => emit("toggle-neg"),
  onEnter: () => emit("add"),
  onDelete: () => emit("remove"),
});

const onMenuPick = (action) => {
  menuOpen.value = false;
  emit(action); // add | toggle-neg | remove
};
</script>

<style scoped>
.val-chip {
  display: inline-flex;
  align-items: center;
  background: var(--val-bg, #d6f2ec);
  color: var(--val-fg, #14625c);
  border-radius: 6px;
  padding: 1px 8px;
  font-size: var(--brick-fs, 0.8125rem);
  line-height: 1.6;
  white-space: nowrap;
  cursor: pointer;
}
.val-chip:hover { filter: brightness(0.97); }
.val-chip.selected,
.val-chip:focus-visible { filter: brightness(0.9); box-shadow: 0 0 0 1.5px var(--val-fg, #14625c) inset; outline: none; }
.val-chip:focus { outline: none; }
.notpfx { font-weight: 700; font-size: var(--brick-fs, 0.8125rem); color: var(--val-fg, #14625c); margin-right: 4px; }

/* context menu — shared look with the text/boolean chips */
.chip-menu :deep(.v-list-item-title) { font-size: 0.8125rem; }
.chip-menu :deep(.v-list-item__prepend) { margin-inline-end: 0; }
.mi-icon { opacity: 0.7; margin-right: 8px; }
.mi-hint { color: rgba(0, 0, 0, 0.4); font-size: 0.75rem; margin-left: 18px; }
.mi-hint.glyph { font-size: 0.875rem; margin-left: 18px; margin-right: 2px; }
.mi-danger :deep(.v-list-item-title) { color: #b3261e; }
.mi-danger .mi-icon { color: #b3261e; opacity: 0.85; }
</style>
