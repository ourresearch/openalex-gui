<template>
  <div class="credit-progress-section">
    <!-- Section Title -->
    <div class="credit-progress-title">{{ label }}</div>
    <div v-if="description" class="credit-progress-description">{{ description }}</div>

    <!-- Content row -->
    <template v-if="!placeholder">
      <div v-if="headline" class="credit-progress-row">
        <div class="credit-progress-info">
          <span class="credit-progress-headline">{{ headline }}</span>
          <span v-if="subtitle" class="credit-progress-subtitle">{{ subtitle }}</span>
        </div>
      </div>
      <v-progress-linear
        :model-value="countdown ? pctRemaining : pctUsed"
        color="#333"
        bg-color="#DDD"
        height="16"
        rounded
        class="credit-progress-bar"
      />
      <div class="credit-progress-summary">{{ summary || (countdown ? `${pctRemaining}% remaining` : `${pctUsed}% used`) }}</div>
    </template>

    <!-- Placeholder state -->
    <template v-else>
      <div class="credit-progress-placeholder">
        <span class="text-medium-emphasis text-body-2">{{ placeholderText }}</span>
      </div>
    </template>

    <!-- Footer -->
    <div v-if="linkText" class="credit-progress-footer">
      <v-btn
        v-if="linkButton"
        :to="linkTo || undefined"
        color="black"
        variant="flat"
        rounded="lg"
        class="text-none"
        @click="emit('link-click')"
      >
        {{ linkText }}
      </v-btn>
      <router-link v-else-if="linkTo" :to="linkTo" class="text-caption credit-progress-link">
        {{ linkText }} &rarr;
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({ name: 'CreditProgressBar' });

const emit = defineEmits(['link-click']);

const props = defineProps({
  used: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
  countdown: { type: Boolean, default: false },
  label: { type: String, default: '' },
  description: { type: String, default: '' },
  headline: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  summary: { type: String, default: '' },
  linkText: { type: String, default: '' },
  linkTo: { type: String, default: '' },
  linkButton: { type: Boolean, default: false },
  placeholder: { type: Boolean, default: false },
  placeholderText: { type: String, default: 'No data available' },
});

const pctRemaining = computed(() => {
  if (props.total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(((props.total - props.used) / props.total) * 100)));
});

const pctUsed = computed(() => {
  if (props.total <= 0) return 0;
  return Math.min(100, Math.round((props.used / props.total) * 100));
});

</script>

<style scoped>
.credit-progress-section {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 10px;
  padding: 20px 24px;
}

.credit-progress-title {
  font-size: 16px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 16px;
}

.credit-progress-description {
  font-size: 14px;
  color: #6B6B6B;
  margin-top: -12px;
  margin-bottom: 16px;
}

.credit-progress-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.credit-progress-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.credit-progress-headline {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A1A;
}

.credit-progress-subtitle {
  font-size: 13px;
  color: #6B6B6B;
}

.credit-progress-summary {
  font-size: 13px;
  color: #1A1A1A;
  margin-top: 8px;
}

.credit-progress-bar {
  border: 1px solid #C4C4C9;
  border-radius: 6px;
}

.credit-progress-placeholder {
  padding: 12px 0;
}

.credit-progress-footer {
  margin-top: 16px;
}

.credit-progress-link {
  text-decoration: none;
  font-weight: 500;
}

.credit-progress-link:hover {
  text-decoration: underline;
}
</style>
