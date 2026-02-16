<template>
  <div>
    <!-- ===== NEW ALICE LAYOUT ===== -->
    <template v-if="aliceFeatures">
      <h1 class="text-h5 font-weight-bold mb-2">Plan & Usage</h1>
      <div class="d-flex align-center mb-6">
        <v-btn
          variant="outlined"
          size="small"
          @click="showChangePlanDialog = true"
        >
          Change Plan
        </v-btn>
      </div>

      <!-- Credit Usage Hero -->
      <SettingsSection title="Credit Usage">
        <div class="d-flex align-center justify-center ga-8 py-6 px-4 flex-wrap">
          <CreditDonut
            :used="dailyUsed"
            :total="apiLimit"
            label="Daily"
            :size="130"
          />
          <CreditDonut
            v-if="hasPurchasedCredits"
            :used="purchasedUsed"
            :total="purchasedTotal"
            label="Purchased"
            :size="130"
          />
          <CreditDonut
            v-else
            :placeholder="true"
            label="Purchased"
            :size="130"
          />
        </div>
        <div class="d-flex align-center justify-space-between px-5 pb-4 text-caption text-medium-emphasis">
          <span>Resets at midnight UTC</span>
          <router-link to="/pricing" class="text-caption">Buy credits</router-link>
        </div>
      </SettingsSection>

      <!-- Your Plan -->
      <SettingsSection title="Your Plan">
        <SettingsRow
          label="Plan"
          :description="userPlanBenefits.length ? userPlanBenefits.join(' · ') : 'Basic access to OpenAlex'"
        >
          <span class="settings-value">{{ userPlanDisplayName }}</span>
        </SettingsRow>

        <SettingsRow
          v-if="userPlanExpiresAt"
          label="Expires"
        >
          <v-tooltip :text="formatDateTime(userPlanExpiresAt)" location="top">
            <template #activator="{ props }">
              <span class="settings-value" v-bind="props">{{ formatDate(userPlanExpiresAt) }}</span>
            </template>
          </v-tooltip>
        </SettingsRow>
      </SettingsSection>

      <!-- Organization Plan -->
      <SettingsSection v-if="hasOrganization && organizationPlan" title="Organization Plan">
        <SettingsRow
          label="Plan"
          :description="`As ${roleDescription} of ${organizationName}`"
        >
          <span class="settings-value">{{ orgPlanDisplayName }}</span>
        </SettingsRow>

        <SettingsRow
          v-if="orgPlanBenefits.length"
          label="Benefits"
        >
          <span class="text-body-2">{{ orgPlanBenefits.join(' · ') }}</span>
        </SettingsRow>
      </SettingsSection>
    </template>

    <!-- ===== OLD LAYOUT (flag off) ===== -->
    <template v-else>
      <h1 class="text-h5 font-weight-bold mb-6">Plan</h1>
      <SettingsSection title="Your Plan">
        <SettingsRow
          :label="userPlanDisplayName"
          :description="userPlanBenefits.length ? userPlanBenefits.join(' · ') : 'Basic access to OpenAlex'"
        >
          <v-btn
            variant="outlined"
            size="small"
            @click="showChangePlanDialog = true"
          >
            Change Plan
          </v-btn>
        </SettingsRow>

        <SettingsRow
          label="Plan expiration date"
          description="When your current plan subscription ends"
        >
          <span v-if="userPlanExpiresAt" class="settings-value">
            <v-tooltip :text="formatDateTime(userPlanExpiresAt)" location="top">
              <template #activator="{ props }">
                <span v-bind="props">{{ formatDate(userPlanExpiresAt) }}</span>
              </template>
            </v-tooltip>
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection v-if="hasOrganization && organizationPlan" title="Organization Plan">
        <SettingsRow
          label="Plan"
          :description="`As ${roleDescription} of ${organizationName}, you benefit from your organization's plan`"
        >
          <span class="settings-value">{{ orgPlanDisplayName }}</span>
        </SettingsRow>

        <SettingsRow
          v-if="orgPlanBenefits.length"
          label="Benefits"
          description="Additional features from your organization's plan"
        >
          <span class="text-body-2">{{ orgPlanBenefits.join(' · ') }}</span>
        </SettingsRow>
      </SettingsSection>
    </template>

    <!-- Change Plan Dialog -->
    <v-dialog v-model="showChangePlanDialog" max-width="400">
      <v-card>
        <v-card-title>Change plan</v-card-title>
        <v-card-text>
          To change your plan, please contact support.
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
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import CreditDonut from '@/components/Credits/CreditDonut.vue';

defineOptions({ name: 'MePlan' });

const showChangePlanDialog = ref(false);

useHead({ title: 'Plan' });

const store = useStore();

const aliceFeatures = computed(() => store.getters.featureFlags.aliceFeatures);
const rateLimitData = computed(() => store.state.rateLimitData);

const userPlan = computed(() => store.state.user.plan);
const userPlanExpiresAt = computed(() => store.state.user.planExpiresAt);
const organizationId = computed(() => store.state.user.organizationId);
const organizationName = computed(() => store.state.user.organizationName);
const organizationRole = computed(() => store.state.user.organizationRole);
const organizationPlan = computed(() => store.state.user.organizationPlan);
const plans = computed(() => store.getters.plans || []);
const defaultApiMaxPerDay = computed(() => store.state.defaultApiMaxPerDay);

const hasOrganization = computed(() => !!organizationId.value);

const roleDescription = computed(() => {
  if (!organizationRole.value) return 'a member';
  if (organizationRole.value === 'owner') return 'an owner';
  return `a ${organizationRole.value}`;
});

// API limit computation (same logic as UserApiSection)
const apiLimit = computed(() => {
  if (userPlan.value) {
    const plan = plans.value.find(p => p.name === userPlan.value);
    if (plan?.api_max_per_day) return plan.api_max_per_day;
  }
  if (organizationPlan.value) {
    const plan = plans.value.find(p => p.name === organizationPlan.value);
    if (plan?.member_api_max_per_day) return plan.member_api_max_per_day;
    if (plan?.api_max_per_day) return plan.api_max_per_day;
  }
  return defaultApiMaxPerDay.value;
});

// Credit donut data
const dailyUsed = computed(() => rateLimitData.value?.credits_used ?? 0);
const hasPurchasedCredits = computed(() => (rateLimitData.value?.onetime_credits_balance ?? 0) > 0);
const purchasedTotal = computed(() => rateLimitData.value?.onetime_credits_balance ?? 0);
const purchasedUsed = computed(() => purchasedTotal.value - (rateLimitData.value?.onetime_credits_remaining ?? 0));

function getPlanDisplayName(planName) {
  if (!planName) return 'Default';
  const plan = plans.value.find(p => p.name === planName);
  return plan?.display_name || planName;
}

function getPlanData(planName) {
  if (!planName) return null;
  return plans.value.find(p => p.name === planName);
}

function formatNumber(num) {
  return num?.toLocaleString() || num;
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

const userPlanDisplayName = computed(() => getPlanDisplayName(userPlan.value));
const orgPlanDisplayName = computed(() => getPlanDisplayName(organizationPlan.value));

const userPlanBenefits = computed(() => {
  const planData = getPlanData(userPlan.value);
  if (planData?.benefits) {
    return planData.benefits;
  }
  return [`${formatNumber(defaultApiMaxPerDay.value)} credits per day`];
});

const orgPlanBenefits = computed(() => {
  const planData = getPlanData(organizationPlan.value);
  if (planData?.member_benefits) {
    return planData.member_benefits;
  }
  return planData?.benefits || [];
});
</script>

<style scoped>
</style>
