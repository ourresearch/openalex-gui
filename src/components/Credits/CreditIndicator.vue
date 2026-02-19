<template>
  <v-tooltip location="bottom">
    <template #activator="{ props: tooltipProps }">
      <router-link
        to="/settings/usage"
        class="credit-indicator"
        v-bind="tooltipProps"
      >
        <svg width="28" height="28" viewBox="0 0 28 28">
          <!-- Background ring -->
          <circle
            cx="14" cy="14" r="11"
            fill="none"
            stroke="#ddd"
            stroke-width="6"
          />
          <!-- Used portion -->
          <circle
            cx="14" cy="14" r="11"
            fill="none"
            stroke="#333"
            stroke-width="6"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            stroke-linecap="round"
            transform="rotate(-90 14 14)"
            style="transition: stroke-dashoffset 0.6s ease;"
          />
        </svg>
      </router-link>
    </template>
    {{ tooltipText }}
  </v-tooltip>
</template>

<script setup>
import { computed } from 'vue';
import { formatUsd } from '@/store';

const props = defineProps({
  usedUsd: { type: Number, required: true },
  budgetUsd: { type: Number, required: true },
});

const circumference = 2 * Math.PI * 11;

const pctUsed = computed(() => props.budgetUsd > 0 ? props.usedUsd / props.budgetUsd : 0);
const dashOffset = computed(() => circumference * (1 - pctUsed.value));

const resetTimeText = computed(() => {
  const now = new Date();
  const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const diffMs = midnightUTC - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}hr ${minutes}min`;
});

const tooltipText = computed(() => {
  const pct = Math.round(pctUsed.value * 100);
  return `${pct}% of ${formatUsd(props.budgetUsd)} daily budget used (resets in ${resetTimeText.value})`;
});
</script>

<style scoped>
.credit-indicator {
  display: flex;
  align-items: center;
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
</style>
