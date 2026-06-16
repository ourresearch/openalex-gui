<!--
  OqlEntityChip — the value chip for a resolved ENTITY value in the OQL builder
  (e.g. `institution is I97018004` → "Harvard University"). Converged onto the same
  click→menu pattern as the text chip (oxjob #467 round 2).

  Single-click SELECTS the chip (darker) and opens a context menu:
    New (Cmd/Ctrl+Enter) — add a sibling value to the right (emits `add`).
    Negate            — toggle "is" ↔ "is not" (emits `toggle-neg`; menu only, no shortcut).
    Delete (⌫)        — remove this value (sole value → parent prunes the clause).
  EDIT (re-opening the entity picker) is deliberately NOT here this round — re-picking
  a committed entity needs the builder's draft-only picker (parent territory); it's a
  deferred follow-up. So there's no double-click/Enter edit action and single-click opens
  the menu immediately.

  PURELY PRESENTATIONAL — owns no query state. Reads `tok` and emits intents the parent
  maps onto v2 edit ops. The negation `not` renders INSIDE the chip fill as a bold
  leading sub-part (LEGO negate), matching the text chip.

  Contract:
    prop  tok          reads: id, negated, _sole, _entityName / display / text.
    emit  toggle-neg   () — toggle negation.
    emit  add          () — add a sibling value to the right.
    emit  group        () — wrap this value in a new nested subgroup (#472; non-sole only).
    emit  remove       () — remove this value.
-->
<template>
  <!-- PLACEHOLDER: a not-yet-picked entity value (oxjob #428). Renders as the SAME
       green value chip as a committed value (no bespoke styling — Jason 2026-06-16:
       the placeholder must fit the normal syntax-highlighting system, so there's no
       jarring jump when the value is picked), marking WHERE the picked value lands
       while the invisible (anchorOnly) picker is open. Non-interactive — the user
       acts on the picker dropdown; abandoning it drops the draft + this placeholder. -->
  <span v-if="tok._placeholder" class="val-chip val-placeholder">{{ placeholderLabel }}</span>

  <v-menu v-else v-model="menuOpen" :open-on-click="false" location="bottom start" offset="6">
    <template #activator="{ props: mp }">
      <span v-bind="mp" class="val-chip" :class="{ selected: menuOpen, 'multi-selected': selected, dragging }"
        tabindex="0" draggable="true"
        @click="onClick" @keydown="onKeydown" @dragstart="onDragstart" @dragend="onDragend">
        <span v-if="tok.negated" class="notpfx">not</span>{{ entityName }}
      </span>
    </template>
    <v-card min-width="180" class="menu-card chip-menu" @keydown="onKeydown">
      <v-list density="compact" class="py-0">
        <v-list-item @click="onMenuPick('add')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-arrow-right</v-icon></template>
          <v-list-item-title>New</v-list-item-title>
          <template #append><OqlKbdHint :keys="[cmdLabel, 'enter']" /></template>
        </v-list-item>
        <!-- Group (wrap in a nested subgroup, #472) is DEFERRED for entity values: the
             empty sibling needs an entity picker, not the scalar text-box pending pattern.
             The `group` emit is wired through (ready for the entity follow-up); the menu
             item lands then. Scalar/search values get Group now (OqlTextChip). -->
        <v-list-item @click="onMenuPick('toggle-neg')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-cancel</v-icon></template>
          <v-list-item-title>{{ tok.negated ? "Remove negation" : "Negate" }}</v-list-item-title>
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
import { cmdLabel } from "@/components/Oql/platformKeys";
import "@/components/Oql/oqlChip.css"; // shared .val-chip + .chip-menu styles (all 3 chips)

const props = defineProps({
  tok: { type: Object, required: true },
  // multi-select (oxjob #472): is THIS chip in the selection / is ANY selection live.
  selected: { type: Boolean, default: false },
  selectionActive: { type: Boolean, default: false },
});
const emit = defineEmits(["toggle-neg", "add", "group", "remove", "select", "batch-menu", "select-clear"]);

const entityName = computed(() => props.tok._entityName || props.tok.display || props.tok.text);
const placeholderLabel = computed(() => props.tok._placeholderLabel || "new value");

// No double-click action this round (entity Edit/re-pick is deferred) → single-click
// opens the menu immediately, and plain Enter has nothing to edit (no onEnter). Cmd/Ctrl+
// Enter adds a sibling; Backspace/Delete deletes. (Negate is menu-only now — no shortcut.)
const { menuOpen, dragging, onClick, onKeydown, onDragstart, onDragend } = useChipShortcuts({
  idRef: () => props.tok.id,
  onCmdEnter: () => emit("add"),
  onDelete: () => emit("remove"),
  // multi-select gestures (oxjob #472)
  selectedRef: () => props.selected,
  selectionActiveRef: () => props.selectionActive,
  onSelect: (p) => emit("select", p),
  onBatchMenu: (el) => emit("batch-menu", el),
  onSelectClear: () => emit("select-clear"),
});

const onMenuPick = (action) => {
  menuOpen.value = false;
  emit(action); // add | toggle-neg | remove
};
</script>

<!-- All chip/menu styles live in the shared oqlChip.css (imported in the script). -->
