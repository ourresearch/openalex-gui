<template>
  <SettingsSection title="Plan">
    <!-- Plan -->
    <SettingsRow
      label="Plan"
      description="User's subscription plan"
    >
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
    </SettingsRow>

    <!-- Benefits -->
    <SettingsRow
      v-if="planBenefits.length"
      label="Benefits"
      description="Features included with the user's plan"
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
  </SettingsSection>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
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
