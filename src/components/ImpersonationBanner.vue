<template>
  <div v-if="isImpersonating" class="impersonation-banner">
    <v-icon size="small" class="mr-2">mdi-account-switch</v-icon>
    <span>
      Viewing as <strong>{{ impersonatingUserName || impersonatingUserId }}</strong>
    </span>
    <v-btn
      size="small"
      variant="text"
      class="ml-3 stop-btn"
      @click="stopImpersonation"
    >
      Stop impersonating
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'ImpersonationBanner' });

const store = useStore();

const isImpersonating = computed(() => store.getters['user/isImpersonating']);
const impersonatingUserId = computed(() => store.getters['user/impersonatingUserId']);
const impersonatingUserName = computed(() => store.getters['user/impersonatingUserName']);

function stopImpersonation() {
  store.dispatch('user/stopImpersonation');
}
</script>

<style scoped>
.impersonation-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  background-color: #1a1a1a;
  color: #ffffff;
  padding: 4px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.stop-btn {
  color: #ffffff !important;
  font-weight: 500 !important;
  opacity: 0.8;
}

.stop-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  opacity: 1;
}
</style>
