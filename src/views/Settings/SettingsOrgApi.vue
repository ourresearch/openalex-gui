<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-6">Organization API</h1>

    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Error state -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Content -->
    <template v-else-if="organization">
      <SettingsSection title="API Access">
        <!-- API Keys -->
        <SettingsRow
          label="API Keys"
          description="Use these keys to authenticate API requests and get higher rate limits for your organization"
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

    <!-- No organization -->
    <v-alert v-else type="info" variant="tonal">
      You are not part of an organization.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import ApiKeyDisplay from '@/components/ApiKeyDisplay.vue';

defineOptions({ name: 'SettingsOrgApi' });

useHead({ title: 'Organization API' });

const store = useStore();

const organization = ref(null);
const loading = ref(true);
const error = ref('');

const organizationId = computed(() => store.state.user.organizationId);
const plans = computed(() => store.getters.plans || []);
const defaultApiMaxPerDay = computed(() => store.state.defaultApiMaxPerDay);

const apiLimit = computed(() => {
  if (!organization.value?.plan) return defaultApiMaxPerDay.value;
  const plan = plans.value.find(p => p.name === organization.value.plan);
  return plan?.api_max_per_day || defaultApiMaxPerDay.value;
});

const formattedApiLimit = computed(() => {
  return apiLimit.value?.toLocaleString() || apiLimit.value;
});

const rateLimitDescription = computed(() => {
  if (organization.value?.plan) {
    const plan = plans.value.find(p => p.name === organization.value.plan);
    const displayName = plan?.display_name || organization.value.plan;
    return `Based on your organization's ${displayName} plan`;
  }
  return 'Upgrade your plan for higher limits';
});

async function fetchOrganization() {
  if (!organizationId.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${organizationId.value}`,
      axiosConfig({ userAuth: true })
    );
    organization.value = res.data;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load organization.';
    organization.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchOrganization();
});
</script>
