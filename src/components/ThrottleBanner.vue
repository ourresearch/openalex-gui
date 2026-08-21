<template>
  <div v-if="isThrottled" class="throttle-banner">
    <v-icon size="small" class="mr-2">mdi-alert-circle</v-icon>
    <span>{{ message }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'ThrottleBanner' });

const store = useStore();

const isThrottled = computed(() =>
  !!store.state.user.rateThrottled || !!store.state.user.orgRateThrottled
);
const message = "Your access is temporarily throttled while we investigate unsustainable usage patterns. Please contact support@openalex.org for details.";
</script>

<style scoped>
.throttle-banner {
  /* In-flow (oxjob #853): pushes the bar + page down, scrolls away with them. */
  background-color: #b91c1c;
  color: #ffffff;
  padding: 4px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}
</style>
