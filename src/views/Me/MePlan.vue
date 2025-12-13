<template>
  <div>
    <SettingsSection title="Your Plan">
      <SettingsRow
        label="Current plan"
        :description="userPlanBenefits.length ? userPlanBenefits.join(' · ') : 'Basic access to OpenAlex'"
      >
        <span class="settings-value">{{ userPlanDisplayName }}</span>
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
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

defineOptions({ name: 'MePlan' });

useHead({ title: 'Plan' });

const store = useStore();

const userPlan = computed(() => store.state.user.plan);
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

const userPlanDisplayName = computed(() => getPlanDisplayName(userPlan.value));
const orgPlanDisplayName = computed(() => getPlanDisplayName(organizationPlan.value));

const userPlanBenefits = computed(() => {
  const planData = getPlanData(userPlan.value);
  if (planData?.benefits) {
    return planData.benefits;
  }
  // Default plan benefits
  return [`${formatNumber(defaultApiMaxPerDay.value)} API requests per day`];
});

const orgPlanBenefits = computed(() => {
  const planData = getPlanData(organizationPlan.value);
  // For institutional plans, use member_benefits if available
  if (planData?.member_benefits) {
    return planData.member_benefits;
  }
  return planData?.benefits || [];
});
</script>

<style scoped>
</style>
