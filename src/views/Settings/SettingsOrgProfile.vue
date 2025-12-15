<template>
  <div>
    <h1 class="text-xl font-bold mb-6">Organization Profile</h1>

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
      <OrganizationProfileSection
        :organization="organization"
        :can-edit="canEdit"
        :is-admin="isAdmin"
        @updated="fetchOrganization"
      />
    </template>

    <!-- No organization -->
    <Alert v-else>
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>You are not part of an organization.</AlertDescription>
    </Alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { AlertCircle } from 'lucide-vue-next';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { urlBase, axiosConfig } from '@/apiConfig';
import OrganizationProfileSection from '@/components/Organization/OrganizationProfileSection.vue';

defineOptions({ name: 'SettingsOrgProfile' });

useHead({ title: 'Organization Profile' });

const store = useStore();

const organization = ref(null);
const loading = ref(true);
const error = ref('');

const organizationId = computed(() => store.state.user.organizationId);
const organizationRole = computed(() => store.state.user.organizationRole);
const isAdmin = computed(() => store.getters['user/isAdmin']);
const canEdit = computed(() => isAdmin.value || organizationRole.value === 'owner');

async function fetchOrganization() {
  if (!organizationId.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${organizationId.value}`,
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

<style scoped>
/* Styles moved to reusable component */
</style>
