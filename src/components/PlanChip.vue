<template>
  <span class="plan-chip" :style="chipStyle">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'PlanChip' });

const props = defineProps({
  planName: { type: String, default: null },
  displayName: { type: String, default: null },
});

const store = useStore();
const plans = computed(() => store.getters.plans || []);

const label = computed(() => {
  if (props.displayName) return props.displayName;
  if (!props.planName) return 'Default';
  const plan = plans.value.find(p => p.name === props.planName);
  return plan?.display_name || props.planName;
});

// Color map by plan tier
const colorMap = {
  'default': { bg: '#F0F0F0', text: '#6B6B6B' },
  'starter': { bg: '#F0F0F0', text: '#6B6B6B' },
  'professional': { bg: '#E8F0FE', text: '#1A56DB' },
  '1M-daily': { bg: '#E8F0FE', text: '#1A56DB' },
  '2M-daily': { bg: '#DBEAFE', text: '#1E40AF' },
  'academic-waiver': { bg: '#E0F2F1', text: '#00796B' },
  'enterprise': { bg: '#EDE7F6', text: '#5E35B1' },
};

const chipStyle = computed(() => {
  const colors = colorMap[props.planName] || colorMap['default'];
  return {
    backgroundColor: colors.bg,
    color: colors.text,
  };
});
</script>

<style scoped>
.plan-chip {
  display: inline-block;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
}
</style>
