<template>
  <v-dialog
    v-model="isOpen"
    max-width="480"
    scroll-strategy="none"
  >
    <v-card class="bg-white pa-6" rounded="xl" elevation="8">
      <div class="text-h6 font-weight-bold mb-3">
        You've hit today's free limit
      </div>

      <div class="text-body-2 dialog-text mb-4">
        Every day, OpenAlex gives everyone 1,000 free credits to search and
        explore — no account needed. Looks like you've used yours for today.
      </div>

      <div class="text-body-2 dialog-text mb-4">
        The good news: creating a free account gets you <strong>$1 of credits
        every day</strong> — enough for about 1,000 searches, or downloading
        anywhere from 100K to 1M results. No credit card, just your email.
        Takes about 60 seconds.
      </div>

      <v-btn
        block
        size="large"
        color="primary"
        variant="flat"
        class="mt-2 mb-3 text-none"
        rounded="lg"
        @click="goToSignup"
      >
        Create a free account
      </v-btn>

      <div class="text-center">
        <v-btn
          variant="text"
          size="small"
          class="text-none text-medium-emphasis"
          @click="dismiss"
        >
          Maybe later
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineOptions({ name: 'CreditLimitDialog' });

import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();

const isOpen = computed({
  get: () => store.state.creditLimitDialogIsOpen,
  set: (val) => {
    if (!val) store.commit('closeCreditLimitDialog');
  },
});

function goToSignup() {
  store.commit('closeCreditLimitDialog');
  router.push({ name: 'Signup' });
}

function dismiss() {
  store.commit('closeCreditLimitDialog');
}
</script>

<style scoped>
.dialog-text {
  color: #4B5563;
  line-height: 1.6;
}
</style>
