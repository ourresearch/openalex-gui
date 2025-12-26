<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5 font-weight-bold">Organization Profile</h1>
      <v-btn
        v-if="organization?.openalex_id"
        variant="outlined"
        :href="organization.openalex_id"
        target="_blank"
      >
        View Org
      </v-btn>
    </div>

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
      <OrganizationProfileSection
        :organization="organization"
        :can-edit="canEdit"
        :is-admin="isAdmin"
        @updated="fetchOrganization"
      />
    </template>

    <!-- No organization -->
    <v-alert v-else type="info" variant="tonal">
      You are not part of an organization.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
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
