<template>
  <div>
    <div class="text-h5 mb-4">API</div>
    <div class="text-body-1 mb-4">
      Your API key gives you higher rate limits when using the
      <a href="https://docs.openalex.org" target="_blank" rel="noopener">OpenAlex API.</a>
    </div>
    
    <v-card flat variant="outlined" class="bg-white">
      <v-card-text>
        <div class="text-subtitle-2 text-grey mb-2">Your API Key</div>
        <ApiKeyDisplay :api-key="apiKey" />
        <div v-if="!apiKey" class="text-body-2 text-grey-darken-1 mt-2">
          No API key available. Please contact support if you need one.
        </div>
        <v-divider class="my-4" />
        
        <div class="mt-6">
          <div class="text-subtitle-2 text-grey mb-2">API Key Limit</div>
          <div class="text-body-1 font-weight-medium">{{ formattedApiLimit }} requests per day</div>
          <div class="text-caption text-medium-emphasis mt-1">
            This is determined by your <router-link to="/me/plan">plan</router-link>.
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import ApiKeyDisplay from '@/components/ApiKeyDisplay.vue';

defineOptions({ name: 'MeApi' });

useHead({ title: 'API' });

const store = useStore();
const apiKey = computed(() => store.state.user.apiKey);
const userPlan = computed(() => store.state.user.plan);
const organizationPlan = computed(() => store.state.user.organizationPlan);
const plans = computed(() => store.getters.plans || []);
const defaultApiMaxPerDay = computed(() => store.state.defaultApiMaxPerDay);

const apiLimit = computed(() => {
  // Check user's own plan first
  if (userPlan.value) {
    const plan = plans.value.find(p => p.name === userPlan.value);
    if (plan?.api_max_per_day) return plan.api_max_per_day;
  }
  
  // Check organization plan (use member_api_max_per_day if available)
  if (organizationPlan.value) {
    const plan = plans.value.find(p => p.name === organizationPlan.value);
    if (plan?.member_api_max_per_day) return plan.member_api_max_per_day;
    if (plan?.api_max_per_day) return plan.api_max_per_day;
  }
  
  // Fall back to default
  return defaultApiMaxPerDay.value;
});

const formattedApiLimit = computed(() => {
  return apiLimit.value?.toLocaleString() || apiLimit.value;
});
</script>

<style scoped>
</style>
