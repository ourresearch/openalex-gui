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
      <SettingsSection title="Organization Plan">
        <!-- Current Plan -->
        <SettingsRow
          :label="planDisplayName"
          description="Your organization's subscription to OpenAlex"
        >
          <v-btn
            variant="outlined"
            size="small"
            @click="showChangePlanDialog = true"
          >
            Change Plan
          </v-btn>
        </SettingsRow>

        <!-- Benefits -->
        <SettingsRow
          v-if="planBenefits.length"
          label="Benefits"
          description="Features included with your organization's plan"
          :fullWidth="true"
        >
          <template #default>
            <ul class="benefits-list">
              <li v-for="(benefit, idx) in planBenefits" :key="idx" class="benefit-item">
                <v-icon size="16" color="success" class="mr-2">mdi-check</v-icon>
                <span class="text-body-2">{{ benefit }}</span>
              </li>
            </ul>
          </template>
        </SettingsRow>

        <!-- Member Benefits -->
        <SettingsRow
          v-if="planMemberBenefits.length"
          label="Member Benefits"
          description="Features available to members of your organization"
          :fullWidth="true"
        >
          <template #default>
            <ul class="benefits-list">
              <li v-for="(benefit, idx) in planMemberBenefits" :key="idx" class="benefit-item">
                <v-icon size="16" color="success" class="mr-2">mdi-check</v-icon>
                <span class="text-body-2">{{ benefit }}</span>
              </li>
            </ul>
          </template>
        </SettingsRow>

        <!-- Plan Expiration Date -->
        <SettingsRow
          label="Plan expiration date"
          description="When your current plan subscription ends"
        >
          <span v-if="organization.plan_expires_at" class="settings-value">
            <v-tooltip :text="formatDateTime(organization.plan_expires_at)" location="top">
              <template #activator="{ props }">
                <span v-bind="props">{{ formatDate(organization.plan_expires_at) }}</span>
              </template>
            </v-tooltip>
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </SettingsRow>
      </SettingsSection>
    </template>

    <!-- No organization -->
    <v-alert v-else type="info" variant="tonal">
      You are not part of an organization.
    </v-alert>

    <!-- Change Plan Dialog -->
    <v-dialog v-model="showChangePlanDialog" max-width="400">
      <v-card>
        <v-card-title>Change plan</v-card-title>
        <v-card-text>
          To change your organization's plan, please contact support.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showChangePlanDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            variant="flat"
            color="primary"
            href="https://help.openalex.org/hc/en-us/requests/new"
            target="_blank"
            @click="showChangePlanDialog = false"
          >
            Contact Support
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

defineOptions({ name: 'SettingsOrgPlan' });

useHead({ title: 'Organization Plan' });

const store = useStore();

const organization = ref(null);
const loading = ref(true);
const error = ref('');
const showChangePlanDialog = ref(false);

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

const planMemberBenefits = computed(() => {
  if (!organization.value?.plan) return [];
  const plan = plans.value.find(p => p.name === organization.value.plan);
  return plan?.member_benefits || [];
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

function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = parseUTCDate(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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

onMounted(() => {
  fetchOrganization();
});
</script>

<style scoped>
.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefit-item {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
}

.benefit-item .v-icon {
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
