<template>
  <div>
    <h1 class="text-xl font-bold mb-6">Plan</h1>
    <SettingsSection title="Your Plan">
      <SettingsRow
        :label="userPlanDisplayName"
        :description="userPlanBenefits.length ? userPlanBenefits.join(' · ') : 'Basic access to OpenAlex'"
      >
        <Button
          variant="outline"
          size="sm"
          @click="showChangePlanDialog = true"
        >
          Change Plan
        </Button>
      </SettingsRow>

      <SettingsRow
        label="Plan expiration date"
        description="When your current plan subscription ends"
      >
        <span v-if="userPlanExpiresAt">
          <Tooltip>
            <TooltipTrigger>
              <span>{{ formatDate(userPlanExpiresAt) }}</span>
            </TooltipTrigger>
            <TooltipContent>{{ formatDateTime(userPlanExpiresAt) }}</TooltipContent>
          </Tooltip>
        </span>
        <span v-else class="text-muted-foreground">—</span>
      </SettingsRow>
    </SettingsSection>

    <SettingsSection v-if="hasOrganization && organizationPlan" title="Organization Plan">
      <SettingsRow
        label="Plan"
        :description="`As ${roleDescription} of ${organizationName}, you benefit from your organization's plan`"
      >
        <span>{{ orgPlanDisplayName }}</span>
      </SettingsRow>

      <SettingsRow
        v-if="orgPlanBenefits.length"
        label="Benefits"
        description="Additional features from your organization's plan"
      >
        <span class="text-sm">{{ orgPlanBenefits.join(' · ') }}</span>
      </SettingsRow>
    </SettingsSection>

    <!-- Change Plan Dialog -->
    <Dialog v-model:open="showChangePlanDialog">
      <DialogContent class="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Change plan</DialogTitle>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">
          To change your plan, please contact support.
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            @click="showChangePlanDialog = false"
          >
            Cancel
          </Button>
          <Button
            asChild
            @click="showChangePlanDialog = false"
          >
            <a href="https://help.openalex.org/hc/en-us/requests/new" target="_blank">
              Contact Support
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

defineOptions({ name: 'MePlan' });

const showChangePlanDialog = ref(false);

useHead({ title: 'Plan' });

const store = useStore();

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
