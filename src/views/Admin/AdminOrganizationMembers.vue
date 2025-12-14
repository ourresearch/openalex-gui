<template>
  <div>
    <!-- Breadcrumbs -->
    <DashboardBreadcrumbs :items="breadcrumbItems" />

    <!-- Page title -->
    <h1 class="text-h5 font-weight-bold mb-4">Members</h1>

    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Error state -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Content -->
    <template v-else-if="organization">
      <OrganizationMembersList
        :organization="organization"
        :is-admin="true"
        @updated="fetchOrganization"
      />
    </template>

    <!-- No organization -->
    <v-alert v-else type="info" variant="tonal">
      Organization not found.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
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
