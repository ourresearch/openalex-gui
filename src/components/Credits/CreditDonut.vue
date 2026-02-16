<template>
  <div class="credit-donut" :style="{ width: size + 'px' }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <!-- Background ring -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke="placeholder ? '#E5E5E5' : '#F0F0F0'"
        :stroke-width="strokeWidth"
      />
      <!-- Progress ring -->
      <circle
        v-if="!placeholder"
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke="ringColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        :transform="`rotate(-90 ${center} ${center})`"
        style="transition: stroke-dashoffset 0.6s ease;"
      />
    </svg>
    <!-- Center text -->
    <div class="credit-donut-center" :style="{ height: size + 'px' }">
      <div class="credit-donut-value" :style="{ fontSize: valueFontSize + 'px' }">
        {{ centerValue }}
      </div>
      <div class="credit-donut-subtitle" :style="{ fontSize: subtitleFontSize + 'px' }">
        {{ placeholder ? '' : 'remaining' }}
      </div>
    </div>
    <!-- Label below -->
    <div class="credit-donut-label" :class="{ 'text-medium-emphasis': placeholder }">
      {{ label }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  used: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
  label: { type: String, default: '' },
  size: { type: Number, default: 120 },
  color: { type: String, default: null },
  placeholder: { type: Boolean, default: false },
});

const strokeWidth = computed(() => Math.max(6, props.size * 0.08));
const center = computed(() => props.size / 2);
const radius = computed(() => (props.size - strokeWidth.value) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const valueFontSize = computed(() => Math.max(14, props.size * 0.17));
const subtitleFontSize = computed(() => Math.max(9, props.size * 0.09));

const remaining = computed(() => Math.max(0, props.total - props.used));
const pctRemaining = computed(() => props.total > 0 ? remaining.value / props.total : 0);

const dashOffset = computed(() => {
  return circumference.value * (1 - pctRemaining.value);
});

const ringColor = computed(() => {
  if (props.color) return props.color;
  if (pctRemaining.value > 0.5) return '#4CAF50';
  if (pctRemaining.value > 0.2) return '#FF9800';
  return '#F44336';
});

const centerValue = computed(() => {
  if (props.placeholder) return '--';
  return formatCompact(remaining.value);
});

function formatCompact(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}
</script>

<style scoped>
.credit-donut {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.credit-donut svg {
  display: block;
}

.credit-donut-center {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.credit-donut-value {
  font-weight: 600;
  color: #1A1A1A;
  line-height: 1.2;
}

.credit-donut-subtitle {
  color: #6B6B6B;
  line-height: 1.2;
  margin-top: 1px;
}

.credit-donut-label {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #1A1A1A;
  text-align: center;
}
</style>
