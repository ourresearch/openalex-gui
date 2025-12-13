<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-6">Organization Plan</h1>

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
      <SettingsSection title="Plan Details">
        <!-- Current Plan -->
        <SettingsRow
          label="Current plan"
          :description="planBenefits.length ? planBenefits.join(' · ') : 'Your organization\'s subscription to OpenAlex'"
        >
          <span class="settings-value">{{ planDisplayName }}</span>
        </SettingsRow>

        <!-- Plan Expires -->
        <SettingsRow
          v-if="organization.plan && organization.plan_expires_at"
          label="Plan expires"
          description="When your current plan subscription ends"
        >
          <v-tooltip :text="formatDateTime(organization.plan_expires_at)" location="top">
            <template #activator="{ props }">
              <span v-bind="props" class="text-body-2">{{ formatAge(organization.plan_expires_at) }}</span>
            </template>
          </v-tooltip>
        </SettingsRow>
      </SettingsSection>

      <div class="mt-6 text-body-2 text-grey-darken-1">
        Need to upgrade or change your plan? 
        <a href="https://help.openalex.org/pricing" target="_blank" rel="noopener">View pricing options</a>
        or
        <a href="https://openalex.zendesk.com/hc/en-us/requests/new" target="_blank" rel="noopener">contact support</a>.
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
import { format } from 'timeago.js';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

defineOptions({ name: 'SettingsOrgPlan' });

useHead({ title: 'Organization Plan' });

const store = useStore();

const organization = ref(null);
const loading = ref(true);
const error = ref('');

const organizationId = computed(() => store.state.user.organizationId);
const plans = computed(() => store.getters.plans || []);

const planDisplayName = computed(() => {
  if (!organization.value?.plan) return 'Default';
  const plan = plans.value.find(p => p.name === organization.value.plan);
  return plan?.display_name || organization.value.plan;
});

const planBenefits = computed(() => {
  if (!organization.value?.plan) return [];
  const plan = plans.value.find(p => p.name === organization.value.plan);
  return plan?.benefits || [];
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

function parseUTCDate(dateStr) {
  if (!dateStr) return null;
  if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    dateStr = dateStr.replace(' ', 'T') + 'Z';
  }
  return new Date(dateStr);
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = parseUTCDate(dateStr);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function formatAge(dateStr) {
  if (!dateStr) return null;
  return format(parseUTCDate(dateStr));
}

onMounted(() => {
  fetchOrganization();
});
</script>
