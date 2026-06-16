<!--
  OqlParenChip — the parenthesis BLOCK control (`tok.t === 'paren'`) in the OQL
  builder. Part of the all-bricks componentization (oxjob #467). A grey monospace
  brick (`(` or `)`, both carrying the group id) that you CLICK for the group menu —
  now styled exactly like the value-chip context menu:

      New Filter (enter)  ·  New Clause  ·  Delete group (⌫)

  • New Filter — add a sibling flat filter beside the group (emits `add-filter`).
  • New Clause — start a new parenthesized subgroup (emits `new-clause`; oxjob #472).
  • Delete group — remove the whole parenthesized group.

  PURELY PRESENTATIONAL — owns no query state. Reads `tok`, emits intents.

  Contract:
    prop  tok           the `paren` token. Reads: id, text (`(` / `)`).
    emit  add-filter    () — New Filter: add a sibling flat filter.
    emit  new-clause    () — New Clause: start a new parenthesized subgroup (#472).
    emit  delete-group  () — remove the whole group.

  NB layout: `.paren-block` is fixed at 28px wide — #428's builder indent unit is
  `calc(28px + gap)`, so this width is LOAD-BEARING; keep it in lock-step if the
  indent math ever changes (oxjob #428).
-->
<template>
  <v-menu v-model="menuOpen" :open-on-click="false" location="bottom start" offset="6">
    <template #activator="{ props: mp }">
      <v-chip v-bind="mp" class="paren-block" :class="{ selected: menuOpen }" label size="small" variant="flat"
        tabindex="0" @click="onClick" @keydown="onKeydown">{{ tok.text }}</v-chip>
    </template>
    <v-card min-width="190" class="menu-card chip-menu" @keydown="onKeydown">
      <v-list density="compact" class="py-0">
        <v-list-item @click="onMenuPick('add-filter')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-plus</v-icon></template>
          <v-list-item-title>New Filter</v-list-item-title>
          <template #append><OqlKbdHint :keys="[cmdLabel, 'enter']" /></template>
        </v-list-item>
        <v-list-item @click="onMenuPick('new-clause')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-code-parentheses</v-icon></template>
          <v-list-item-title>New Clause</v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item class="mi-danger" @click="onMenuPick('delete-group')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-delete-outline</v-icon></template>
          <v-list-item-title>Delete group</v-list-item-title>
          <template #append><OqlKbdHint :keys="['⌫']" /></template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { useChipShortcuts } from "@/components/Oql/useChipShortcuts";
import OqlKbdHint from "@/components/Oql/OqlKbdHint.vue";
import { cmdLabel } from "@/components/Oql/platformKeys";
import "@/components/Oql/oqlChip.css"; // shared .chip-menu / .mi-* menu styles

const props = defineProps({
  tok: { type: Object, required: true },
});
const emit = defineEmits(["add-filter", "new-clause", "delete-group"]);

// Single-click → menu; Cmd/Ctrl+Enter = New Filter (the global "new to the right"
// shortcut); Backspace/Delete = delete the group. No double-click, no edit.
const { menuOpen, onClick, onKeydown } = useChipShortcuts({
  idRef: () => props.tok.id,
  onCmdEnter: () => emit("add-filter"),
  onDelete: () => emit("delete-group"),
});

const onMenuPick = (action) => {
  menuOpen.value = false;
  emit(action); // add-filter | new-clause | delete-group
};
</script>

<style scoped>
/* Mirrors OqlQueryBuilder's `.paren-block`: a grey clickable brick, fixed 28px so it
   == the builder's --indent unit exactly (border-box). #428 can delete its scoped copy
   once it swaps this component in. (oxjob #428 bug 1 / #467.) */
.paren-block {
  cursor: pointer;
  justify-content: center;
  flex: 0 0 auto;
  width: 28px;
  min-width: 28px;
  padding: 0;
  background: rgba(0, 0, 0, 0.07) !important;
  color: rgba(0, 0, 0, 0.6) !important;
  font-family: "JetBrains Mono", monospace;
  font-weight: 700 !important;
}
.paren-block:hover { background: rgba(0, 0, 0, 0.13) !important; color: rgba(0, 0, 0, 0.85) !important; }
.paren-block.selected,
.paren-block:focus { box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.4) inset; outline: none; }
</style>
