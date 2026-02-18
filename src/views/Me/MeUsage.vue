<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-6">Usage</h1>

    <!-- Daily Credits -->
    <CreditProgressBar
      :used="dailyUsed"
      :total="apiLimit"
      label="Plan usage limits"
      headline="Current session"
      :subtitle="resetSubtitle"
      class="mb-4"
    />

    <!-- One-time Credits -->
    <CreditProgressBar
      v-if="hasPurchasedCredits"
      :used="purchasedUsed"
      :total="purchasedTotal"
      label="One-time credits"
      :headline="purchasedHeadline"
      :subtitle="purchasedSubtitle"
      link-text="Buy more credits"
      :link-button="true"
      @link-click="openPurchaseDialog"
    />
    <CreditProgressBar
      v-else
      :placeholder="true"
      label="One-time credits"
      placeholder-text="Purchase one-time credits for extra usage beyond your free daily credits."
      link-text="Buy credits"
      :link-button="true"
      @link-click="openPurchaseDialog"
    />

    <!-- Quantity Picker Dialog -->
    <v-dialog v-model="showQuantityDialog" max-width="420">
      <v-card class="pa-6" rounded="lg">
        <v-card-title class="text-h6 font-weight-bold pa-0 mb-2">Buy API Credits</v-card-title>
        <v-card-text class="pa-0">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Each pack includes 10,000 credits. Purchased credits expire 3 months after your most recent purchase.
          </p>

          <v-text-field
            v-model.number="creditPacks"
            type="number"
            label="Number of packs"
            :min="1"
            variant="outlined"
            density="compact"
            hide-details="auto"
            class="mb-3"
          />

          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span class="text-medium-emphasis">Credits</span>
            <span class="font-weight-medium">{{ (creditPacks * 10000).toLocaleString() }}</span>
          </div>
          <div class="d-flex justify-space-between text-body-2 mb-4">
            <span class="text-medium-emphasis">Total</span>
            <span class="font-weight-bold">${{ creditPacks }}.00</span>
          </div>

          <v-alert v-if="purchaseError" type="error" variant="tonal" density="compact" class="mb-3">
            {{ purchaseError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-0 pt-2">
          <v-spacer />
          <v-btn variant="text" @click="showQuantityDialog = false" :disabled="purchaseLoading">Cancel</v-btn>
          <v-btn
            color="black"
            variant="flat"
            @click="startCheckout"
            :loading="purchaseLoading"
            :disabled="!creditPacks || creditPacks < 1"
          >
            Continue to Checkout
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import CreditProgressBar from '@/components/Credits/CreditProgressBar.vue';

defineOptions({ name: 'MeUsage' });

useHead({ title: 'Usage' });

const store = useStore();

const rateLimitData = computed(() => store.state.rateLimitData);
const userPlan = computed(() => store.state.user.plan);
const organizationPlan = computed(() => store.state.user.organizationPlan);
const plans = computed(() => store.getters.plans || []);
const defaultApiMaxPerDay = computed(() => store.state.defaultApiMaxPerDay);

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

// Daily credits
const dailyUsed = computed(() => rateLimitData.value?.credits_used ?? 0);

const resetSubtitle = computed(() => {
  const now = new Date();
  const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const diffMs = midnightUTC - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `Resets in ${hours} hr ${minutes} min`;
});

// Purchased credits
const hasPurchasedCredits = computed(() => (rateLimitData.value?.onetime_credits_balance ?? 0) > 0);
const purchasedTotal = computed(() => rateLimitData.value?.onetime_credits_balance ?? 0);
const purchasedUsed = computed(() => purchasedTotal.value - (rateLimitData.value?.onetime_credits_remaining ?? 0));

const purchasedHeadline = computed(() => {
  return `${purchasedTotal.value.toLocaleString()} credits purchased`;
});

const purchasedSubtitle = computed(() => {
  if (rateLimitData.value?.onetime_credits_expires_at) {
    const now = new Date();
    const expires = new Date(rateLimitData.value.onetime_credits_expires_at);
    const diffDays = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60 * 24)));
    return `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
  return '';
});

// Purchase dialog
const showQuantityDialog = ref(false);
const creditPacks = ref(1);
const purchaseLoading = ref(false);
const purchaseError = ref('');

function openPurchaseDialog() {
  showQuantityDialog.value = true;
  creditPacks.value = 1;
  purchaseError.value = '';
}

async function startCheckout() {
  purchaseLoading.value = true;
  purchaseError.value = '';

  try {
    const resp = await axios.post(
      `${urlBase.userApi}/checkout/create-session`,
      { quantity: creditPacks.value },
      axiosConfig({ userAuth: true })
    );
    window.location.href = resp.data.checkout_url;
  } catch (e) {
    purchaseError.value = e.response?.data?.message || 'Failed to start checkout. Please try again.';
    purchaseLoading.value = false;
  }
}
</script>
