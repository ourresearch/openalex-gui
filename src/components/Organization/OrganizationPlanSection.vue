<template>
  <SettingsSection title="Plan">
    <!-- Current Plan -->
    <SettingsRow
      :label="planDisplayName"
      description="Organization's subscription to OpenAlex"
    >
      <template v-if="isAdmin">
        <div class="d-flex align-center ga-2">
          <v-select
            v-model="selectedPlan"
            :items="planItemsWithNone"
            :loading="saving"
            :disabled="saving"
            density="compact"
            variant="outlined"
            hide-details
            style="min-width: 180px;"
            @update:model-value="onPlanChange"
          />
        </div>
      </template>
      <template v-else>
        <v-btn
          variant="outlined"
          size="small"
          @click="showChangePlanDialog = true"
        >
          Change Plan
        </v-btn>
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
      description="Features available to members of the organization"
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
      description="When the current plan subscription ends"
    >
      <template v-if="isAdmin && organization.plan">
        <input
          v-model="editableExpiration"
          type="date"
          class="settings-text-input"
          @blur="saveExpiration"
          @keydown.enter="$event.target.blur()"
        />
      </template>
      <template v-else>
        <span v-if="organization.plan_expires_at" class="settings-value">
          <v-tooltip :text="formatDateTime(organization.plan_expires_at)" location="top">
            <template #activator="{ props }">
              <span v-bind="props">{{ formatDate(organization.plan_expires_at) }}</span>
            </template>
          </v-tooltip>
        </span>
        <span v-else class="text-medium-emphasis">—</span>
      </template>
    </SettingsRow>
  </SettingsSection>

  <!-- Change Plan Dialog (for non-admins) -->
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
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
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
