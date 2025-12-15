<template>
  <SettingsSection title="Plan">
    <!-- Current Plan -->
    <SettingsRow
      :label="planDisplayName"
      description="Organization's subscription to OpenAlex"
    >
      <template v-if="isAdmin">
        <div class="flex items-center gap-2">
          <Select v-model="selectedPlan" :disabled="saving" @update:model-value="onPlanChange">
            <SelectTrigger class="w-[180px]">
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="plan in planItemsWithNone" :key="plan.value" :value="plan.value">
                {{ plan.title }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </template>
      <template v-else>
        <Button variant="outline" size="sm" @click="showChangePlanDialog = true">
          Change Plan
        </Button>
      </template>
    </SettingsRow>

    <!-- Benefits -->
    <SettingsRow
      v-if="planBenefits.length"
      label="Benefits"
      description="Features included with the organization's plan"
      :fullWidth="true"
    >
      <template #default>
        <ul class="space-y-1">
          <li v-for="(benefit, idx) in planBenefits" :key="idx" class="flex items-start">
            <Check class="h-4 w-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
            <span class="text-sm">{{ benefit }}</span>
          </li>
        </ul>
      </template>
    </SettingsRow>

    <!-- Member Benefits -->
    <SettingsRow
      v-if="planMemberBenefits.length"
      label="Member Benefits"
      description="Features available to members of the organization"
      :fullWidth="true"
    >
      <template #default>
        <ul class="space-y-1">
          <li v-for="(benefit, idx) in planMemberBenefits" :key="idx" class="flex items-start">
            <Check class="h-4 w-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
            <span class="text-sm">{{ benefit }}</span>
          </li>
        </ul>
      </template>
    </SettingsRow>

    <!-- Plan Expiration Date -->
    <SettingsRow
      label="Plan expiration date"
      description="When the current plan subscription ends"
    >
      <template v-if="isAdmin && organization.plan">
        <Input
          v-model="editableExpiration"
          type="date"
          class="w-[200px]"
          @blur="saveExpiration"
          @keydown.enter="$event.target.blur()"
        />
      </template>
      <template v-else>
        <Tooltip v-if="organization.plan_expires_at">
          <TooltipTrigger>
            <span>{{ formatDate(organization.plan_expires_at) }}</span>
          </TooltipTrigger>
          <TooltipContent>{{ formatDateTime(organization.plan_expires_at) }}</TooltipContent>
        </Tooltip>
        <span v-else class="text-muted-foreground">—</span>
      </template>
    </SettingsRow>
  </SettingsSection>

  <!-- Change Plan Dialog (for non-admins) -->
  <Dialog v-model:open="showChangePlanDialog">
    <DialogContent class="max-w-[400px]">
      <DialogHeader>
        <DialogTitle>Change plan</DialogTitle>
      </DialogHeader>
      <div class="py-4">
        To change your organization's plan, please contact support.
      </div>
      <DialogFooter>
        <Button variant="ghost" @click="showChangePlanDialog = false">Cancel</Button>
        <Button as="a" href="https://help.openalex.org/hc/en-us/requests/new" target="_blank" @click="showChangePlanDialog = false">
          Contact Support
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

import { Check } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

const props = defineProps({
  organization: {
    type: Object,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['updated']);

const store = useStore();

const showChangePlanDialog = ref(false);
const saving = ref(false);
const selectedPlan = ref(null);
const editableExpiration = ref('');

const plans = computed(() => store.getters.plans || []);

const planItems = computed(() => {
  const allPlans = plans.value;
  const filtered = allPlans.filter(p => p.for && p.for.includes('organization'));
  return filtered.map(p => ({
    title: p.display_name,
    value: p.name
  }));
});

const planItemsWithNone = computed(() => [
  { title: 'No plan', value: null },
  ...planItems.value
]);

const planDisplayName = computed(() => {
  if (!props.organization?.plan) return 'No plan';
  const plan = plans.value.find(p => p.name === props.organization.plan);
  return plan?.display_name || props.organization.plan;
});

const planBenefits = computed(() => {
  if (!props.organization?.plan) return [];
  const plan = plans.value.find(p => p.name === props.organization.plan);
  return plan?.benefits || [];
});

const planMemberBenefits = computed(() => {
  if (!props.organization?.plan) return [];
  const plan = plans.value.find(p => p.name === props.organization.plan);
  return plan?.member_benefits || [];
});

watch(() => props.organization?.plan, (newVal) => {
  selectedPlan.value = newVal || null;
}, { immediate: true });

watch(() => props.organization?.plan_expires_at, (newVal) => {
  if (newVal) {
    const date = parseUTCDate(newVal);
    editableExpiration.value = date.toISOString().split('T')[0];
  } else {
    editableExpiration.value = '';
  }
}, { immediate: true });

async function onPlanChange(newPlan) {
  // Don't save if it's the same value
  if (newPlan === props.organization?.plan) return;
  
  saving.value = true;
  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${props.organization.id}`,
      { plan: newPlan },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', newPlan ? 'Plan updated' : 'Plan removed');
    emit('updated');
  } catch (e) {
    console.error('Failed to update plan:', e);
    store.commit('snackbar', 'Failed to update plan');
    // Revert selection on error
    selectedPlan.value = props.organization?.plan || null;
  } finally {
    saving.value = false;
  }
}

async function saveExpiration() {
  const newValue = editableExpiration.value || null;
  const currentValue = props.organization?.plan_expires_at 
    ? parseUTCDate(props.organization.plan_expires_at).toISOString().split('T')[0]
    : null;
  
  if (newValue === currentValue) return;

  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${props.organization.id}`,
      { plan_expires_at: newValue },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', 'Expiration date updated');
    emit('updated');
  } catch (e) {
    console.error('Failed to update expiration:', e);
    store.commit('snackbar', 'Failed to update expiration date');
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

.settings-text-input {
  font-size: 14px;
  padding: 0 12px;
  height: 32px;
  border: 1px solid #E5E5E5;
  border-radius: 6px;
  background: #FFFFFF;
  color: #1A1A1A;
  min-width: 200px;
  outline: none;
  transition: border-color 0.15s;
}

.settings-text-input:hover {
  border-color: #D0D0D0;
}

.settings-text-input:focus {
  border-color: #1A1A1A;
}

.settings-action {
  text-transform: none;
  font-weight: 500;
  padding: 0 8px;
  min-width: auto;
  height: auto;
}
</style>
