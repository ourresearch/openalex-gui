<template>
  <div v-if="showBanner" class="expert-mode-banner">
    <v-icon size="small" class="mr-2">mdi-wrench</v-icon>
    <span>Expert Mode</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'ExpertModeBanner' });

const store = useStore();

const noviceMode = computed(() => store.getters.featureFlags.noviceMode);
const expertMode = computed(() => store.state.user.expertMode);
const isImpersonating = computed(() => store.getters['user/isImpersonating']);
const showBanner = computed(() => noviceMode.value && expertMode.value && !isImpersonating.value);
</script>

<style scoped>
.expert-mode-banner {
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
</style>
