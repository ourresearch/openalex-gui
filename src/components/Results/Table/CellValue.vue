<template>
  <span class="cell-value" :title="cellText">
    <!-- empty -->
    <span v-if="cell.empty" class="cell-empty">—</span>

    <!-- one or more items (single-value cells have exactly one, no separators) -->
    <template v-else>
      <template v-for="(item, i) in visibleItems" :key="i">
        <router-link
          v-if="item.entityId"
          :to="filters.entityZoomLink(item.entityId) || '#'"
        >{{ item.text }}</router-link>
        <a
          v-else-if="item.url"
          :href="item.url"
          target="_blank"
          rel="noopener"
          class="cell-external"
        >{{ item.text }}</a>
        <span v-else>{{ item.text }}</span><span v-if="cell.multi && i < visibleItems.length - 1">, </span>
      </template>
      <span v-if="hiddenCount > 0" class="cell-more">&nbsp;+{{ hiddenCount }} more</span>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue';
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
  // Max items shown before collapsing to "+N more" (multi cells only).
  maxItems: { type: Number, default: 5 },
});

// buildCell never throws — a malformed value degrades to empty/text.
const cell = computed(() => buildCell(props.value, props.render, props.booleanValues));
const cellText = computed(() => cellToText(cell.value));

const visibleItems = computed(() =>
  cell.value.multi ? cell.value.items.slice(0, props.maxItems) : cell.value.items
);
const hiddenCount = computed(() =>
  cell.value.multi ? Math.max(0, cell.value.items.length - props.maxItems) : 0
);
</script>

<style scoped>
.cell-value {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
.cell-empty {
  color: rgba(0, 0, 0, 0.3);
}
.cell-more {
  color: rgba(0, 0, 0, 0.45);
  font-size: 0.85em;
}
.cell-external {
  white-space: nowrap;
}
</style>
