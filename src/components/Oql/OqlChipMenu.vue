<!--
  OqlChipMenu — the dropdown menu that opens on a chip (oxjob #475 design pivot,
  Jason 2026-06-19). Replaces the context-aware toolbar: single-clicking a chip opens
  this menu anchored under it; the items are the actions that chip's old toolbar offered.

  It's a CUSTOM fixed-position overlay (viewport coords), NOT a Vuetify coordinate-target
  v-menu — a `:target="[x,y]"` v-menu with no activator element dismisses itself on the
  opening click (documented gotcha; same reason the #472 batch menu is hand-rolled). The
  parent owns open/close + a document-click dismiss; we only render + emit `pick`.

  Each item:
    { key, icon, label, subtitle?, shortcut?, primary?, danger?, disabled?,
      kind?: 'radio'|'toggle', on?, divider? }
    • shortcut: an array of segments — a plain string is a KEYCAP (white pill, ⌘/⌫
      glyphs render larger); a { text } object is a plain word (click gestures like
      "double-click" — no keycap outline), per Jason's spec.
    • kind 'radio'  → a single-select option: a check icon when `on`, and NOTHING (an
      invisible same-width placeholder, so labels stay aligned) when off — the native
      "checkmark menu" look, no radio circles (Jason 2026-06-22). 'toggle' → a switch
      (on=`on`). Otherwise the item shows its `icon`.
-->
<template>
  <div class="chip-menu-overlay menu-card chip-menu" :style="{ left: x + 'px', top: y + 'px' }"
    @click.stop @mousedown.stop>
    <v-list density="compact" class="py-0">
      <v-list-subheader v-if="heading" class="batch-subhead">{{ heading }}</v-list-subheader>
      <template v-for="(it, i) in items" :key="it.key || i">
        <v-divider v-if="it.divider" />
        <v-list-item v-else :disabled="it.disabled"
          :class="{ 'mi-danger': it.danger, 'mi-primary': it.primary }"
          @click="onPick(it)">
          <template #prepend>
            <!-- radio / toggle / plain icon -->
            <!-- single-select: check when selected, invisible placeholder (mdi-blank) when not,
                 so the unselected rows show NO icon but labels stay aligned (Jason 2026-06-22). -->
            <v-icon v-if="it.kind === 'radio'" size="16" class="mi-check" :class="{ on: it.on }">
              {{ it.on ? 'mdi-check' : 'mdi-blank' }}
            </v-icon>
            <v-icon v-else-if="it.kind === 'toggle'" size="18" class="mi-toggle" :class="{ on: it.on }">
              {{ it.on ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off-outline' }}
            </v-icon>
            <v-icon v-else size="16" class="mi-icon">{{ it.icon }}</v-icon>
          </template>
          <div class="mi-text">
            <v-list-item-title>{{ it.label }}</v-list-item-title>
            <!-- native element so v-html is allowed (the subtitle bolds the OR/AND keyword) -->
            <div v-if="it.subtitle" class="mi-sub" v-html="it.subtitle" />
          </div>
          <template v-if="it.shortcut && it.shortcut.length" #append>
            <span class="mi-keys">
              <template v-for="(seg, si) in it.shortcut" :key="si">
                <span v-if="seg && seg.text" class="mi-hint">{{ seg.text }}</span>
                <kbd v-else class="mi-key" :class="{ glyph: glyphKeys.includes(seg) }">{{ seg }}</kbd>
              </template>
            </span>
          </template>
        </v-list-item>
      </template>
    </v-list>
  </div>
</template>

<script setup>
import "@/components/Oql/oqlChip.css";

defineProps({
  items: { type: Array, default: () => [] },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  heading: { type: String, default: "" },
});
const emit = defineEmits(["pick"]);
const glyphKeys = ["⌫", "⌥", "⌘", "↵", "⏎"];
function onPick(it) {
  if (it.disabled || it.divider) return;
  emit("pick", it);
}
</script>

<style scoped>
/* Fixed overlay positioned at the clicked chip (viewport coords). Mirrors the batch-menu
   shell so both menus look identical; the visual list styling lives in oqlChip.css. */
.chip-menu-overlay {
  position: fixed;
  z-index: 2400;
  min-width: 248px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.mi-text { display: flex; flex-direction: column; min-width: 0; }
</style>
