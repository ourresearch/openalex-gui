<template>
  <div v-if="showBanner" class="verify-email-banner" :style="{ top: bannerTop }">
    <v-icon size="small" class="mr-2">mdi-email-alert-outline</v-icon>
    <span>
      Please verify <strong>{{ unverifiedPrimary.email }}</strong> to start using the API. Check your inbox for the verification link.
    </span>
    <v-btn
      size="small"
      variant="text"
      class="ml-3 resend-btn"
      :loading="resending"
      @click="resend"
    >
      Resend
    </v-btn>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'VerifyEmailBanner' });

const store = useStore();
const resending = ref(false);

const unverifiedPrimary = computed(() => {
  const emails = store.state.user?.emails || [];
  return emails.find((e) => e.is_primary && !e.verified_at) || null;
});

const showBanner = computed(() => !!store.state.user?.id && !!unverifiedPrimary.value);

// Stack below ImpersonationBanner (28px) and ThrottleBanner (28px) if shown.
const isImpersonating = computed(() => store.getters['user/isImpersonating']);
const isRateThrottled = computed(
  () => !!store.state.user?.rateThrottled || !!store.state.user?.orgRateThrottled
);
const bannerTop = computed(() => {
  const offsets = (isImpersonating.value ? 28 : 0) + (isRateThrottled.value ? 28 : 0);
  return `${offsets}px`;
});

async function resend() {
  if (resending.value || !unverifiedPrimary.value) return;
  resending.value = true;
  try {
    await store.dispatch('user/resendVerification', unverifiedPrimary.value.id);
    store.commit('snackbar', `Verification email resent to ${unverifiedPrimary.value.email}`);
  } catch (e) {
    store.commit('snackbar', 'Failed to resend verification email');
  } finally {
    resending.value = false;
  }
}
</script>

<style scoped>
.verify-email-banner {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 10000;
  background-color: #b45309;
  color: #ffffff;
  padding: 4px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.resend-btn {
  color: #ffffff !important;
  font-weight: 500 !important;
  opacity: 0.9;
}

.resend-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  opacity: 1;
}
</style>
