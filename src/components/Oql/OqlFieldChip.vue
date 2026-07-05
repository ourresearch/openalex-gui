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
            (`active`) when it sits on a selected row's line (selecting a row blacks out ALL
            its chips — Jason 2026-06-17).

  PURELY PRESENTATIONAL — owns no query state.

  Contract:
    prop  tok           the `col` token. Reads: id, _column, _label, _draft, _predicate, _ops.
    prop  ctx           { allFieldKeys, popularFields, getFieldDisplayName, getFieldIcon,
                          openFieldMenuId, properties }.
    prop  active        this chip is on a selected row's line (→ black).
    emit  select-field  (key)  — PICKER: a property was chosen.
    emit  open-field-menu (bool)
    emit  more-fields   ()
    emit  delete-filter ()     — PICKER footer delete (LOCKED delete is the row toolbar).
-->
<template>
  <!-- LOCKED: committed field — clicking it opens the filter-property dropdown menu
       (oxjob #475 menus-on-chips pivot). Black when its filter row is selected. -->
  <span v-if="locked" class="prop-chip-leaf" :class="{ selected: active }"
    @click.stop="$emit('menu', $event.currentTarget, $event)">{{ chipLabel }}</span>

  <!-- PICKER: field not chosen yet (a fresh draft) — choose a property. TYPE-ON-CHIP
       (oxjob #561): while NO field is picked yet, the chip is the search input — the user
       types the field name on the chip and the menu below shows only options (no search
       box). Once the draft has a field, the chip shows its label as before (re-pickable). -->
  <SelectionMenu v-else
    ref="menuEl"
    :open="ctx.openFieldMenuId === tok.id"
    :all-keys="ctx.allFieldKeys"
    :popular-keys="ctx.popularFields"
    :get-display-name="ctx.getFieldDisplayName"
    :get-icon="ctx.getFieldIcon"
    location="bottom start"
    :offset="[4, 0]"
    search-placeholder="Search all fields"
    custom-more
    :external-search="typeOn ? fieldQuery : null"
    :card-style="menuCardStyle"
    @update:open="(v) => $emit('open-field-menu', v)"
    @select="(k) => $emit('select-field', k)"
    @more="$emit('more-fields')">
    <template #activator="{ props: mp }">
      <v-chip v-if="tok._column" v-bind="mp" class="prop-chip" label size="small"
        variant="flat">{{ chipLabel }}</v-chip>
      <span v-else v-bind="mp" class="prop-chip-leaf prop-typeon">
        <input ref="fieldInput" class="typeon-input" :data-vid="tok.id" placeholder="field"
          spellcheck="false" autocomplete="off"
          @input="fieldQuery = $event.target.value"
          @keydown="onFieldKeydown"
          @click.stop @mousedown.stop />
      </span>
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
import { computed, ref, watch, nextTick } from "vue";
import SelectionMenu from "@/components/Misc/SelectionMenu.vue";
import { OQL_ROLE_CSS_VARS } from "@/components/Oql/oqlPalette";
import "@/components/Oql/oqlChip.css"; // shared .prop-chip-leaf styles

const props = defineProps({
  tok: { type: Object, required: true },
  ctx: { type: Object, default: () => ({}) },
  active: { type: Boolean, default: false },
});
const emit = defineEmits([
  "select-field", "open-field-menu", "more-fields", "delete-filter", "menu",
]);

// LOCKED once a real field is committed (a draft stays re-pickable while you build it).
const locked = computed(() => !!props.tok._column && !props.tok._draft);
// "keyword is" / "year ≥": the predicate is folded into this chip by the parent.
const chipLabel = computed(() =>
  props.tok._predicate ? `${props.tok._label} ${props.tok._predicate}` : props.tok._label);

// The field menu extends its chip's COLOUR (oxjob #561; monospace dropped per Jason
// follow-up). Inline values (not CSS vars) — the menu card teleports to <body>, outside the
// .builder ancestor that carries the palette vars. --menu-hl: hover/keyboard-highlight rows
// use the peach family's darker hover shade instead of Vuetify's grey overlay.
const menuCardStyle = {
  backgroundColor: OQL_ROLE_CSS_VARS["--prop-bg"],
  color: OQL_ROLE_CSS_VARS["--prop-fg"],
  "--menu-hl": OQL_ROLE_CSS_VARS["--prop-bg-hov"],
};

// TYPE-ON-CHIP field search (oxjob #561): the query typed on the chip input; drives the
// SelectionMenu's external-search mode. Arrow/Enter navigate the menu remotely; Escape (or
// Backspace on an empty input) closes it, which runs the builder's field-less-draft cleanup.
const fieldQuery = ref("");
const fieldInput = ref(null);
const menuEl = ref(null);
// Whether THIS menu-open session is type-on (no field picked yet at open time). Snapshotted at
// open — NOT live off `tok._column` — so picking a field doesn't flip the still-mounted
// (closing) menu into its classic mode: that mid-close re-render mounted the internal
// `autofocus` search box, which stole focus from the value box the builder had just focused
// and got the fresh draft culled as abandoned (oxjob #560 Phase 2). The next open re-snapshots,
// so a committed-field re-pick still gets the classic embedded search box.
const typeOn = ref(!props.tok._column);
watch(() => props.ctx.openFieldMenuId === props.tok.id, (open) => {
  if (open) { typeOn.value = !props.tok._column; fieldQuery.value = ""; nextTick(() => fieldInput.value?.focus()); }
});
const onFieldKeydown = (e) => {
  // stopPropagation everywhere: the input sits INSIDE the v-menu's activator element, and a
  // bubbling Enter/Space/ArrowDown would hit Vuetify's activator keyboard handling and
  // re-toggle the menu we just acted on.
  if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); menuEl.value?.moveHl(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); menuEl.value?.moveHl(-1); }
  else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); menuEl.value?.selectHl(); }
  else if (e.key === "Escape" || (e.key === "Backspace" && !e.target.value)) {
    e.preventDefault(); e.stopPropagation(); emit("open-field-menu", false);
  }
  else if (e.key === " ") e.stopPropagation();
};
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
/* Hover → a DARKER tint of the field's own (orange) hue, not a grey wash (#507 hover-bug
   fix, Jason 2026-06-24; supersedes the old rgba(0,0,0,0.16) black-swap that desaturated
   the colour toward grey). */
.prop-chip-leaf:hover { background: var(--prop-bg-hov, rgba(0, 0, 0, 0.16)); filter: none; }
/* selected → SOLID BLACK, white text (Jason 2026-06-17). Painted when the property's whole
   logical row is selected (oxjob #475 row selection). No focus/multi state (chip is inert). */
.prop-chip-leaf.selected { background: var(--prop-bg-sel, #1a1a1a); color: var(--prop-fg-sel, #fff); box-shadow: none; filter: none; outline: none; }

.prop-chip { cursor: pointer; }
.prop-chip,
.prop-chip.unset { background-color: var(--prop-bg, #ece8fe) !important; color: var(--prop-fg, #574d7a) !important; }
/* TYPE-ON-CHIP field input (oxjob #561): the unset draft chip IS the field-search input —
   same peach brick, the input a transparent hole in it. .typeon-input itself is shared
   (oqlChip.css). */
.prop-typeon { cursor: text; }
.prop-typeon:hover { background: var(--prop-bg, #fae1d1); filter: none; }
</style>
