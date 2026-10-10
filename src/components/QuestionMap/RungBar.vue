<template>
  <div class="rung-bar" :style="{height: height + 'px'}" role="img" :aria-label="label">
    <v-tooltip v-for="seg in segments" :key="seg.n" location="top" :text="seg.tip">
      <template #activator="{props: tip}">
        <div v-bind="tip" class="rung-seg" tabindex="0" :style="{flexGrow: seg.count, background: RUNG_COLORS[seg.n]}" />
      </template>
    </v-tooltip>
  </div>
</template>

<script setup>
import {computed} from 'vue';
import {RUNG_COLORS} from '@/questionMap';

defineOptions({name: 'RungBar'});

const props = defineProps({
  counts: {type: Object, required: true},   // {1: count, ..., 5: count}
  rungs: {type: Array, required: true},     // data.rungs: [{n, name}]
  height: {type: Number, default: 10},
});

const segments = computed(() => {
  const total = [1, 2, 3, 4, 5].reduce((t, n) => t + (props.counts[n] || 0), 0);
  return [1, 2, 3, 4, 5].filter(n => props.counts[n]).map(n => {
    const name = props.rungs.find(r => r.n === n)?.name;
    return {n, count: props.counts[n], name,
      tip: `${name}: ${props.counts[n].toLocaleString('en-US')} (${Math.round(100 * props.counts[n] / total)}%)`};
  });
});
const label = computed(() => segments.value.map(s => `${s.name} ${s.count}`).join(', '));
</script>

<style scoped>
.rung-bar { display: flex; gap: 2px; width: 100%; min-width: 40px; }
.rung-seg { flex-basis: 0; min-width: 2px; border-radius: 1px; }
.rung-seg:first-child { border-radius: 4px 1px 1px 4px; }
.rung-seg:last-child { border-radius: 1px 4px 4px 1px; }
.rung-seg:only-child { border-radius: 4px; }
.rung-seg:focus-visible { outline: 2px solid var(--ox-text-primary); outline-offset: 1px; }
</style>
