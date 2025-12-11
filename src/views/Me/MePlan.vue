<template>
  <div>
    <div class="text-h5 mb-4">Plan</div>
    
    <v-row>
      <v-col cols="12" :lg="hasOrganization && organizationPlan ? 6 : 12">
        <v-card flat variant="outlined" class="bg-white h-100">
          <v-card-text>
            <div class="d-flex align-center text-subtitle-2 text-grey mb-2">
              <v-icon size="small" class="mr-2">mdi-account-outline</v-icon>
              Your Plan
            </div>
            <div class="text-body-1 font-weight-medium">{{ userPlanDisplayName }}</div>
            
            <div v-if="userPlanBenefits.length" class="mt-3">
              <div class="text-subtitle-2 text-grey mb-2">Benefits</div>
              <ul class="benefits-list">
                <li v-for="benefit in userPlanBenefits" :key="benefit">{{ benefit }}</li>
              </ul>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col v-if="hasOrganization && organizationPlan" cols="12" lg="6">
        <v-card flat variant="outlined" class="bg-white h-100">
          <v-card-text>
            <div class="d-flex align-center text-subtitle-2 text-grey mb-2">
              <v-icon size="small" class="mr-2">mdi-domain</v-icon>
              Organization Plan
            </div>
            <div class="text-body-1 font-weight-medium">{{ orgPlanDisplayName }}</div>
            
            <div class="text-body-2 text-medium-emphasis mt-2">
              As {{ roleDescription }} of {{ organizationName }}, you benefit from your organization's plan.
            </div>
            
            <div v-if="orgPlanBenefits.length" class="mt-3">
              <div class="text-subtitle-2 text-grey mb-2">Benefits</div>
              <ul class="benefits-list">
                <li v-for="benefit in orgPlanBenefits" :key="benefit">{{ benefit }}</li>
              </ul>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

defineOptions({ name: 'MePlan' });

useHead({ title: 'Plan' });

const store = useStore();

const userPlan = computed(() => store.state.user.plan);
const organizationId = computed(() => store.state.user.organizationId);
const organizationName = computed(() => store.state.user.organizationName);
const organizationRole = computed(() => store.state.user.organizationRole);
const organizationPlan = computed(() => store.state.user.organizationPlan);
const plans = computed(() => store.getters.plans || []);
const defaultApiMaxPerDay = computed(() => store.state.defaultApiMaxPerDay);

const hasOrganization = computed(() => !!organizationId.value);

const roleDescription = computed(() => {
  if (!organizationRole.value) return 'a member';
  if (organizationRole.value === 'owner') return 'an owner';
  return `a ${organizationRole.value}`;
});

function getPlanDisplayName(planName) {
  if (!planName) return 'Default';
  const plan = plans.value.find(p => p.name === planName);
  return plan?.display_name || planName;
}

function getPlanData(planName) {
  if (!planName) return null;
  return plans.value.find(p => p.name === planName);
}

function formatNumber(num) {
  return num?.toLocaleString() || num;
}

const userPlanDisplayName = computed(() => getPlanDisplayName(userPlan.value));
const orgPlanDisplayName = computed(() => getPlanDisplayName(organizationPlan.value));

const userPlanBenefits = computed(() => {
  const planData = getPlanData(userPlan.value);
  if (planData?.benefits) {
    return planData.benefits;
  }
  // Default plan benefits
  return [`${formatNumber(defaultApiMaxPerDay.value)} API requests per day`];
});

const orgPlanBenefits = computed(() => {
  const planData = getPlanData(organizationPlan.value);
  // For institutional plans, use member_benefits if available
  if (planData?.member_benefits) {
    return planData.member_benefits;
  }
  return planData?.benefits || [];
});
</script>

<style scoped>
.benefits-list {
  margin: 0;
  padding-left: 20px;
}

.benefits-list li {
  margin-bottom: 4px;
}
</style>
