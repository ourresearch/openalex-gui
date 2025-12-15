<template>
  <div>
    <!-- Breadcrumbs -->
    <DashboardBreadcrumbs :items="breadcrumbItems" />

    <!-- Page title -->
    <h1 class="text-xl font-bold mb-4">Members</h1>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center h-[200px]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Error state -->
    <Alert v-else-if="error" variant="destructive" class="mb-4">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Content -->
    <template v-else-if="organization">
      <OrganizationMembersList
        :organization="organization"
        :is-admin="true"
        @updated="fetchOrganization"
      />
    </template>

    <!-- No organization -->
    <Alert v-else>
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>Organization not found.</AlertDescription>
    </Alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

import { AlertCircle } from 'lucide-vue-next';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { urlBase, axiosConfig } from '@/apiConfig';
import DashboardBreadcrumbs from '@/components/DashboardBreadcrumbs.vue';
import OrganizationMembersList from '@/components/Organization/OrganizationMembersList.vue';

defineOptions({ name: 'AdminOrganizationMembers' });

const route = useRoute();

const organization = ref(null);
const loading = ref(true);
const error = ref('');

const breadcrumbItems = computed(() => [
  { text: 'Admin', to: '/admin/users' },
  { text: 'Organizations', to: '/admin/organizations' },
  { text: organization.value?.name || 'Organization', to: `/admin/organizations/${route.params.orgId}` },
  { text: 'Members' }
]);

async function fetchOrganization() {
  const orgId = route.params.orgId;
  if (!orgId) {
    error.value = 'No organization ID provided';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${orgId}`,
      axiosConfig({ userAuth: true })
    );
    organization.value = res.data;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load organization.';
    organization.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchOrganization();
});
</script>
