<template>
  <div class="rung-legend">
    <span v-for="r in rungs" :key="r.n" class="rung-legend-item" :class="{zero: counts && !counts[r.n]}" :title="r.story">
      <span class="swatch" :style="{background: RUNG_COLORS[r.n]}" />
      <template v-if="counts">{{ r.name }} <b>{{ counts[r.n] }}</b></template>
      <template v-else>{{ r.n }} · {{ r.name }}</template>
    </span>
  </div>
</template>

<script setup>
import {RUNG_COLORS} from '@/questionMap';

defineOptions({name: 'RungLegend'});
defineProps({
  rungs: {type: Array, required: true},   // data.rungs
  counts: {type: Object, default: null},  // {1: n, ...} to show counts instead of rung numbers
});
</script>

<style scoped>
.rung-legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; color: var(--ox-text-secondary); margin: 10px 0 16px; }
.rung-legend-item { display: inline-flex; align-items: center; gap: 6px; cursor: default; }
.rung-legend-item.zero { color: var(--ox-text-disabled); }
</style>
