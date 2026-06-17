<!--
  OqlFieldChip — the FIELD / property brick (`tok.t === 'col'`). Two modes:

    PICKER  (field not chosen yet — a fresh draft) — the field picker (SelectionMenu:
            popular + search-all + a "More" tour) so you can choose a property. This is
            the CREATION flow, not a context menu, so it stays in place. Emits
            select-field / more-fields / open-field-menu, with a Delete-filter footer.
    LOCKED  (committed field) — INERT DECORATION now (row-centric model, oxjob #475). A
            committed filter's PROPERTY can't change (it would orphan the values). The
            property is no longer individually selectable: a click on it bubbles up to the
            row's `.bline` band, which selects the whole filter (the row toolbar then carries
            the AND/OR toggle, numeric operator, and delete). The chip is just painted BLACK
            (`active`) when its whole filter is the selected row, as a shape indicator.

  PURELY PRESENTATIONAL — owns no query state.

  Contract:
    prop  tok           the `col` token. Reads: id, _column, _label, _draft, _predicate, _ops.
    prop  ctx           { allFieldKeys, popularFields, getFieldDisplayName, getFieldIcon,
                          openFieldMenuId, properties }.
    prop  active        this chip's whole filter is the selected row (→ black).
    emit  select-field  (key)  — PICKER: a property was chosen.
    emit  open-field-menu (bool)
    emit  more-fields   ()
    emit  delete-filter ()     — PICKER footer delete (LOCKED delete is the row toolbar).
-->
<template>
  <!-- LOCKED: committed field — INERT decoration (black when its filter is the selected row).
       Click bubbles to the `.bline` band → row selection. cursor:pointer inherited. -->
  <span v-if="locked" class="prop-chip-leaf" :class="{ selected: active }">{{ chipLabel }}</span>

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
import "@/components/Oql/oqlChip.css"; // shared .prop-chip-leaf styles

const props = defineProps({
  tok: { type: Object, required: true },
  ctx: { type: Object, default: () => ({}) },
  active: { type: Boolean, default: false },
});
defineEmits([
  "select-field", "open-field-menu", "more-fields", "delete-filter",
]);

// LOCKED once a real field is committed (a draft stays re-pickable while you build it).
const locked = computed(() => !!props.tok._column && !props.tok._draft);
// "keyword is" / "year ≥": the predicate is folded into this chip by the parent.
const chipLabel = computed(() =>
  props.tok._predicate ? `${props.tok._label} ${props.tok._predicate}` : props.tok._label);
</script>

<style scoped>
/* The committed (locked) field renders as the same grey `prop-chip` brick the picker
   shows, as a plain inert span (oxjob #475 — selection is the row, via the .bline band). */
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
/* selected → SOLID BLACK, white text (Jason 2026-06-17). Painted when the property's whole
   logical row is selected (oxjob #475 row selection). No focus/multi state (chip is inert). */
.prop-chip-leaf.selected { background: #1a1a1a; color: #fff; box-shadow: none; filter: none; outline: none; }

.prop-chip { cursor: pointer; }
.prop-chip,
.prop-chip.unset { background-color: var(--prop-bg, #ece8fe) !important; color: var(--prop-fg, #574d7a) !important; }
</style>
