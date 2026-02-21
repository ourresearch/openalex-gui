<template>
  <v-tooltip :location="tooltipLocation">
    <template #activator="{ props: tooltipProps }">
      <router-link
        to="/settings/usage"
        :class="['credit-indicator', { 'credit-indicator--dark': dark }]"
        v-bind="tooltipProps"
      >
        <svg width="28" height="18" viewBox="0 0 28 18">
          <!-- Battery body (rounded rect outline) -->
          <rect
            x="1" y="1" width="22" height="16" rx="3" ry="3"
            fill="none"
            :stroke="dark ? 'rgba(255,255,255,0.4)' : '#bbb'"
            stroke-width="1.5"
          />
          <!-- Battery cap (right nub) -->
          <rect
            x="23" y="5" width="4" height="8" rx="1.5" ry="1.5"
            :fill="dark ? 'rgba(255,255,255,0.4)' : '#bbb'"
          />
          <!-- Fill bar (grows from left) -->
          <rect
            x="3.5" y="3.5" :width="fillWidth" height="11" rx="1.5" ry="1.5"
            :fill="fillColor"
            style="transition: width 0.6s ease, fill 0.6s ease;"
          />
        </svg>
      </router-link>
    </template>
    {{ tooltipText }}
  </v-tooltip>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  usedUsd: { type: Number, required: true },
  budgetUsd: { type: Number, required: true },
  dark: { type: Boolean, default: false },
  tooltipLocation: { type: String, default: 'bottom' },
});

const pctRemaining = computed(() => props.budgetUsd > 0 ? Math.max(0, (props.budgetUsd - props.usedUsd) / props.budgetUsd) : 0);

// Battery fill dimensions (inside the body: x=3.5 to x=20.5, 17px wide)
const maxFillWidth = 17;
const fillWidth = computed(() => Math.max(0, pctRemaining.value * maxFillWidth));

const fillColor = computed(() => {
  const pct = pctRemaining.value;
  if (pct > 0.3) return props.dark ? '#fff' : '#555';
  if (pct > 0.1) return '#F59E0B'; // amber warning
  return '#EF4444'; // red critical
});

const tooltipText = computed(() => {
  const pct = Math.round(pctRemaining.value * 100);
  return `${pct}% of daily usage remaining`;
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

.credit-indicator--dark:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
