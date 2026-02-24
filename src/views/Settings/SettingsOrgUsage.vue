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
      <!-- Organization Plan -->
      <SettingsSection title="Organization Plan">
        <SettingsRow
          :label="orgPlanLabel"
          :description="orgPlanBenefits.length ? orgPlanBenefits.join(' · ') : 'Basic access to OpenAlex'"
        />
        <div class="text-body-2 text-medium-emphasis pa-4" style="max-width: 600px;">
          That's enough for:
          <ul class="mt-1 ml-4">
            <li>{{ formatNumber(searchesEstimate) }} searches (<router-link to="/works?search.title_and_abstract=kangaroo">example</router-link>)</li>
            <li>{{ formatNumber(filterSetsEstimate) }} filtered result sets (<router-link to="/works?page=1&filter=open_access.is_oa:true,type:article,primary_topic.id:t10862">example</router-link>)</li>
            <li>{{ formatNumber(pdfDownloadsEstimate) }} downloaded PDFs</li>
          </ul>
          <div class="mt-2">
            To learn more about usage limits, see the <a href="https://developers.openalex.org/api-reference/authentication" target="_blank">developer portal</a>.
          </div>
        </div>
      </SettingsSection>

      <!-- Organization Usage -->
      <div class="usage-section">
        <div class="d-flex align-center justify-space-between mb-2">
          <h3 class="usage-section-header mb-0">Organization Usage</h3>
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
          v-if="orgRateLimitData"
          :used="dailyUsedUsd"
          :total="dailyBudgetUsd"
          :countdown="true"
          label="Daily budget"
          :description="resetDescription"
          :summary="dailyBudgetSummary"
          class="mb-4"
        />
        <CreditProgressBar
          v-else-if="usageError"
          :placeholder="true"
          label="Daily budget"
          :placeholder-text="usageError"
          class="mb-4"
        />
        <CreditProgressBar
          v-else
          :placeholder="true"
          label="Daily budget"
          placeholder-text="Loading usage data..."
          class="mb-4"
        />
      </div>

      <OrganizationApiSection :organization="organization" class="mb-8" />
    </template>

    <!-- No organization -->
    <v-alert v-else type="info" variant="tonal">
      You are not part of an organization.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { formatUsd, creditsToUsd } from '@/store';
import CreditProgressBar from '@/components/Credits/CreditProgressBar.vue';
import OrganizationApiSection from '@/components/Organization/OrganizationApiSection.vue';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

defineOptions({ name: 'SettingsOrgUsage' });

useHead({ title: 'Organization API' });

const store = useStore();

const organization = ref(null);
const loading = ref(true);
const error = ref('');

const orgRateLimitData = ref(null);
const usageError = ref('');
const lastFetchedAt = ref(null);
const isRefreshing = ref(false);

const organizationId = computed(() => store.state.user.organizationId);
const plans = computed(() => store.getters.plans || []);

// Plan section
function getPlanData(planName) {
  if (!planName) return null;
  return plans.value.find(p => p.name === planName);
}

const orgPlanLabel = computed(() => {
  if (!organization.value?.plan) return 'Free Plan';
  const plan = getPlanData(organization.value.plan);
  return plan?.display_name || organization.value.plan;
});

const orgPlanBenefits = computed(() => {
  const plan = getPlanData(organization.value?.plan);
  return plan?.benefits || [`$1 of usage per day`];
});

// Budget multiplier relative to the $1/day base
const budgetMultiplier = computed(() => {
  if (dailyBudgetUsd.value <= 0) return 1;
  return dailyBudgetUsd.value;
});

const searchesEstimate = computed(() => Math.round(1000 * budgetMultiplier.value));
const filterSetsEstimate = computed(() => Math.round(10000 * budgetMultiplier.value));

const pdfDownloadsEstimate = computed(() => Math.round(100 * budgetMultiplier.value));

function formatNumber(n) {
  return n.toLocaleString();
}

// Timer for "last checked" relative time
const now = ref(Date.now());
const nowTimer = setInterval(() => { now.value = Date.now(); }, 10000);
onUnmounted(() => { clearInterval(nowTimer); });

const lastCheckedText = computed(() => {
  if (!lastFetchedAt.value) return '';
  const diffSec = Math.floor((now.value - lastFetchedAt.value) / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin} min ago`;
});

// Usage computed properties
const dailyBudgetUsd = computed(() => {
  if (orgRateLimitData.value?.daily_budget_usd != null) {
    return orgRateLimitData.value.daily_budget_usd;
  }
  // Fallback: derive from org plan
  if (organization.value?.plan) {
    const plan = plans.value.find(p => p.name === organization.value.plan);
    if (plan?.api_max_per_day) {
      return creditsToUsd(plan.api_max_per_day);
    }
  }
  return 0;
});

const dailyUsedUsd = computed(() => orgRateLimitData.value?.daily_used_usd ?? 0);

const dailyRemainingUsd = computed(() => Math.max(0, dailyBudgetUsd.value - dailyUsedUsd.value));

const dailyPctRemaining = computed(() => {
  if (dailyBudgetUsd.value <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(((dailyBudgetUsd.value - dailyUsedUsd.value) / dailyBudgetUsd.value) * 100)));
});

const dailyBudgetSummary = computed(() => {
  return `${formatUsd(dailyRemainingUsd.value)} remaining (${dailyPctRemaining.value}%) of your ${formatUsd(dailyBudgetUsd.value, 2)} daily budget`;
});

const resetDescription = computed(() => {
  const n = new Date();
  const midnightUTC = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1));
  const diffMs = midnightUTC - n;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `Your daily budget resets in ${hours} hr ${minutes} min.`;
});

// Fetch org usage from rate-limit endpoint using org API keys
async function fetchOrgUsage() {
  const keys = organization.value?.api_keys;
  if (!keys || keys.length === 0) {
    usageError.value = 'No API keys found for this organization.';
    return;
  }

  usageError.value = '';

  try {
    const requests = keys.map(key =>
      axios.get(`${urlBase.api}/rate-limit`, {
        headers: { Authorization: `Bearer ${key}` },
      })
    );
    const responses = await Promise.all(requests);

    // Aggregate: sum daily_used_usd across keys, take daily_budget_usd from first
    let totalUsed = 0;
    let budget = null;
    for (const res of responses) {
      const data = res.data;
      totalUsed += data.daily_used_usd ?? 0;
      if (budget == null && data.daily_budget_usd != null) {
        budget = data.daily_budget_usd;
      }
    }

    orgRateLimitData.value = {
      daily_used_usd: totalUsed,
      daily_budget_usd: budget,
    };
    lastFetchedAt.value = Date.now();
    now.value = Date.now();
  } catch (e) {
    usageError.value = 'Failed to load usage data.';
  }
}

async function refreshUsage() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await fetchOrgUsage();
  } finally {
    isRefreshing.value = false;
  }
}

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
    fetchOrgUsage();
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

<style scoped>
.usage-section {
  margin-top: 48px;
  margin-bottom: 32px;
}

.usage-section-header {
  font-size: 16px;
  font-weight: 500;
  color: #1A1A1A;
  margin-bottom: 12px;
}

.refresh-link {
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.refresh-link:hover {
  color: #1A1A1A;
}
</style>
