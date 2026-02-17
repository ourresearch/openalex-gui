<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-6">Usage</h1>

    <!-- Daily Credits -->
    <CreditProgressBar
      :used="dailyUsed"
      :total="apiLimit"
      label="Daily Credits"
      :sublabel="dailySublabel"
      footer-text="Resets at midnight UTC"
      link-text="Upgrade plan"
      link-to="/pricing"
      class="mb-4"
    >
      <template #header-prefix>
        <PlanChip :plan-name="effectivePlan" />
      </template>
    </CreditProgressBar>

    <!-- One-time Credits -->
    <CreditProgressBar
      v-if="hasPurchasedCredits"
      :used="purchasedUsed"
      :total="purchasedTotal"
      label="One-time Credits"
      :sublabel="purchasedSublabel"
      :footer-text="purchasedFooter"
      link-text="Buy more credits"
      link-to="/pricing"
    />
    <CreditProgressBar
      v-else
      :placeholder="true"
      label="One-time Credits"
      placeholder-text="Purchase one-time credits for use beyond your daily allowance"
      link-text="Buy credits"
      link-to="/pricing"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import CreditProgressBar from '@/components/Credits/CreditProgressBar.vue';
import PlanChip from '@/components/PlanChip.vue';

defineOptions({ name: 'MeUsage' });

useHead({ title: 'Usage' });

const store = useStore();

const rateLimitData = computed(() => store.state.rateLimitData);
const userPlan = computed(() => store.state.user.plan);
const organizationPlan = computed(() => store.state.user.organizationPlan);
const plans = computed(() => store.getters.plans || []);
const defaultApiMaxPerDay = computed(() => store.state.defaultApiMaxPerDay);

const effectivePlan = computed(() => userPlan.value || organizationPlan.value || null);

// API limit computation (same logic as MePlan / UserApiSection)
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

const dailySublabel = computed(() => {
  return `${apiLimit.value?.toLocaleString()} credits/day`;
});

// Daily credits
const dailyUsed = computed(() => rateLimitData.value?.credits_used ?? 0);

// Purchased credits
const hasPurchasedCredits = computed(() => (rateLimitData.value?.onetime_credits_balance ?? 0) > 0);
const purchasedTotal = computed(() => rateLimitData.value?.onetime_credits_balance ?? 0);
const purchasedUsed = computed(() => purchasedTotal.value - (rateLimitData.value?.onetime_credits_remaining ?? 0));

const purchasedSublabel = computed(() => {
  return `${purchasedTotal.value.toLocaleString()} credits purchased`;
});

const purchasedFooter = computed(() => {
  if (rateLimitData.value?.onetime_credits_expires_at) {
    const date = new Date(rateLimitData.value.onetime_credits_expires_at);
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `Expires ${formatted}`;
  }
  return '';
});
</script>
