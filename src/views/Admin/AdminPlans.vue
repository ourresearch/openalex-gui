<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 font-weight-bold">Plans</h1>
    </div>

    <!-- Error alert -->
    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Plans grid -->
    <div v-else class="plans-grid">
      <v-card
        v-for="plan in plans"
        :key="plan.name"
        variant="outlined"
        rounded="lg"
        class="plan-card"
      >
        <v-card-title class="text-h6">{{ plan.display_name }}</v-card-title>
        <v-card-text>
          <div class="d-flex flex-column ga-2">
            <div class="d-flex justify-space-between">
              <span class="text-medium-emphasis">Internal name</span>
              <span class="font-weight-medium">{{ plan.name }}</span>
            </div>
            <div v-if="plan.daily_requests !== undefined" class="d-flex justify-space-between">
              <span class="text-medium-emphasis">Daily requests</span>
              <span class="font-weight-medium">{{ formatNumber(plan.daily_requests) }}</span>
            </div>
            <div v-if="plan.monthly_requests !== undefined" class="d-flex justify-space-between">
              <span class="text-medium-emphasis">Monthly requests</span>
              <span class="font-weight-medium">{{ formatNumber(plan.monthly_requests) }}</span>
            </div>
            <div v-if="plan.price !== undefined" class="d-flex justify-space-between">
              <span class="text-medium-emphasis">Price</span>
              <span class="font-weight-medium">{{ formatPrice(plan.price) }}</span>
            </div>
            <div v-if="plan.user_count !== undefined" class="d-flex justify-space-between">
              <span class="text-medium-emphasis">Users</span>
              <span class="font-weight-medium">{{ plan.user_count }}</span>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && plans.length === 0" class="text-center text-medium-emphasis py-8">
      No plans found.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminPlans' });

const plans = ref([]);
const loading = ref(false);
const error = ref('');

async function fetchPlans() {
  loading.value = true;
  error.value = '';

  try {
    const res = await axios.get(
      `${urlBase.userApi}/plans`,
      axiosConfig({ userAuth: true })
    );
    plans.value = res.data.results || [];
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to fetch plans.';
    plans.value = [];
  } finally {
    loading.value = false;
  }
}

function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  if (num === -1 || num === Infinity) return 'Unlimited';
  return num.toLocaleString();
}

function formatPrice(price) {
  if (price === null || price === undefined) return '—';
  if (price === 0) return 'Free';
  return `$${price.toLocaleString()}`;
}

onMounted(() => {
  fetchPlans();
});
</script>

<style scoped lang="scss">
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.plan-card {
  background-color: white;
}
</style>
