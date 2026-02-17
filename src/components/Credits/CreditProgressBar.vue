<template>
  <div class="credit-progress-section">
    <!-- Header -->
    <div class="credit-progress-header">
      <div class="d-flex align-center ga-2">
        <slot name="header-prefix" />
        <span class="credit-progress-label">{{ label }}</span>
      </div>
      <span v-if="sublabel" class="credit-progress-sublabel">{{ sublabel }}</span>
    </div>

    <!-- Bar row -->
    <template v-if="!placeholder">
      <div class="credit-progress-stats">
        <span class="credit-progress-used">{{ formattedUsed }} used</span>
        <span class="credit-progress-pct">{{ pctUsed }}% used</span>
      </div>
      <v-progress-linear
        :model-value="pctUsed"
        :color="barColor"
        bg-color="#F0F0F0"
        height="8"
        rounded
        class="credit-progress-bar"
      />
    </template>

    <!-- Placeholder state -->
    <template v-else>
      <div class="credit-progress-placeholder">
        <span class="text-medium-emphasis text-body-2">{{ placeholderText }}</span>
      </div>
    </template>

    <!-- Footer -->
    <div class="credit-progress-footer">
      <span v-if="footerText" class="text-caption text-medium-emphasis">{{ footerText }}</span>
      <span v-else />
      <router-link v-if="linkText && linkTo" :to="linkTo" class="text-caption credit-progress-link">
        {{ linkText }} &rarr;
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatCompact } from '@/utils/formatNumber';

defineOptions({ name: 'CreditProgressBar' });

const props = defineProps({
  used: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
  label: { type: String, default: '' },
  sublabel: { type: String, default: '' },
  footerText: { type: String, default: '' },
  linkText: { type: String, default: '' },
  linkTo: { type: String, default: '' },
  placeholder: { type: Boolean, default: false },
  placeholderText: { type: String, default: 'No data available' },
});

const pctUsed = computed(() => {
  if (props.total <= 0) return 0;
  return Math.min(100, Math.round((props.used / props.total) * 100));
});

const pctRemaining = computed(() => 100 - pctUsed.value);

const barColor = computed(() => {
  if (pctRemaining.value > 50) return '#4CAF50';
  if (pctRemaining.value > 20) return '#FF9800';
  return '#F44336';
});

const formattedUsed = computed(() => formatCompact(props.used));
</script>

<style scoped>
.credit-progress-section {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 10px;
  padding: 20px 24px;
}

.credit-progress-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}

.credit-progress-label {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A1A;
}

.credit-progress-sublabel {
  font-size: 13px;
  color: #6B6B6B;
}

.credit-progress-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.credit-progress-used {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A1A;
}

.credit-progress-pct {
  font-size: 13px;
  color: #6B6B6B;
}

.credit-progress-bar {
  border-radius: 4px;
}

.credit-progress-placeholder {
  padding: 12px 0;
}

.credit-progress-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.credit-progress-link {
  text-decoration: none;
  font-weight: 500;
}

.credit-progress-link:hover {
  text-decoration: underline;
}
</style>
