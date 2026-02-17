<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-6">Organization Usage</h1>

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
      <!-- Daily Credits (org-level) -->
      <CreditProgressBar
        :placeholder="true"
        label="Organization Daily Credits"
        :sublabel="orgLimitSublabel"
        placeholder-text="Organization-level usage tracking coming soon."
        class="mb-4"
      >
        <template #header-prefix>
          <PlanChip v-if="organization.plan" :plan-name="organization.plan" />
        </template>
      </CreditProgressBar>
    </template>

    <!-- No organization -->
    <v-alert v-else type="info" variant="tonal">
      You are not part of an organization.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import CreditProgressBar from '@/components/Credits/CreditProgressBar.vue';
import PlanChip from '@/components/PlanChip.vue';

defineOptions({ name: 'SettingsOrgUsage' });

useHead({ title: 'Organization Usage' });

const store = useStore();

const organization = ref(null);
const loading = ref(true);
const error = ref('');

const organizationId = computed(() => store.state.user.organizationId);
const plans = computed(() => store.getters.plans || []);

const orgLimitSublabel = computed(() => {
  if (!organization.value?.plan) return '';
  const plan = plans.value.find(p => p.name === organization.value.plan);
  if (plan?.api_max_per_day) {
    return `${plan.api_max_per_day.toLocaleString()} credits/day per member`;
  }
  return '';
});

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
