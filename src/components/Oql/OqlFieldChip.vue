<!--
  OqlFieldChip — the FIELD / property brick (`tok.t === 'col'`) in the OQL builder.
  Part of the all-bricks componentization (oxjob #467). Two modes:

    PICKER  (field not chosen yet — a fresh draft) — the existing field picker
            (SelectionMenu: popular + search-all + a "More" tour) so you can choose
            a property. Emits `select-field` / `more-fields` / `open-field-menu`,
            with a Delete-filter footer.
    LOCKED  (committed field — `tok._column` set, not a draft) — a value-chip-style
            context menu. A committed filter's PROPERTY is NOT editable: changing it
            would leave the existing values meaningless. So the menu is just:
              New Filter (enter)  ·  New Clause (stub)  ·  Delete filter (⌫)
            EXCEPTION — a SEARCH field (`title/abstract`, `full text`, …): the value
            stays meaningful across search surfaces, so the menu ALSO lists the
            sibling search fields ABOVE a divider; picking one re-points the filter
            (`change-field`) without retyping.

  PURELY PRESENTATIONAL — owns no query state. Reads `tok` + a `ctx` bag of catalog
  helpers from the parent and emits semantic intents the parent maps onto the v2
  edit ops. `searchFieldSiblings` is a pure catalog helper (no store coupling).

  Contract:
    prop  tok           the `col` token. Reads: id, _column, _label, _draft.
    prop  ctx           { allFieldKeys, popularFields, getFieldDisplayName,
                          getFieldIcon, openFieldMenuId, properties }.
    emit  select-field  (key)      — PICKER: a property was chosen.
    emit  open-field-menu (bool)   — PICKER: the picker opened/closed (controlled).
    emit  more-fields   ()         — PICKER: open the categorized "More" dialog.
    emit  delete-filter ()         — remove this whole filter.
    emit  add-filter    ()         — New Filter: add a sibling filter (works).
    emit  new-clause    ()         — New Clause: add a sub-clause (STUB for now).
    emit  change-field  (column_id)— SEARCH only: re-point to another search field.
-->
<template>
  <!-- LOCKED: committed field — value-chip-style menu, no field re-pick (except search) -->
  <v-menu v-if="locked" v-model="menuOpen" :open-on-click="false" location="bottom start" offset="6">
    <template #activator="{ props: mp }">
      <span v-bind="mp" class="prop-chip-leaf" :class="{ selected: menuOpen }"
        tabindex="0" @click="onClick" @keydown="onKeydown">{{ tok._label }}</span>
    </template>
    <v-card min-width="190" class="menu-card chip-menu" @keydown="onKeydown">
      <v-list density="compact" class="py-0">
        <!-- SEARCH fields: re-point to a sibling search surface, then a divider -->
        <template v-if="searchSiblings.length">
          <v-list-item v-for="s in searchSiblings" :key="s.column_id" @click="onMenuPick('change-field', s.column_id)">
            <template #prepend><v-icon size="16" class="mi-icon">mdi-magnify</v-icon></template>
            <v-list-item-title>{{ s.label }}</v-list-item-title>
          </v-list-item>
          <v-divider />
        </template>

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
        <v-list-item class="mi-danger" @click="onMenuPick('delete-filter')">
          <template #prepend><v-icon size="16" class="mi-icon">mdi-delete-outline</v-icon></template>
          <v-list-item-title>Delete filter</v-list-item-title>
          <template #append><span class="mi-hint glyph">⌫</span></template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>

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
        :variant="tok._column ? 'flat' : 'outlined'">{{ tok._label }}</v-chip>
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
import { searchFieldSiblings } from "@/components/OqlPlayground/oqoTree";
import "@/components/Oql/oqlChip.css"; // shared .chip-menu / .mi-* menu styles

const props = defineProps({
  tok: { type: Object, required: true },
  ctx: { type: Object, default: () => ({}) },
});
const emit = defineEmits([
  "select-field", "open-field-menu", "more-fields",
  "delete-filter", "add-filter", "new-clause", "change-field",
]);

// LOCKED once a real field is committed (a draft stays re-pickable while you build it).
const locked = computed(() => !!props.tok._column && !props.tok._draft);
const searchSiblings = computed(() => searchFieldSiblings(props.ctx.properties, props.tok._column));

// No double-click / no ⌥-click on a field. Single-click → menu; Enter = New Filter;
// Backspace/Delete = delete the filter.
const { menuOpen, onClick, onKeydown } = useChipShortcuts({
  idRef: () => props.tok.id,
  onEnter: () => emit("add-filter"),
  onDelete: () => emit("delete-filter"),
});

const onMenuPick = (action, payload) => {
  menuOpen.value = false;
  if (action === "change-field") emit("change-field", payload);
  else emit(action); // add-filter | new-clause | delete-filter
};
</script>

<style scoped>
/* The committed (locked) field renders as the same grey `prop-chip` brick the
   picker shows — minus the dropdown caret (clicking a block always opens its menu,
   so the caret is redundant). It reuses the builder's prop-chip role styling but as
   a plain span so it can carry tabindex/focus for the ⌫/enter shortcuts. */
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
.prop-chip-leaf.selected,
.prop-chip-leaf:focus { filter: brightness(0.92); box-shadow: 0 0 0 1.5px var(--prop-fg, #574d7a) inset; outline: none; }
</style>
