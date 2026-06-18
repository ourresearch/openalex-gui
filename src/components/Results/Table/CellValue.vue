<template>
  <span class="cell-value" :class="{ 'cell-clamp': !cell.multi }" :title="cellText">
    <!-- empty -->
    <span v-if="cell.empty" class="cell-empty">—</span>

    <!-- boolean: check (true) or ✗ (false); the surrounding cell carries a
         light green/red tint (see ResultsTable). A plain check/✗ rather than a
         checkbox glyph, so it doesn't read as a selectable control next to the
         row-select checkboxes. Label stays in the title attr + CSV (cellText). -->
    <v-icon
      v-else-if="isBoolean && boolTrue"
      class="cell-bool-icon"
    >mdi-check</v-icon>
    <v-icon
      v-else-if="isBoolean"
      class="cell-bool-icon cell-bool-false"
    >mdi-close</v-icon>

    <!-- one or more items (single-value cells have exactly one, no separators) -->
    <template v-else>
      <template v-for="(item, i) in visibleItems" :key="i">
        <a
          v-if="item.entityId"
          :href="filters.entityZoomHref(item.entityId)"
          @click="filters.zoomDrawerClick(item.entityId, $event)"
        >{{ item.text }}</a>
        <a
          v-else-if="item.url"
          :href="item.url"
          target="_blank"
          rel="noopener"
          class="cell-external"
        >{{ item.text }}</a>
        <span v-else>{{ item.text }}</span><span v-if="cell.multi && i < visibleItems.length - 1">, </span>
      </template>
      <!-- Always-visible toggle: collapsed shows the hidden count, expanded
           shows every item in the cell (so it's clear a CSV export gets all). -->
      <a
        v-if="hiddenCount > 0"
        class="cell-more"
        role="button"
        tabindex="0"
        @click.stop.prevent="expanded = true"
        @keydown.enter.stop.prevent="expanded = true"
      >&nbsp;+{{ hiddenCount }} more</a>
      <a
        v-else-if="canCollapse"
        class="cell-more"
        role="button"
        tabindex="0"
        @click.stop.prevent="expanded = false"
        @keydown.enter.stop.prevent="expanded = false"
      >&nbsp;show less</a>
    </template>
  </span>
</template>

<script setup>
import { computed, ref } from 'vue';
import filters from '@/filters';
import { buildCell, cellToText } from './cellFormat';

defineOptions({ name: 'CellValue' });

const props = defineProps({
  // The value extracted from the row entity (scalar, object, or array).
  value: { type: null, default: null },
  // The property's `column.render` block: { kind, ...options }.
  render: { type: Object, default: () => ({}) },
  // The property's `booleanValues` ([falseLabel, trueLabel]), for boolean kind.
  booleanValues: { type: Array, default: null },
  // Items shown before collapsing to a "+N more" toggle (multi cells only).
  maxItems: { type: Number, default: 3 },
});

// buildCell never throws — a malformed value degrades to empty/text.
const cell = computed(() => buildCell(props.value, props.render, props.booleanValues));
const cellText = computed(() => cellToText(cell.value));

// Boolean cells render as a checkbox icon (filled = true) rather than text.
const isBoolean = computed(() => props.render?.kind === 'boolean');
const boolTrue = computed(() => !!props.value);

// Multi cells (author/string lists) collapse to the first `maxItems` with an
// always-visible toggle. Expanded shows every item in the cell.
const expanded = ref(false);
const visibleItems = computed(() => {
  if (!cell.value.multi || expanded.value) return cell.value.items;
  return cell.value.items.slice(0, props.maxItems);
});
const hiddenCount = computed(() => {
  if (!cell.value.multi || expanded.value) return 0;
  return Math.max(0, cell.value.items.length - props.maxItems);
});
const canCollapse = computed(() =>
  cell.value.multi && expanded.value && cell.value.items.length > props.maxItems
);
</script>

<style scoped>
.cell-value {
  display: inline-block;
  max-width: 100%;
  /* Wrap freely: titles and author lists may span several lines (Scopus/WoS
     style). Long unbroken tokens (URLs, IDs) break rather than overflow. */
  overflow-wrap: anywhere;
}
/* Only scalar cells (titles, text) get a pathological-length cap — normal
   multi-line titles show in full; absurd data-entry-error titles get clamped.
   Multi cells (lists) are bounded by the +N more toggle instead. */
.cell-clamp {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 8;
  overflow: hidden;
}
.cell-empty {
  color: rgba(0, 0, 0, 0.3);
}
.cell-bool-icon {
  color: rgba(0, 0, 0, 0.75);
}
.cell-bool-false {
  opacity: 0.5;
}
.cell-more {
  color: rgb(25, 118, 210);
  cursor: pointer;
  font-size: 0.85em;
  white-space: nowrap;
}
.cell-more:hover {
  text-decoration: underline;
}
.cell-external {
  white-space: nowrap;
}
</style>
