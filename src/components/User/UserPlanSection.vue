<template>
  <SettingsSection title="Plan">
    <!-- Plan -->
    <SettingsRow
      label="Plan"
      description="User's subscription plan"
    >
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
    </SettingsRow>

    <!-- Benefits -->
    <SettingsRow
      v-if="planBenefits.length"
      label="Benefits"
      description="Features included with the user's plan"
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
  </SettingsSection>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

import { Check } from 'lucide-vue-next';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['updated']);

const store = useStore();

const saving = ref(false);
const selectedPlan = ref(null);

const plans = computed(() => store.getters.plans || []);

const planItems = computed(() => {
  const allPlans = plans.value;
  const filtered = allPlans.filter(p => p.for && p.for.includes('user'));
  return filtered.map(p => ({
    title: p.display_name,
    value: p.name
  }));
});

const planItemsWithNone = computed(() => [
  { title: 'No plan', value: null },
  ...planItems.value
]);

const planBenefits = computed(() => {
  if (!props.user?.plan) return [];
  const plan = plans.value.find(p => p.name === props.user.plan);
  return plan?.benefits || [];
});

// Sync selectedPlan with user data
watch(() => props.user?.plan, (newVal) => {
  selectedPlan.value = newVal || null;
}, { immediate: true });

async function onPlanChange(newPlan) {
  if (newPlan === props.user?.plan) return;
  
  saving.value = true;
  try {
    await axios.patch(
      `${urlBase.userApi}/admin/users/${props.user.id}`,
      { plan: newPlan },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', newPlan ? 'Plan updated' : 'Plan removed');
    emit('updated');
  } catch (e) {
    console.error('Failed to update plan:', e);
    store.commit('snackbar', 'Failed to update plan');
    selectedPlan.value = props.user?.plan || null;
  } finally {
    saving.value = false;
  }
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
</style>
