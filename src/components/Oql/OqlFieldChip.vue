<!--
  OqlFieldChip — the FIELD / property brick (`tok.t === 'col'`). Two modes:

    PICKER  (field not chosen yet — a fresh draft) — the field picker (SelectionMenu:
            popular + search-all + a "More" tour) so you can choose a property. This is
            the CREATION flow, not a context menu, so it stays in place. Emits
            select-field / more-fields / open-field-menu, with a Delete-filter footer.
    LOCKED  (committed field) — display-only now (oxjob #428 toolbar-actions move). A
            committed filter's PROPERTY can't change (it would orphan the values), so the
            only edits are: change the comparison operator (NUMERIC fields) or re-point to
            a sibling SEARCH field — both of which moved to the builder toolbar's "Edit"
            popover. Delete moved to the toolbar too. So the locked chip just selects on
            click and asks the toolbar to open its editor on double-click / Enter.

  PURELY PRESENTATIONAL — owns no query state.

  Contract:
    prop  tok           the `col` token. Reads: id, _column, _label, _draft, _predicate, _ops.
    prop  ctx           { allFieldKeys, popularFields, getFieldDisplayName, getFieldIcon,
                          openFieldMenuId, properties }.
    prop  active        this chip is the highlighted one.
    emit  select-field  (key)  — PICKER: a property was chosen.
    emit  open-field-menu (bool)
    emit  more-fields   ()
    emit  delete-filter ()     — PICKER footer delete (LOCKED delete is the toolbar).
    emit  add-filter    ()     — Cmd/Ctrl+Enter: add a sibling flat filter.
    emit  request-edit  ()     — LOCKED: open the toolbar operator / search-field chooser.
    emit  select / batch-menu / select-clear — selection gestures (#472).
-->
<template>
  <!-- LOCKED: committed field — display-only selectable brick (editors live in the toolbar) -->
  <span v-if="locked" class="prop-chip-leaf" :class="{ selected: active, 'multi-selected': selected }"
    tabindex="0" @click="onClick" @dblclick="onDblclick" @keydown="onKeydown">{{ chipLabel }}</span>

  <!-- PICKER: field not chosen yet (a fresh draft) — choose a property -->
  <SelectionMenu v-else
    :open="ctx.openFieldMenuId === tok.id"
    :all-keys="ctx.allFieldKeys"
    :popular-keys="ctx.popularFields"
    :get-display-name="ctx.getFieldDisplayName"
    :get-icon="ctx.getFieldIcon"
    location="bottom start"
    :offset="[4, 0]"
    search-placeholder="Search all fields"
    custom-more
    @update:open="(v) => $emit('open-field-menu', v)"
    @select="(k) => $emit('select-field', k)"
    @more="$emit('more-fields')">
    <template #activator="{ props: mp }">
      <v-chip v-bind="mp" class="prop-chip" :class="{ unset: !tok._column }" label size="small"
        variant="flat">{{ chipLabel }}</v-chip>
    </template>
    <template #footer="{ close }">
      <v-list density="compact" class="py-0">
        <v-list-item class="filter-delete-item" @click="close(); $emit('delete-filter')">
          <template #prepend><v-icon size="18">mdi-delete-outline</v-icon></template>
          <v-list-item-title>Delete filter</v-list-item-title>
        </v-list-item>
      </v-list>
    </template>
  </SelectionMenu>
</template>

<script setup>
import { computed } from "vue";
import SelectionMenu from "@/components/Misc/SelectionMenu.vue";
import { useChipShortcuts } from "@/components/Oql/useChipShortcuts";
import "@/components/Oql/oqlChip.css"; // shared .prop-chip-leaf styles

const props = defineProps({
  tok: { type: Object, required: true },
  ctx: { type: Object, default: () => ({}) },
  active: { type: Boolean, default: false },
  // multi-select (oxjob #472): a whole filter is selectable via its field chip.
  selected: { type: Boolean, default: false },
  selectionActive: { type: Boolean, default: false },
});
const emit = defineEmits([
  "select-field", "open-field-menu", "more-fields",
  "delete-filter", "add-filter", "request-edit",
  "select", "batch-menu", "select-clear",
]);

// LOCKED once a real field is committed (a draft stays re-pickable while you build it).
const locked = computed(() => !!props.tok._column && !props.tok._draft);
// "keyword is" / "year ≥": the predicate is folded into this chip by the parent.
const chipLabel = computed(() =>
  props.tok._predicate ? `${props.tok._label} ${props.tok._predicate}` : props.tok._label);

// Single-click selects; double-click / Enter opens the toolbar editor (operator / search-
// field chooser, when the field has one); Cmd/Ctrl+Enter adds a sibling filter; ⌫ deletes
// the whole filter (routed by the parent).
const { onClick, onDblclick, onKeydown } = useChipShortcuts({
  idRef: () => props.tok.id,
  onEdit: () => emit("request-edit"),
  onCmdEnter: () => emit("add-filter"),
  onDelete: () => emit("delete-filter"),
  selectedRef: () => props.selected,
  selectionActiveRef: () => props.selectionActive,
  onSelect: (p) => emit("select", p),
  onBatchMenu: (el) => emit("batch-menu", el),
  onSelectClear: () => emit("select-clear"),
});
</script>

<style scoped>
/* The committed (locked) field renders as the same grey `prop-chip` brick the picker
   shows, as a plain span so it can carry tabindex/focus for the keyboard shortcuts. */
.prop-chip-leaf {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  height: 26px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: var(--brick-fs, 0.8125rem);
  background: var(--prop-bg, #ece8fe);
  color: var(--prop-fg, #574d7a);
  white-space: nowrap;
  cursor: pointer;
}
.prop-chip-leaf:hover { filter: brightness(0.97); }
/* selected → SOLID BLACK, white text (Jason 2026-06-17). Used both for a single-clicked
   property AND when the property's whole logical row is selected (#428 row selection). */
.prop-chip-leaf.selected,
.prop-chip-leaf:focus { background: #1a1a1a; color: #fff; box-shadow: none; filter: none; outline: none; }
.prop-chip-leaf.multi-selected,
.prop-chip-leaf.multi-selected:focus { filter: brightness(0.92); box-shadow: 0 0 0 2px var(--prop-fg, #574d7a); outline: none; }

.prop-chip { cursor: pointer; }
.prop-chip,
.prop-chip.unset { background-color: var(--prop-bg, #ece8fe) !important; color: var(--prop-fg, #574d7a) !important; }
</style>
