<template>
  <SettingsSection title="API Access">
    <!-- API Key -->
    <SettingsRow
      label="API Key"
      description="Use this key to authenticate API requests and get more daily credits"
    >
      <ApiKeyDisplay v-if="user.api_key" :api-key="user.api_key" />
      <span v-else class="text-medium-emphasis">—</span>
    </SettingsRow>

    <!-- Credits Limit -->
    <SettingsRow
      label="Daily Credits"
      :description="rateLimitDescription"
    >
      <span class="settings-value">{{ formattedApiLimit }} credits/day</span>
    </SettingsRow>
  </SettingsSection>

  <div class="mt-6 text-body-2 text-grey-darken-1">
    Learn more about the API in the
    <a href="https://docs.openalex.org" target="_blank" rel="noopener">OpenAlex documentation</a>.
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import ApiKeyDisplay from '@/components/ApiKeyDisplay.vue';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const store = useStore();

const plans = computed(() => store.getters.plans || []);
const defaultApiMaxPerDay = computed(() => store.state.defaultApiMaxPerDay);

const apiLimit = computed(() => {
  // Check user's own plan first
  if (props.user?.plan) {
    const plan = plans.value.find(p => p.name === props.user.plan);
    if (plan?.api_max_per_day) return plan.api_max_per_day;
  }
  
  // Check organization plan (use member_api_max_per_day if available)
  if (props.user?.organization_plan) {
    const plan = plans.value.find(p => p.name === props.user.organization_plan);
    if (plan?.member_api_max_per_day) return plan.member_api_max_per_day;
    if (plan?.api_max_per_day) return plan.api_max_per_day;
  }
  
  // Fall back to default
  return defaultApiMaxPerDay.value;
});

const formattedApiLimit = computed(() => {
  return apiLimit.value?.toLocaleString() || apiLimit.value;
});

const rateLimitDescription = computed(() => {
  if (props.user?.plan) {
    const plan = plans.value.find(p => p.name === props.user.plan);
    const displayName = plan?.display_name || props.user.plan;
    return `Based on user's ${displayName} plan`;
  }
  if (props.user?.organization_plan) {
    const plan = plans.value.find(p => p.name === props.user.organization_plan);
    const displayName = plan?.display_name || props.user.organization_plan;
    return `Based on organization's ${displayName} plan`;
  }
  return 'Default credits limit';
});
</script>
