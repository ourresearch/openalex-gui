<!--
  OqlTextChip — the inline-editable scalar/search value brick in the OQL builder.

  This is the "text chip". It has two visual modes:
    DISPLAY  — a committed value renders as a borderless, teal value chip that
               snugs to its text (matches the entity value chip). Single-click
               SELECTS it (darker) and opens a context menu; double-click edits.
    EDIT     — a bordered `<input>` box. Shown while actively editing (double-click
               or the menu's Edit) or for a still-empty value (a freshly added value
               box). Commits back to the DISPLAY chip on Enter / blur.
  The negation `not` lives INSIDE the chip fill as a bold leading sub-part —
  `[ not foo ]` — same font-size as the value. It's a display indicator only;
  negation is toggled from the context menu. (In EDIT mode, Backspace at column 0
  still un-negates, via the parent.)

  CONTEXT MENU + LIVE SHORTCUTS (oxjob #467; key map revised 2026-06-16): single-click
  opens a dropdown — Edit (enter) · New (Cmd/Ctrl+Enter) · Group · Negate · Delete (⌫).
  Enter EDITS the selected chip (double-click still edits); Cmd/Ctrl+Enter creates a
  NEW sibling value to the RIGHT (emits `add`; parent calls edit.addValue + focuses it).
  Negate has no shortcut now (menu only). The shared gesture logic (click→menu w/
  dbl-click disambiguation, Enter, Cmd/Ctrl+Enter, ⌫) lives in `useChipShortcuts`.

  PURELY PRESENTATIONAL. It owns no QUERY state: it reads everything from the
  `tok` (a `vbrick` token produced by OqlQueryBuilder's `displayLines`) and emits
  semantic intents. The parent maps those intents onto the v2 edit ops
  (`edit.setValue` / `edit.toggleNeg` / `edit.removeNode` / `edit.addValue`) and
  re-renders. The only LOCAL state is UI mode (`editing`, `menuOpen`) — presentation,
  not query state. Keep it free of v2/edit/drafts so it can grow independently.

  Contract:
    prop  tok            the vbrick token. Reads: id, negated, _numeric, _sole,
                         and display/value/text (via `valueText`).
    emit  value-input    (InputEvent) — user typed; parent calls edit.setValue.
    emit  value-keydown  (KeyboardEvent) — raw keydown; parent handles Enter / Backspace-unnegate.
    emit  value-blur     () — input blurred; parent commits/folds.
    emit  toggle-neg     () — toggle negation (on OR off); parent calls edit.toggleNeg.
    emit  add            () — add a sibling value to the right; parent calls edit.addValue.
    emit  group          () — wrap this value in a new nested subgroup (#472; non-sole only).
    emit  remove         () — remove this value (sole value → parent prunes the clause).

  NOTE on focus: the parent focuses a brick by querying `[data-vid="<id>"]` in the
  DOM, so the `<input>` MUST keep its `:data-vid="tok.id"` attribute. A committed
  value sits in DISPLAY mode (no input); the parent only ever needs to focus a
  freshly-added value, which is empty → renders the input → focusable.
  NOTE on colours: --val-bg / --val-fg / --brick-fs are CSS custom properties that
  cascade in from the builder (oqlPalette.js); they resolve here without re-declaring.
-->
<template>
  <span class="val-leaf" :class="{ negated: tok.negated }">
    <!-- DISPLAY: borderless teal chip that snugs to its text. The `not` lives INSIDE
         the chip fill as a bold leading sub-part — `[ not foo ]`. Single-click selects
         + opens the context menu; double-click edits. -->
    <v-menu v-if="!showInput" v-model="menuOpen" :open-on-click="false"
      location="bottom start" offset="6">
      <template #activator="{ props: mp }">
        <span v-bind="mp" class="val-chip" :class="{ numeric: tok._numeric, selected: menuOpen, dragging }"
          tabindex="0" :data-vid="tok.id" draggable="true"
          @click="onClick" @dblclick="onDblclick" @keydown="onKeydown"
          @dragstart="onDragstart" @dragend="onDragend">
          <span v-if="tok.negated" class="notpfx">not</span>{{ valueText }}
        </span>
      </template>
      <v-card min-width="190" class="menu-card chip-menu" @keydown="onKeydown">
        <v-list density="compact" class="py-0">
          <v-list-item @click="onMenuPick('edit')">
            <template #prepend><v-icon size="16" class="mi-icon">mdi-pencil-outline</v-icon></template>
            <v-list-item-title>Edit</v-list-item-title>
            <template #append><OqlKbdHint :keys="['enter']" /></template>
          </v-list-item>
          <v-list-item @click="onMenuPick('add')">
            <template #prepend><v-icon size="16" class="mi-icon">mdi-arrow-right</v-icon></template>
            <v-list-item-title>New</v-list-item-title>
            <template #append><OqlKbdHint :keys="[cmdLabel, 'enter']" /></template>
          </v-list-item>
          <!-- Group: wrap this value in a new nested subgroup (oxjob #472). Only when the
               value has siblings (`!_sole`) — nesting a lone value isn't meaningful. -->
          <v-list-item v-if="!tok._sole" @click="onMenuPick('group')">
            <template #prepend><v-icon size="16" class="mi-icon">mdi-code-parentheses</v-icon></template>
            <v-list-item-title>Group</v-list-item-title>
          </v-list-item>
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

    <!-- EDIT: bordered input. Shown while editing or for a still-empty value. The
         `not` shows inside the box (bold) only when negated; Backspace-at-col-0
         un-negates (via the parent). -->
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
import { computed, ref, nextTick } from "vue";
import { useChipShortcuts } from "@/components/Oql/useChipShortcuts";
import OqlKbdHint from "@/components/Oql/OqlKbdHint.vue";
import { cmdLabel } from "@/components/Oql/platformKeys";
import "@/components/Oql/oqlChip.css"; // shared .val-chip + .chip-menu styles (all 3 chips)

const props = defineProps({
  tok: { type: Object, required: true },
});

const emit = defineEmits(["value-input", "value-keydown", "value-blur", "toggle-neg", "add", "group", "remove"]);

// Display text for the input: prefer an explicit display label, then the raw
// value, then any passthrough text. (Mirrors the old builder-local `valueText`.)
const valueText = computed(() => {
  const t = props.tok;
  return t.display != null ? t.display : (t.value != null ? t.value : t.text || "");
});

// Local UI mode (NOT query state): show the bordered input while actively editing,
// or whenever the value is still empty (a freshly added value box needs the input
// so the parent's focusValueSoon can land in it). `editing` is set true the moment
// the input gains focus, so a freshly-added box STAYS open as you type the first
// character (otherwise showInput would flip to display mode once the value is
// non-empty and yank the box out from under you mid-type).
const editing = ref(false);
const inputEl = ref(null);
const showInput = computed(() => editing.value || !String(valueText.value).length);
// Set while Enter closes the box, so onBlur skips its own commit — the PARENT commits
// + re-selects on Enter, and a second blur-commit would re-render and steal that focus.
const closingViaEnter = ref(false);

const startEdit = () => {
  editing.value = true;
  nextTick(() => { inputEl.value?.focus(); inputEl.value?.select?.(); });
};
const onInputFocus = () => { editing.value = true; };
const onInputKeydown = (e) => {
  // Enter = FINISH this value: close the box. The parent (onValueKeydown) commits the
  // value and re-selects the resulting display chip; a SECOND Enter on that selected
  // chip adds a new value (onEnter → add). It does NOT auto-open a new block.
  if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) { editing.value = false; closingViaEnter.value = true; }
  else if (e.key === "Escape") { editing.value = false; e.target.blur(); }
  emit("value-keydown", e); // Enter (parent commits) / Backspace-at-col-0 un-negate / …
};
const onBlur = () => {
  editing.value = false;
  if (closingViaEnter.value) { closingViaEnter.value = false; return; }
  emit("value-blur");
};

// Shared gesture shell: single-click → menu (dbl-click disambiguated), double-click /
// Enter = edit, Cmd/Ctrl+Enter = new sibling, Backspace/Delete = delete. Menu state
// resets when the token at this slot is swapped (index-keyed parent v-for).
const { menuOpen, dragging, onClick, onDblclick, onKeydown, onDragstart, onDragend } = useChipShortcuts({
  idRef: () => props.tok.id,
  onDouble: startEdit,
  onEnter: startEdit,
  onCmdEnter: () => emit("add"),
  onDelete: () => emit("remove"),
});

// Always close the menu explicitly before acting: actions that re-render the parent
// (negate / delete / add) otherwise race Vuetify's close-on-content-click.
const onMenuPick = (action) => {
  menuOpen.value = false;
  if (action === "edit") startEdit();
  else emit(action); // add | toggle-neg | remove
};
</script>

<style scoped>
/* .val-chip / .notpfx / .chip-menu / .mi-* live in the shared oqlChip.css (imported
   above) so all three chips stay identical and match the v-chip bricks. Only the text
   chip's edit-mode box is component-specific. */
.val-leaf { display: inline-flex; align-items: center; }

/* EDIT box — bordered input. Sized to match the display chip + the v-chip bricks
   (26px tall, 4px radius) so the brick doesn't resize when you enter edit mode. */
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
