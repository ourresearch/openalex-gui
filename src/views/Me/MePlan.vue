<template>
  <div>
    <!-- ===== NEW ALICE LAYOUT ===== -->
    <template v-if="aliceFeatures">
      <h1 class="text-h5 font-weight-bold mb-6">Usage</h1>

      <!-- Your Plan -->
      <SettingsSection title="Your Plan">
        <SettingsRow
          :label="planLabel"
          :description="userPlanBenefits.length ? userPlanBenefits.join(' · ') : 'Basic access to OpenAlex'"
        />

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
        <div class="text-body-2 text-medium-emphasis pa-4" style="max-width: 600px;">
          That's enough for:
          <ul class="mt-1 ml-4">
            <li>1,000 searches (all works that mention "kangaroo")</li>
            <li>10,000 filtered result sets (all works from Africa that are open-access and support SDG #2)</li>
            <li>100k–1M exported results (depends whether you're searching or filtering)</li>
          </ul>
          <div class="mt-2">
            To learn more about usage limits, see the <a href="https://developers.openalex.org/api-reference/authentication" target="_blank">developer portal</a>.
          </div>
        </div>
      </SettingsSection>

      <!-- Usage -->
      <div class="usage-section">
        <h3 class="usage-section-header">Your Usage</h3>
        <CreditProgressBar
          :used="dailyUsedUsd"
          :total="dailyBudgetUsd"
          :countdown="true"
          label="Daily budget"
          :description="resetDescription"
          :summary="dailyBudgetSummary"
          class="mb-4"
        />

        <div class="prepaid-balance-card">
          <div class="prepaid-title">Prepaid balance</div>
          <template v-if="hasPrepaidBalance">
            <div class="prepaid-description">Your prepaid balance kicks in after your daily budget runs out for the day.</div>
            <div class="prepaid-amount">{{ formatUsd(prepaidRemainingUsd) }}</div>
            <div v-if="prepaidSubtitle" class="prepaid-subtitle">{{ prepaidSubtitle }}</div>
          </template>
          <template v-else>
            <div class="prepaid-placeholder">Buy prepaid usage for extra API budget beyond your included daily allowance.</div>
          </template>
          <div class="prepaid-footer">
            <div class="coming-soon-banner">
              Coming Soon
            </div>
            <!-- Buy button hidden until launch on Monday
            <v-btn
              color="black"
              variant="flat"
              rounded="lg"
              class="text-none"
              @click="openPurchaseDialog"
            >
              {{ hasPrepaidBalance ? 'Buy more prepaid usage' : 'Buy prepaid usage' }}
            </v-btn>
            -->
          </div>
        </div>
      </div>
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

    <!-- Buy Prepaid Usage Dialog -->
    <v-dialog v-model="showQuantityDialog" max-width="420">
      <v-card class="pa-6" rounded="lg">
        <v-card-title class="text-h6 font-weight-bold pa-0 mb-2">Buy Prepaid Usage</v-card-title>
        <v-card-text class="pa-0">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Add prepaid usage in $1 increments. Expires 3 months after your most recent purchase.
          </p>

          <v-text-field
            v-model.number="fundsDollars"
            type="number"
            label="Amount ($)"
            :min="1"
            variant="outlined"
            density="compact"
            hide-details="auto"
            class="mb-3"
          />

          <div class="d-flex justify-space-between text-body-2 mb-4">
            <span class="text-medium-emphasis">Total</span>
            <span class="font-weight-bold">{{ formatUsd(fundsDollars) }}</span>
          </div>

          <v-alert v-if="purchaseError" type="error" variant="tonal" density="compact" class="mb-3">
            {{ purchaseError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-0 pt-2">
          <v-spacer />
          <v-btn variant="text" @click="showQuantityDialog = false" :disabled="purchaseLoading">Cancel</v-btn>
          <v-btn
            color="black"
            variant="flat"
            @click="startCheckout"
            :loading="purchaseLoading"
            :disabled="!fundsDollars || fundsDollars < 1"
          >
            Continue to Checkout
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
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { formatUsd } from '@/store';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import CreditProgressBar from '@/components/Credits/CreditProgressBar.vue';

defineOptions({ name: 'MePlan' });

const showChangePlanDialog = ref(false);

useHead({ title: 'Usage' });

const store = useStore();

const aliceFeatures = computed(() => store.getters.featureFlags.aliceFeatures);

const userPlan = computed(() => store.state.user.plan);
const userPlanExpiresAt = computed(() => store.state.user.planExpiresAt);
const organizationId = computed(() => store.state.user.organizationId);
const organizationName = computed(() => store.state.user.organizationName);
const organizationRole = computed(() => store.state.user.organizationRole);
const organizationPlan = computed(() => store.state.user.organizationPlan);
const plans = computed(() => store.getters.plans || []);
const rateLimitData = computed(() => store.state.rateLimitData);

const hasOrganization = computed(() => !!organizationId.value);

const roleDescription = computed(() => {
  if (!organizationRole.value) return 'a member';
  if (organizationRole.value === 'owner') return 'an owner';
  return `a ${organizationRole.value}`;
});

function getPlanDisplayName(planName, fallback = 'Free Plan') {
  if (!planName) return fallback;
  const plan = plans.value.find(p => p.name === planName);
  return plan?.display_name || planName;
}

const planLabel = computed(() => getPlanDisplayName(userPlan.value));

function getPlanData(planName) {
  if (!planName) return null;
  return plans.value.find(p => p.name === planName);
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
  return [`$1 of usage per day`];
});

const orgPlanBenefits = computed(() => {
  const planData = getPlanData(organizationPlan.value);
  if (planData?.member_benefits) {
    return planData.member_benefits;
  }
  return planData?.benefits || [];
});

// --- Usage ---

const dailyBudgetUsd = computed(() => rateLimitData.value?.daily_budget_usd ?? store.getters.defaultDailyBudgetUsd);
const dailyUsedUsd = computed(() => rateLimitData.value?.daily_used_usd ?? 0);

const dailyRemainingUsd = computed(() => Math.max(0, dailyBudgetUsd.value - dailyUsedUsd.value));

const dailyPctRemaining = computed(() => {
  if (dailyBudgetUsd.value <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(((dailyBudgetUsd.value - dailyUsedUsd.value) / dailyBudgetUsd.value) * 100)));
});

const dailyBudgetSummary = computed(() => {
  return `${formatUsd(dailyRemainingUsd.value)} remaining (${dailyPctRemaining.value}%) of your ${formatUsd(dailyBudgetUsd.value)} daily budget`;
});

const resetDescription = computed(() => {
  const now = new Date();
  const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const diffMs = midnightUTC - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `Your daily budget resets in ${hours} hr ${minutes} min.`;
});

const hasPrepaidBalance = computed(() => (rateLimitData.value?.prepaid_remaining_usd ?? 0) > 0);
const prepaidRemainingUsd = computed(() => rateLimitData.value?.prepaid_remaining_usd ?? 0);

const prepaidSubtitle = computed(() => {
  if (rateLimitData.value?.prepaid_expires_at) {
    const now = new Date();
    const expires = new Date(rateLimitData.value.prepaid_expires_at);
    const diffDays = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60 * 24)));
    return `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
  return '';
});

// Purchase dialog
const showQuantityDialog = ref(false);
const fundsDollars = ref(1);
const purchaseLoading = ref(false);
const purchaseError = ref('');

function openPurchaseDialog() {
  showQuantityDialog.value = true;
  fundsDollars.value = 1;
  purchaseError.value = '';
}

async function startCheckout() {
  purchaseLoading.value = true;
  purchaseError.value = '';

  try {
    const resp = await axios.post(
      `${urlBase.userApi}/checkout/create-session`,
      { quantity: fundsDollars.value },
      axiosConfig({ userAuth: true })
    );
    window.location.href = resp.data.checkout_url;
  } catch (e) {
    purchaseError.value = e.response?.data?.message || 'Failed to start checkout. Please try again.';
    purchaseLoading.value = false;
  }
}
</script>

<style scoped>
.usage-section {
  margin-top: 40px;
}

.usage-section-header {
  font-size: 16px;
  font-weight: 500;
  color: #1A1A1A;
  margin-bottom: 12px;
}

.prepaid-balance-card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 10px;
  padding: 20px 24px;
}

.prepaid-balance-card .prepaid-title {
  font-size: 16px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 16px;
}

.prepaid-description {
  font-size: 14px;
  color: #6B6B6B;
  margin-top: -12px;
  margin-bottom: 16px;
}

.prepaid-amount {
  font-size: 28px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 2px;
}

.prepaid-subtitle {
  font-size: 13px;
  color: #6B6B6B;
}

.prepaid-placeholder {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  padding: 4px 0;
}

.prepaid-footer {
  margin-top: 16px;
}

.coming-soon-banner {
  display: inline-block;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #71717A;
  background: #F4F4F5;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  letter-spacing: 0.02em;
}
</style>
