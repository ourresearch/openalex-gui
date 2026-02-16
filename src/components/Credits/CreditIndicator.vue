<template>
  <v-tooltip location="bottom">
    <template #activator="{ props: tooltipProps }">
      <router-link
        to="/settings/plan"
        class="credit-indicator"
        v-bind="tooltipProps"
      >
        <svg width="28" height="28" viewBox="0 0 28 28">
          <!-- Background ring -->
          <circle
            cx="14" cy="14" r="11"
            fill="none"
            stroke="#F0F0F0"
            stroke-width="3"
          />
          <!-- Progress ring -->
          <circle
            cx="14" cy="14" r="11"
            fill="none"
            :stroke="ringColor"
            stroke-width="3"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            stroke-linecap="round"
            transform="rotate(-90 14 14)"
            style="transition: stroke-dashoffset 0.6s ease;"
          />
        </svg>
        <span class="credit-indicator-text">{{ shortRemaining }}</span>
      </router-link>
    </template>
    {{ tooltipText }}
  </v-tooltip>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  used: { type: Number, required: true },
  total: { type: Number, required: true },
});

const circumference = 2 * Math.PI * 11;

const remaining = computed(() => Math.max(0, props.total - props.used));
const pctRemaining = computed(() => props.total > 0 ? remaining.value / props.total : 0);

const dashOffset = computed(() => circumference * (1 - pctRemaining.value));

const ringColor = computed(() => {
  if (pctRemaining.value > 0.5) return '#4CAF50';
  if (pctRemaining.value > 0.2) return '#FF9800';
  return '#F44336';
});

const shortRemaining = computed(() => {
  const r = remaining.value;
  if (r >= 1000000) return (r / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (r >= 1000) return (r / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return r.toLocaleString();
});

const tooltipText = computed(() => {
  return `${remaining.value.toLocaleString()} of ${props.total.toLocaleString()} daily credits remaining`;
});
</script>

<style scoped>
.credit-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  text-decoration: none !important;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background-color 0.15s;
}

.credit-indicator:hover {
  background-color: #F0F0F0;
  text-decoration: none !important;
}

.credit-indicator-text {
  font-size: 12px;
  font-weight: 600;
  color: #6B6B6B !important;
  line-height: 1;
}
</style>
