<template>
  <SettingsSection title="API Access">
    <!-- API Key -->
    <SettingsRow
      label="API Key"
      description="Use this key to authenticate API requests and access your daily budget"
    >
      <ApiKeyDisplay v-if="user.api_key" :api-key="user.api_key" />
      <span v-else class="text-medium-emphasis">—</span>
    </SettingsRow>

    <!-- Daily Budget -->
    <SettingsRow
      label="Daily Budget"
      :description="rateLimitDescription"
    >
      <div class="api-value-block">
        <span class="settings-value">{{ formattedDailyBudget }}/day</span>
        <div v-if="rateLimitData" class="text-caption text-medium-emphasis mt-1">
          {{ formatUsd(rateLimitData.daily_used_usd) }} used today
          · {{ formatUsd(rateLimitData.daily_remaining_usd) }} remaining
          · resets at midnight UTC
        </div>
      </div>
    </SettingsRow>

    <!-- Prepaid Balance -->
    <SettingsRow
      label="Prepaid Balance"
      description="Prepaid usage purchased separately (used after daily budget runs out)"
    >
      <div v-if="rateLimitData && rateLimitData.prepaid_balance_usd > 0" class="api-value-block">
        <span class="settings-value">{{ formatUsd(rateLimitData.prepaid_remaining_usd, 2) }} remaining</span>
        <div class="text-caption text-medium-emphasis mt-1">
          of {{ formatUsd(rateLimitData.prepaid_balance_usd, 2) }} prepaid
          <template v-if="rateLimitData.prepaid_expires_at">
            · expires {{ formatExpiryDate(rateLimitData.prepaid_expires_at) }}
          </template>
        </div>
      </div>
      <div v-else class="api-value-block">
        <span class="text-medium-emphasis">None</span>
        <div class="text-caption text-medium-emphasis mt-1">
          <router-link to="/pricing">Buy prepaid usage</router-link> for use beyond your daily budget
        </div>
      </div>
    </SettingsRow>
  </SettingsSection>

  <div class="mt-6 text-body-2 text-grey-darken-1">
    Learn more about the API in the
    <a href="https://developers.openalex.org" target="_blank" rel="noopener">OpenAlex documentation</a>.
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { formatUsd } from '@/store';
import { urlBase } from '@/apiConfig';
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
const userRateLimitData = ref(null);

// When viewing a different user (admin context), fetch their rate limit data directly
const isOtherUser = computed(() => {
  return props.user?.api_key && props.user.api_key !== store.state.user?.apiKey;
});

async function fetchUserRateLimit() {
  if (!props.user?.api_key) return;
  try {
    const resp = await axios.get(`${urlBase.api}/rate-limit`, {
      headers: { Authorization: `Bearer ${props.user.api_key}` }
    });
    userRateLimitData.value = resp.data?.rate_limit || null;
  } catch (e) {
    console.warn('Failed to fetch rate limit for user:', e);
  }
}

// Use the viewed user's rate limit data if in admin context, otherwise use store's global data
const rateLimitData = computed(() => {
  if (isOtherUser.value) return userRateLimitData.value;
  return store.state.rateLimitData;
});

watch(() => props.user?.api_key, () => {
  if (isOtherUser.value) fetchUserRateLimit();
}, { immediate: true });

const plans = computed(() => store.getters.plans || []);

const dailyBudgetUsd = computed(() => {
  return rateLimitData.value?.daily_budget_usd ?? store.getters.defaultDailyBudgetUsd;
});

const formattedDailyBudget = computed(() => {
  return formatUsd(dailyBudgetUsd.value);
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
  return 'Default daily budget';
});

function formatExpiryDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

<style scoped>
/* SettingsRow is flex/space-between, so this block sits at the right edge —
   right-align its own contents so the value + caption are flush right. */
.api-value-block {
  text-align: right;
}
</style>
