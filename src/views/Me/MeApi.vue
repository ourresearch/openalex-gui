<template>
  <div>
    <SettingsSection title="API Access">
      <SettingsRow
        label="API Key"
        description="Use this key to authenticate API requests and get higher rate limits"
      >
        <ApiKeyDisplay :api-key="apiKey" />
      </SettingsRow>

      <SettingsRow
        label="Rate Limit"
        :description="rateLimitDescription"
      >
        <span class="settings-value">{{ formattedApiLimit }}/day</span>
      </SettingsRow>
    </SettingsSection>

    <div class="mt-6 text-body-2 text-grey-darken-1">
      Learn more about the API in the
      <a href="https://docs.openalex.org" target="_blank" rel="noopener">OpenAlex documentation</a>.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import ApiKeyDisplay from '@/components/ApiKeyDisplay.vue';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

defineOptions({ name: 'MeApi' });

useHead({ title: 'API' });

const store = useStore();
const apiKey = computed(() => store.state.user.apiKey);
const userPlan = computed(() => store.state.user.plan);
const organizationPlan = computed(() => store.state.user.organizationPlan);
const plans = computed(() => store.getters.plans || []);
const defaultApiMaxPerDay = computed(() => store.state.defaultApiMaxPerDay);

const apiLimit = computed(() => {
  // Check user's own plan first
  if (userPlan.value) {
    const plan = plans.value.find(p => p.name === userPlan.value);
    if (plan?.api_max_per_day) return plan.api_max_per_day;
  }
  
  // Check organization plan (use member_api_max_per_day if available)
  if (organizationPlan.value) {
    const plan = plans.value.find(p => p.name === organizationPlan.value);
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
  if (userPlan.value) {
    return `Based on your ${userPlan.value} plan`;
  }
  if (organizationPlan.value) {
    return `Based on your organization's ${organizationPlan.value} plan`;
  }
  return 'Upgrade your plan for higher limits';
});
</script>

<style scoped>
</style>
