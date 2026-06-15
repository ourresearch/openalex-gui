<!--
  OqlBoolChip — the value chip for a BOOLEAN value in the OQL builder. Covers both
  kinds of boolean brick:
    • boolean PHRASE (`tok._boolPhrase`)   — a combined predicate+value ("it's open
      access"); the phrase text itself carries the negation. Negate → emit toggle-neg.
    • true/false value (`tok._kind === 'boolean'`, phrase-less bool fields) — shows
      `true`/`false`; "negate" flips the value. Negate → emit pick-bool(!value).

  Converged onto the same click→menu pattern as the other chips (oxjob #467 round 2),
  but a boolean's ONLY meaningful edit is to negate, so:
    Negate (double-click) · Delete (⌫)
  — double-click negates (feels natural for a 2-state thing), and there is NO ⌥-click
  negate gesture/hint here (unlike the text/entity chips). Single-click opens the menu.

  PURELY PRESENTATIONAL — owns no query state.

  Contract:
    prop  tok          reads: id, negated, value, text, _boolPhrase, _kind.
    emit  toggle-neg   () — boolean PHRASE: toggle the negative phrase.
    emit  pick-bool    (Boolean) — true/false value: set the (flipped) value.
    emit  remove       () — remove this value.
-->
<template>
  <v-menu v-model="menuOpen" :open-on-click="false" location="bottom start" offset="6">
    <template #activator="{ props: mp }">
      <span v-bind="mp" class="val-chip" :class="{ selected: menuOpen, negated: tok.negated }"
        tabindex="0" @click="onClick" @dblclick="onDblclick" @keydown="onKeydown">
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
const emit = defineEmits(["toggle-neg", "pick-bool", "remove"]);

const isPhrase = computed(() => !!props.tok._boolPhrase);
const label = computed(() => (isPhrase.value ? props.tok.text : String(props.tok.value)));

// "Negate" means: flip the phrase (boolPhrase) or flip the true/false value.
const doNegate = () => {
  if (isPhrase.value) emit("toggle-neg");
  else emit("pick-bool", !props.tok.value);
};

// Double-click = negate; single-click → menu; Backspace/Delete = delete. No ⌥-click,
// no Enter/New for booleans.
const { menuOpen, onClick, onDblclick, onKeydown } = useChipShortcuts({
  idRef: () => props.tok.id,
  onDouble: doNegate,
  onDelete: () => emit("remove"),
});

const onMenuPick = (action) => {
  menuOpen.value = false;
  if (action === "negate") doNegate();
  else emit("remove");
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

/* context menu — shared look with the text/entity chips */
.chip-menu :deep(.v-list-item-title) { font-size: 0.8125rem; }
.chip-menu :deep(.v-list-item__prepend) { margin-inline-end: 0; }
.mi-icon { opacity: 0.7; margin-right: 8px; }
.mi-hint { color: rgba(0, 0, 0, 0.4); font-size: 0.75rem; margin-left: 18px; }
.mi-hint.glyph { font-size: 0.875rem; margin-left: 18px; margin-right: 2px; }
.mi-danger :deep(.v-list-item-title) { color: #b3261e; }
.mi-danger .mi-icon { color: #b3261e; opacity: 0.85; }
</style>
