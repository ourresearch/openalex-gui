<template>
  <SettingsSection title="API Access">
    <!-- API Keys -->
    <SettingsRow
      label="API Keys"
      description="Use these keys to authenticate API requests and get higher rate limits"
    >
      <div v-if="organization.api_keys && organization.api_keys.length" class="d-flex flex-column align-start ga-2">
        <ApiKeyDisplay 
          v-for="(key, idx) in organization.api_keys" 
          :key="idx" 
          :api-key="key"
        />
      </div>
      <span v-else class="text-medium-emphasis">—</span>
    </SettingsRow>

    <!-- Rate Limit -->
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
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import ApiKeyDisplay from '@/components/ApiKeyDisplay.vue';

const props = defineProps({
  organization: {
    type: Object,
    required: true
  }
});

const store = useStore();

const plans = computed(() => store.getters.plans || []);
const defaultApiMaxPerDay = computed(() => store.state.defaultApiMaxPerDay);

const apiLimit = computed(() => {
  if (!props.organization?.plan) return defaultApiMaxPerDay.value;
  const plan = plans.value.find(p => p.name === props.organization.plan);
  return plan?.api_max_per_day || defaultApiMaxPerDay.value;
});

const formattedApiLimit = computed(() => {
  return apiLimit.value?.toLocaleString() || apiLimit.value;
});

const rateLimitDescription = computed(() => {
  if (props.organization?.plan) {
    const plan = plans.value.find(p => p.name === props.organization.plan);
    const displayName = plan?.display_name || props.organization.plan;
    return `Based on the ${displayName} plan`;
  }
  return 'Upgrade the plan for higher limits';
});
</script>
