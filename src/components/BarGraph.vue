<template>
  <div
    class="d-flex bar-graph"
    style="height: 100%; width: 100%;"
  >
    <v-tooltip
      v-for="(bar, i) in scaledBars"
      :key="i"
      location="bottom"
      transition="none"
    >
      <template v-slot:activator="{props}">
        <div
          v-bind="props"
          class="bar-graph-bar-container"
          @click.prevent="emit('click', bar.key)"
        >
          <div
            class="bar-graph-bar text-caption"
            :style="{height: bar.scaledCount * 100 + '%'}"
          >
          </div>
        </div>
      </template>
      <div>
        <span class="font-weight-bold">
        {{ bar.key }}:
        </span>
        <span class="">
        {{ filters.toPrecision(bar.count) }}
        </span>
      </div>
    </v-tooltip>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import filters from '@/filters';

defineOptions({ name: 'BarGraph' });

const emit = defineEmits(['click']);

const props = defineProps({
  bars: {
    type: Array,
    default: () => []
  }
});

const scaledBars = computed(() => {
  const maxCount = Math.max(...props.bars.map(f => f.count || 0));
  return props.bars.map(bar => ({
    ...bar,
    scaledCount: maxCount > 0 ? bar.count / maxCount : 0
  }));
});
</script>


<style scoped lang="scss">

$color-3: hsl(210, 60%, 98%);
$color-2: hsl(213, 69%, 95%);
$color-1: hsl(213, 72%, 88%);
$color-0: hsl(212, 77%, 82%);

.bar-graph {
  flex-direction: row-reverse;
}
.bar-graph-bar-container {
  height: 100%;
  cursor: pointer;
  flex: 1;
  display: flex;
  align-items: flex-end;
  padding-right: 1px;
  &:hover {
    .bar-graph-bar {
      background-color:  rgba(0, 0, 0, 0.5);

    }
  }
}
.bar-graph-bar {
  transition: height 500ms;
  width: 100%;
  background-color:  rgba(0, 0, 0, 0.3);
}
</style>