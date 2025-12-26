<template>
  <div>
    <!-- Breadcrumbs -->
    <DashboardBreadcrumbs :items="breadcrumbItems" />
    
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px;">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>
    
    <div v-else-if="org">
      <!-- Organization header -->
      <div class="mb-6">
        <h1 class="text-h5 font-weight-semibold">{{ org.name || 'Unnamed Organization' }}</h1>
        <div v-if="org.domains && org.domains.length" class="text-body-2 text-medium-emphasis">
          {{ org.domains.join(', ') }}
        </div>
      </div>
      
      <!-- Profile Section -->
      <OrganizationProfileSection
        :organization="org"
        :can-edit="true"
        :admin-view="true"
        @updated="fetchOrganization"
      />

      <!-- Plan Section -->
      <OrganizationPlanSection
        :organization="org"
        :is-admin="true"
        @updated="fetchOrganization"
        class="mt-8"
      />

      <!-- API Section -->
      <OrganizationApiSection
        :organization="org"
        class="mt-8"
      />

      <!-- Danger Zone -->
      <div class="mt-8">
        <OrganizationDangerZoneSection
          :organization="org"
          redirect-to="/admin/organizations"
          @deleted="onDeleted"
        />
      </div>
    </div>
    
    <v-alert v-else-if="error" type="error" density="compact">{{ error }}</v-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import DashboardBreadcrumbs from '@/components/DashboardBreadcrumbs.vue';
import OrganizationProfileSection from '@/components/Organization/OrganizationProfileSection.vue';
import OrganizationPlanSection from '@/components/Organization/OrganizationPlanSection.vue';
import OrganizationApiSection from '@/components/Organization/OrganizationApiSection.vue';
import OrganizationDangerZoneSection from '@/components/Organization/OrganizationDangerZoneSection.vue';

defineOptions({ name: 'AdminOrganizationDetail' });

const route = useRoute();

const org = ref(null);

const breadcrumbItems = computed(() => [
  { text: 'Admin', to: '/admin/users' },
  { text: 'Organizations', to: '/admin/organizations' },
  { text: org.value?.name || 'Organization' }
]);
const loading = ref(false);
const error = ref('');

onMounted(() => {
  fetchOrganization();
});

async function fetchOrganization() {
  const orgId = route.params.orgId;
  if (!orgId) {
    error.value = 'No organization ID provided';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${orgId}`,
      axiosConfig({ userAuth: true })
    );
    org.value = res.data;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load organization.';
    org.value = null;
  } finally {
    loading.value = false;
  }
}

function onDeleted() {
  // Navigation is handled by the component
}
</script>

<style scoped>
/* Styles moved to reusable components */
</style>
