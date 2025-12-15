<template>
  <div>
    <h1 class="text-xl font-bold mb-6">API</h1>
    <UserApiSection :user="currentUser" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import UserApiSection from '@/components/User/UserApiSection.vue';

defineOptions({ name: 'MeApi' });

useHead({ title: 'API' });

const store = useStore();

const currentUser = computed(() => ({
  api_key: store.state.user.apiKey,
  plan: store.state.user.plan,
  organization_plan: store.state.user.organizationPlan
}));
</script>

<style scoped>
/* Minimal scoped styles */
</style>
