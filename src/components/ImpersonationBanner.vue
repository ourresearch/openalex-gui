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
  background-color: #FEF3C7;
  border-bottom: 1px solid #F59E0B;
  color: #92400E;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
}

.stop-btn {
  color: #92400E !important;
  font-weight: 600 !important;
}

.stop-btn:hover {
  background-color: rgba(245, 158, 11, 0.2) !important;
}
</style>
