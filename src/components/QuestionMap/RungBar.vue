<template>
  <div
    class="rung-bar"
    :style="{height: height + 'px'}"
    role="img"
    :aria-label="label"
    @mouseleave="hover = null"
  >
    <div
      v-for="seg in segments"
      :key="seg.n"
      class="rung-seg"
      :style="{flexGrow: seg.count, background: colors[seg.n]}"
      @mouseenter="hover = seg"
    />
    <div v-if="hover && tooltip" class="rung-tip">
      <span class="rung-swatch" :style="{background: colors[hover.n]}" />
      {{ rungName(hover.n) }}: <b>{{ hover.count.toLocaleString('en-US') }}</b>
      ({{ Math.round(100 * hover.count / total) }}%)
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import {RUNG_COLORS} from '@/questionMap';

defineOptions({name: 'RungBar'});

const props = defineProps({
  rungs: {type: Object, required: true},     // {1: count, ..., 5: count}
  names: {type: Array, default: () => []},    // data.rungs: [{n, name}]
  height: {type: Number, default: 10},
  tooltip: {type: Boolean, default: true},
});

const colors = RUNG_COLORS;
const hover = ref(null);
const segments = computed(() => [1, 2, 3, 4, 5].map(n => ({n, count: props.rungs[n] || 0})).filter(s => s.count));
const total = computed(() => segments.value.reduce((t, s) => t + s.count, 0));
const rungName = n => props.names.find(r => r.n === n)?.name || `Rung ${n}`;
const label = computed(() => segments.value.map(s => `${rungName(s.n)} ${s.count}`).join(', '));
</script>

<style scoped>
.rung-bar {
  position: relative;
  display: flex;
  gap: 2px;
  width: 100%;
  min-width: 40px;
}
.rung-seg {
  flex-basis: 0;
  min-width: 2px;
  border-radius: 1px;
}
.rung-seg:first-child { border-radius: 4px 1px 1px 4px; }
.rung-seg:last-child { border-radius: 1px 4px 4px 1px; }
.rung-seg:only-child { border-radius: 4px; }
.rung-tip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  z-index: 5;
  white-space: nowrap;
  background: #0a0a0a;
  color: #fafafa;
  font-size: 12px;
  line-height: 1.3;
  padding: 5px 8px;
  border-radius: 6px;
  pointer-events: none;
}
.rung-swatch {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 4px;
}
</style>
