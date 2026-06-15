<!--
  OqlTextChip — the inline-editable scalar/search value brick in the OQL builder.

  This is the "text chip". It has two visual modes (oxjob #467 Phase 1):
    DISPLAY  — a committed value renders as a borderless, teal value chip that
               snugs to its text (matches the entity value chip). Single-click
               SELECTS it (darker) and opens a context menu; double-click edits.
    EDIT     — a bordered `<input>` box. Shown while actively editing (double-click
               or the menu's Edit) or for a still-empty value (a freshly added value
               box). Commits back to the DISPLAY chip on Enter / blur.
  The negation `not` lives INSIDE the chip fill as a bold leading sub-part —
  `[ not foo ]` — same font-size as the value. It's a display indicator only;
  negation is toggled from the context menu (and, Phase 3, ⌥-click), not by clicking
  the word. (In EDIT mode, Backspace at column 0 still un-negates, via the parent.)

  CONTEXT MENU (Phase 2): single-click opens a dropdown — Edit (double-click),
  Negate (⌥ click), Near…, Delete (⌫) — with right-aligned key-glyph hints. The
  live ⌥-click / ⌫ shortcuts themselves land in Phase 3; here the menu items work
  and the hints advertise the coming shortcuts. `Near` is a stub: it emits `near`
  and the parent shows an in-app "not implemented yet" notice.

  PURELY PRESENTATIONAL. It owns no QUERY state: it reads everything from the
  `tok` (a `vbrick` token produced by OqlQueryBuilder's `displayLines`) and emits
  semantic intents. The parent maps those intents onto the v2 edit ops
  (`edit.setValue` / `edit.toggleNeg` / `edit.removeNode` / `edit.addValue`) and
  re-renders. The only LOCAL state is UI mode (`editing`, `menuOpen`) — presentation,
  not query state. Keep it free of v2/edit/drafts so it can grow independently
  (oxjob: paste-to-chips, `near` keyword, subclause split).

  Contract:
    prop  tok            the vbrick token. Reads: id, negated, _numeric, _sole,
                         and display/value/text (via `valueText`).
    emit  value-input    (InputEvent) — user typed; parent calls edit.setValue.
    emit  value-keydown  (KeyboardEvent) — raw keydown; parent handles Enter / Backspace-unnegate.
    emit  value-blur     () — input blurred; parent commits/folds.
    emit  toggle-neg     () — toggle negation (on OR off) via the menu; parent calls edit.toggleNeg.
    emit  remove         () — remove this value (sole value → parent prunes the clause).
    emit  near           () — user picked "Near…"; parent shows the stub notice.

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
        <span v-bind="mp" class="val-chip" :class="{ numeric: tok._numeric, selected: menuOpen }"
          @click="onChipClick" @dblclick="onChipDblclick">
          <span v-if="tok.negated" class="notpfx">not</span>{{ valueText }}<v-icon v-if="!tok._sole"
            size="13" class="val-remove" @click.stop="$emit('remove')">mdi-close</v-icon>
        </span>
      </template>
      <v-card min-width="184" class="menu-card chip-menu">
        <v-list density="compact" class="py-0">
          <v-list-item @click="onMenuPick('edit')">
            <v-list-item-title>Edit</v-list-item-title>
            <template #append><span class="mi-hint">double-click</span></template>
          </v-list-item>
          <v-list-item @click="onMenuPick('toggle-neg')">
            <v-list-item-title>{{ tok.negated ? "Remove negation" : "Negate" }}</v-list-item-title>
            <template #append><span class="mi-hint glyph">⌥</span><span class="mi-hint">click</span></template>
          </v-list-item>
          <v-list-item @click="onMenuPick('near')">
            <v-list-item-title>Near…</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item class="mi-danger" @click="onMenuPick('remove')">
            <v-list-item-title>Delete</v-list-item-title>
            <template #append><span class="mi-hint glyph">⌫</span></template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>

    <!-- EDIT: bordered input. Shown while editing or for a still-empty value. The
         `not` shows inside the box (bold) only when negated; click it to un-negate. -->
    <span v-else class="val-wrap" :class="{ numeric: tok._numeric }">
      <span v-if="tok.negated" class="notpfx">not</span>
      <input ref="inputEl" class="val-input" :type="tok._numeric ? 'number' : 'text'"
        :value="valueText" :data-vid="tok.id"
        :placeholder="tok._numeric ? 'number' : 'text'" spellcheck="false"
        @input="$emit('value-input', $event)"
        @keydown="onKeydown"
        @blur="onBlur" />
      <v-icon v-if="!tok._sole" size="13" class="val-remove" @click="$emit('remove')">mdi-close</v-icon>
    </span>
  </span>
</template>

<script setup>
import { computed, ref, nextTick, watch, onBeforeUnmount } from "vue";

const props = defineProps({
  tok: { type: Object, required: true },
});

const emit = defineEmits(["value-input", "value-keydown", "value-blur", "toggle-neg", "remove", "near"]);

// Display text for the input: prefer an explicit display label, then the raw
// value, then any passthrough text. (Mirrors the old builder-local `valueText`.)
const valueText = computed(() => {
  const t = props.tok;
  return t.display != null ? t.display : (t.value != null ? t.value : t.text || "");
});

// Local UI mode (NOT query state): show the bordered input while actively editing,
// or whenever the value is still empty (a freshly added value box needs the input
// so the parent's focusValueSoon can land in it).
const editing = ref(false);
const inputEl = ref(null);
const showInput = computed(() => editing.value || !String(valueText.value).length);

const startEdit = () => {
  editing.value = true;
  nextTick(() => { inputEl.value?.focus(); inputEl.value?.select?.(); });
};
const onKeydown = (e) => {
  // Enter / Escape commit back to the display chip (parent still handles Enter for
  // draft "add next value" + Backspace-at-col-0 un-negate via the emitted event).
  if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) editing.value = false;
  else if (e.key === "Escape") { editing.value = false; e.target.blur(); }
  emit("value-keydown", e);
};
const onBlur = () => { editing.value = false; emit("value-blur"); };

// Context menu (Phase 2). Single-click selects + opens; double-click edits. We
// disambiguate with a short timer: a lone click opens the menu after the timer,
// a second click within the window cancels it and edits instead.
const menuOpen = ref(false);
let clickTimer = null;
const onChipClick = () => {
  if (clickTimer) return; // the 2nd click of a double-click — let dblclick handle it
  clickTimer = setTimeout(() => { clickTimer = null; menuOpen.value = true; }, 220);
};
const onChipDblclick = () => {
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
  menuOpen.value = false;
  startEdit();
};
// Always close the menu explicitly before acting: actions that re-render the parent
// (negate / delete) otherwise race Vuetify's close-on-content-click and leave the
// menu open.
const onMenuPick = (action) => {
  menuOpen.value = false;
  if (action === "edit") startEdit();
  else emit(action); // toggle-neg | near | remove
};

// If the token at this position is replaced by a different value (index-keyed
// v-for), drop any stale editing/menu UI state.
watch(() => props.tok.id, () => { editing.value = false; menuOpen.value = false; });
onBeforeUnmount(() => { if (clickTimer) clearTimeout(clickTimer); });
</script>

<style scoped>
.val-leaf { display: inline-flex; align-items: center; }

/* LEGO `not`: bold, same font-size as the value, INSIDE the chip fill as a leading
   sub-part (`[ not foo ]`). Pure display indicator — toggle negation via the context
   menu (or, Phase 3, ⌥-click). The small right margin sets it off from the value. */
.notpfx { font-weight: 700; font-size: var(--brick-fs, 0.8125rem); color: var(--val-fg, #14625c); margin-right: 4px; }

/* DISPLAY chip — mirrors the entity .value-chip (teal, borderless, snug). */
.val-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
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
/* selected = single-clicked (menu open): a darker fill so it reads as picked. */
.val-chip.selected { filter: brightness(0.9); box-shadow: 0 0 0 1.5px var(--val-fg, #14625c) inset; }

/* context menu */
.chip-menu :deep(.v-list-item-title) { font-size: 0.8125rem; }
.mi-hint { color: rgba(0, 0, 0, 0.4); font-size: 0.75rem; margin-left: 18px; }
.mi-hint.glyph { font-size: 0.875rem; margin-left: 18px; margin-right: 2px; }
.mi-danger :deep(.v-list-item-title) { color: #b3261e; }

/* EDIT box — bordered input. */
.val-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--val-bg, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--val-fg, rgba(0, 0, 0, 0.15));
  border-radius: 6px;
  padding: 2px 6px;
}
.val-input {
  border: none; outline: none; background: transparent;
  font-size: var(--brick-fs, 0.8125rem); color: var(--val-fg, rgba(0, 0, 0, 0.87));
  min-width: 56px; max-width: 360px; field-sizing: content;
}
.val-input::placeholder { color: rgba(0, 0, 0, 0.4); }
.val-wrap.numeric .val-input { min-width: 72px; }
.val-remove { cursor: pointer; opacity: 0.4; margin-left: 2px; }
.val-remove:hover { opacity: 1; }
</style>
