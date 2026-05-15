<template>
  <div class="slot-usage">
    <div v-if="loading" class="text-caption text-medium-emphasis">Loading usage…</div>
    <template v-else-if="available">
      <div class="d-flex justify-space-between text-caption mb-1">
        <span>{{ formatUsd(usedUsd) }} used today</span>
        <span class="text-medium-emphasis">of {{ formatUsd(budgetUsd, 2) }}</span>
      </div>
      <v-progress-linear
        :model-value="pct"
        :color="pct >= 90 ? 'error' : pct >= 70 ? 'warning' : 'primary'"
        height="6"
        rounded
      />
    </template>
    <div v-else class="text-caption text-medium-emphasis font-italic">
      Usage unavailable
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { formatUsd } from '@/store';

const props = defineProps({
  organizationId: { type: String, required: true },
  slotIndex: { type: Number, required: true },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(true);
const available = ref(false);
const usedUsd = ref(0);
const budgetUsd = ref(25);

async function fetchUsage() {
  loading.value = true;
  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${props.organizationId}/high-volume-slots/${props.slotIndex}/usage`,
      axiosConfig({ userAuth: true })
    );
    if (res.data?.available) {
      available.value = true;
      usedUsd.value = res.data.daily_used_usd ?? 0;
      if (res.data.daily_budget_usd != null) {
        budgetUsd.value = res.data.daily_budget_usd;
      }
    } else {
      available.value = false;
    }
  } catch {
    available.value = false;
  } finally {
    loading.value = false;
  }
}

const pct = ref(0);
watch([usedUsd, budgetUsd], () => {
  pct.value = budgetUsd.value > 0
    ? Math.min(100, Math.round((usedUsd.value / budgetUsd.value) * 100))
    : 0;
});

watch(() => props.refreshToken, () => { fetchUsage(); });
watch(() => [props.organizationId, props.slotIndex], () => { fetchUsage(); });

onMounted(fetchUsage);
</script>

<style scoped>
.slot-usage { min-width: 180px; }
</style>
