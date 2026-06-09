<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-6">Usage</h1>

    <!-- Post-checkout banner (oxjob #409): a prepaid purchase applies asynchronously
         (Stripe webhook), so set expectations and auto-refresh until the balance lands. -->
    <v-alert
      v-if="showPurchaseBanner"
      :type="purchaseApplied ? 'success' : 'info'"
      variant="tonal"
      density="comfortable"
      class="mb-6"
      :icon="purchaseApplied ? '$success' : false"
    >
      <template v-if="purchaseApplied">
        Your prepaid balance is ready. Thanks for your purchase!
      </template>
      <template v-else>
        <v-progress-circular indeterminate size="16" width="2" class="mr-2" />
        Purchase received! Applying your credits — this can take up to a minute.
      </template>
    </v-alert>

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
          <v-tooltip :text="formatDateTime(userPlanExpiresAt)" :aria-label="formatDateTime(userPlanExpiresAt)" location="top">
            <template #activator="{ props }">
              <span class="settings-value" v-bind="props">{{ formatDate(userPlanExpiresAt) }}</span>
            </template>
          </v-tooltip>
        </SettingsRow>
        <div class="text-medium-emphasis pa-4" style="max-width: 600px; font-size: 13px;">
          That's enough for:
          <ul class="mt-1 ml-4">
            <li>1,000 searches (<router-link to="/works?search.title_and_abstract=kangaroo">example</router-link>)</li>
            <li>10,000 filtered result sets (<router-link to="/works?page=1&filter=open_access.is_oa:true,type:article,primary_topic.id:t10862">example</router-link>)</li>
            <li>100k–1M exported results (depends whether you're searching or filtering)</li>
          </ul>
          <div class="mt-2">
            To learn more about usage limits, see the <a href="https://developers.openalex.org/api-reference/authentication" target="_blank">developer portal</a>.
          </div>
        </div>

        <!-- What costs credits (oxjob #409): dispel "browsing the website is free". -->
        <div class="text-medium-emphasis pa-4 pt-0" style="max-width: 600px; font-size: 13px;">
          <strong>What uses credits?</strong>
          <ul class="mt-1 ml-4">
            <li>Viewing a single record (one work, author, source, etc.) is <strong>free</strong>.</li>
            <li>A search costs <strong>10 credits</strong>; each filtered list or facet costs <strong>1 credit</strong>.</li>
            <li>Searching and browsing openalex.org fire several of these per page, so exploring the site uses credits too.</li>
          </ul>
          <div class="mt-1">10,000 credits = $1. Your daily budget covers everyday use; prepaid balance covers anything beyond it.</div>
        </div>
      </SettingsSection>

      <!-- Usage -->
      <div class="usage-section">
        <div class="d-flex align-center justify-space-between mb-2">
          <h3 class="usage-section-header mb-0">Your Usage</h3>
          <div class="usage-refresh text-caption text-medium-emphasis d-flex align-center ga-2">
            <span v-if="lastCheckedText">{{ lastCheckedText }}</span>
            <a
              href="#"
              class="refresh-link"
              :class="{ 'text-disabled': isRefreshing }"
              @click.prevent="refreshUsage"
            >
              {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
            </a>
          </div>
        </div>
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
          <div class="prepaid-title">
            Prepaid balance
            <span v-if="dailyExhaustedWithPrepaid" class="prepaid-active-chip">Active</span>
          </div>
          <template v-if="hasPrepaidBalance">
            <div class="prepaid-description">
              <template v-if="dailyExhaustedWithPrepaid">Your daily budget is used up, so usage is now drawing from this balance.</template>
              <template v-else>Your prepaid balance kicks in after your daily budget runs out for the day.</template>
            </div>
            <div class="prepaid-amount">{{ formatUsd(prepaidRemainingUsd, 2) }}</div>
            <div v-if="prepaidSubtitle" class="prepaid-subtitle">{{ prepaidSubtitle }}</div>
          </template>
          <template v-else>
            <div class="prepaid-placeholder">Buy prepaid usage for extra API budget beyond your included daily allowance.</div>
          </template>
          <div class="prepaid-footer">
            <v-btn
              color="black"
              variant="flat"
              rounded="lg"
              class="text-none"
              @click="openPurchaseDialog"
            >
              {{ hasPrepaidBalance ? 'Buy more prepaid usage' : 'Buy prepaid usage' }}
            </v-btn>
          </div>
        </div>
      </div>

    <!-- Payment History -->
    <div v-if="purchases.length" class="usage-section">
      <h3 class="usage-section-header">Payment History</h3>
      <div class="payment-history-card">
        <div
          v-for="purchase in purchases"
          :key="purchase.id"
          class="payment-row"
        >
          <div class="payment-info">
            <span class="payment-date">{{ formatDate(purchase.created_at) }}</span>
            <span class="payment-amount">{{ formatUsd(purchase.amount_paid_cents / 100, 2) }}</span>
          </div>
          <a
            href="#"
            class="payment-receipt-link"
            @click.prevent="openReceipt(purchase)"
          >
            View receipt
          </a>
        </div>
      </div>
    </div>

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
            <span class="font-weight-bold">{{ formatUsd(fundsDollars, 2) }}</span>
          </div>

          <v-checkbox
            v-model="companyInvoice"
            density="compact"
            hide-details
            class="mb-1"
          >
            <template #label>
              <span class="text-body-2">I need a company / VAT invoice</span>
            </template>
          </v-checkbox>
          <p v-if="companyInvoice" class="text-caption text-medium-emphasis mb-4">
            You'll be asked for your billing address and (optional) VAT/Tax ID at checkout so
            the invoice can be addressed to your company.
          </p>

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
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { formatUsd } from '@/store';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import CreditProgressBar from '@/components/Credits/CreditProgressBar.vue';

defineOptions({ name: 'MePlan' });

const showChangePlanDialog = ref(false);
const purchases = ref([]);

useHead({ title: 'Usage' });

// Fetch purchase history
async function fetchPurchases() {
  try {
    const resp = await axios.get(
      `${urlBase.userApi}/purchases`,
      axiosConfig({ userAuth: true })
    );
    purchases.value = resp.data.purchases || [];
  } catch (e) {
    console.error('Failed to fetch purchases:', e);
  }
}
fetchPurchases();

async function openReceipt(purchase) {
  if (purchase.stripe_hosted_invoice_url) {
    window.open(purchase.stripe_hosted_invoice_url, '_blank');
    return;
  }
  // Fallback for purchases without a Stripe invoice
  try {
    const resp = await axios.get(
      `${urlBase.userApi}/purchases/${purchase.id}/receipt`,
      {
        ...axiosConfig({ userAuth: true }),
        responseType: 'text',
      }
    );
    const blob = new Blob([resp.data], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (e) {
    console.error('Failed to load receipt:', e);
  }
}

const store = useStore();

const userPlan = computed(() => store.state.user.plan);
const userPlanExpiresAt = computed(() => store.state.user.planExpiresAt);
const organizationId = computed(() => store.state.user.organizationId);
const organizationName = computed(() => store.state.user.organizationName);
const organizationRole = computed(() => store.state.user.organizationRole);
const organizationPlan = computed(() => store.state.user.organizationPlan);
const plans = computed(() => store.getters.plans || []);
const rateLimitData = computed(() => store.state.rateLimitData);

// Refresh usage
const isRefreshing = ref(false);
const now = ref(Date.now());

// Update "now" every 10s so relative time stays fresh
const nowTimer = setInterval(() => { now.value = Date.now(); }, 10000);
onUnmounted(() => { clearInterval(nowTimer); });

const lastCheckedText = computed(() => {
  const ts = store.state.rateLimitLastFetchedAt;
  if (!ts) return '';
  const diffSec = Math.floor((now.value - ts) / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin} min ago`;
});

async function refreshUsage() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await store.dispatch('fetchRateLimitData', { fresh: true });
    now.value = Date.now();
  } finally {
    isRefreshing.value = false;
  }
}

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
  const benefits = planData?.benefits ? [...planData.benefits] : [];
  // Replace the first benefit (budget line) with the actual daily budget from rate-limit
  // to avoid stale plan text contradicting real usage data
  const budgetLine = `${formatUsd(dailyBudgetUsd.value, 2)}/day included API budget`;
  if (benefits.length > 0) {
    benefits[0] = budgetLine;
  } else {
    benefits.push(budgetLine);
  }
  return benefits;
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

const hasPrepaidBalance = computed(() => (rateLimitData.value?.prepaid_remaining_usd ?? 0) > 0);
const prepaidRemainingUsd = computed(() => rateLimitData.value?.prepaid_remaining_usd ?? 0);

// Daily budget is spent but a prepaid balance is covering usage. We surface this
// explicitly so a bare "$0.00 remaining" isn't misread as "blocked" — the most
// common confusion right after someone buys prepaid credit (ZD #9032, oxjob #409).
const dailyExhaustedWithPrepaid = computed(() => dailyRemainingUsd.value <= 0 && hasPrepaidBalance.value);

const dailyBudgetSummary = computed(() => {
  if (dailyExhaustedWithPrepaid.value) {
    return `Daily budget used up — usage is now drawing from your ${formatUsd(prepaidRemainingUsd.value, 2)} prepaid balance.`;
  }
  return `${formatUsd(dailyRemainingUsd.value)} remaining (${dailyPctRemaining.value}%) of your ${formatUsd(dailyBudgetUsd.value)} daily budget`;
});

const resetDescription = computed(() => {
  const now = new Date();
  const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const diffMs = midnightUTC - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `Your daily budget refills at midnight UTC (in ${hours} hr ${minutes} min).`;
});

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
const companyInvoice = ref(false);
const purchaseLoading = ref(false);
const purchaseError = ref('');

function openPurchaseDialog() {
  showQuantityDialog.value = true;
  fundsDollars.value = 1;
  companyInvoice.value = false;
  purchaseError.value = '';
}

async function startCheckout() {
  purchaseLoading.value = true;
  purchaseError.value = '';

  try {
    const resp = await axios.post(
      `${urlBase.userApi}/checkout/create-session`,
      { quantity: fundsDollars.value, company_invoice: companyInvoice.value },
      axiosConfig({ userAuth: true })
    );
    window.location.href = resp.data.checkout_url;
  } catch (e) {
    purchaseError.value = e.response?.data?.message || 'Failed to start checkout. Please try again.';
    purchaseLoading.value = false;
  }
}

// --- Post-checkout: apply credits + reassure (oxjob #409) ---
const route = useRoute();
const router = useRouter();
const showPurchaseBanner = ref(false);
const purchaseApplied = ref(false);
let pollTimer = null;

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}
onUnmounted(stopPolling);

async function handlePostCheckout() {
  if (route.query.purchase !== 'success') return;
  showPurchaseBanner.value = true;
  purchaseApplied.value = false;

  // Strip the query param so a refresh/back doesn't replay the banner.
  const q = { ...route.query };
  delete q.purchase;
  delete q.credits;
  router.replace({ query: q });

  // The credit lands via the Stripe webhook, which can lag the redirect by a
  // few seconds. Poll the balance (fresh=1 forces a DB read through the proxy)
  // until it rises above what we had at arrival, then declare it ready.
  const baseline = prepaidRemainingUsd.value;
  let attempts = 0;
  const maxAttempts = 20; // ~60s at 3s intervals

  const check = async () => {
    attempts++;
    await store.dispatch('fetchRateLimitData', { fresh: true });
    now.value = Date.now();
    if (prepaidRemainingUsd.value > baseline) {
      purchaseApplied.value = true;
      fetchPurchases();
      stopPolling();
    } else if (attempts >= maxAttempts) {
      // Give up waiting but don't leave the user stuck on "applying" — the
      // balance is almost certainly there (or the webhook is delayed server-side).
      purchaseApplied.value = true;
      fetchPurchases();
      stopPolling();
    }
  };

  await check();
  if (!purchaseApplied.value) {
    pollTimer = setInterval(check, 3000);
  }
}

onMounted(handlePostCheckout);
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

.prepaid-active-chip {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #1B5E20;
  background: #E6F4EA;
  border-radius: 999px;
  vertical-align: middle;
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

.refresh-link {
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.refresh-link:hover {
  color: #1A1A1A;
}

.payment-history-card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 10px;
  overflow: hidden;
}

.payment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
}

.payment-row + .payment-row {
  border-top: 1px solid #F0F0F0;
}

.payment-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.payment-date {
  font-size: 14px;
  color: #6B6B6B;
  min-width: 100px;
}

.payment-amount {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A1A;
}

.payment-receipt-link {
  font-size: 13px;
  color: #3366cc;
  text-decoration: none;
}

.payment-receipt-link:hover {
  text-decoration: underline;
}

</style>
