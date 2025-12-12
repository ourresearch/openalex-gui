<template>
  <div class="color-2 py-8">
    <v-container>
      <!-- Loading state -->
      <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px;">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>
      
      <!-- Access denied -->
      <div v-else-if="accessDenied">
        <v-alert type="error" variant="tonal">
          You don't have access to this organization. Only organization owners and admins can view this page.
        </v-alert>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error">
        <v-alert type="error" variant="tonal">{{ error }}</v-alert>
      </div>
      
      <!-- Main content -->
      <v-row v-else-if="organization">
        <v-col cols="12" md="3">
          <v-card flat class="bg-transparent">
            <div class="text-h5 mb-1">{{ organization.name }}</div>
            <div v-if="organization.domains && organization.domains.length" class="text-body-2 text-medium-emphasis mb-4">
              {{ organization.domains[0] }}
            </div>
            <v-list nav density="comfortable" class="bg-transparent">
              <v-list-item
                v-for="item in navItems"
                :key="item.route"
                :to="item.route"
                :prepend-icon="item.icon"
                :title="item.title"
                rounded="lg"
                class="mb-1"
              />
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="9">
          <router-view :organization="organization" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'OrganizationBase' });

const route = useRoute();
const router = useRouter();
const store = useStore();

const organization = ref(null);
const loading = ref(true);
const error = ref('');
const accessDenied = ref(false);

const navItems = computed(() => {
  const orgId = route.params.orgId;
  return [
    { title: 'About', route: `/organizations/${orgId}/about`, icon: 'mdi-information-outline' },
    { title: 'Members', route: `/organizations/${orgId}/members`, icon: 'mdi-account-group-outline' },
  ];
});

async function fetchOrganization() {
  const orgId = route.params.orgId;
  if (!orgId) {
    error.value = 'No organization ID provided';
    loading.value = false;
    return;
  }
  
  loading.value = true;
  error.value = '';
  accessDenied.value = false;
  
  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${orgId}`,
      axiosConfig({ userAuth: true })
    );
    organization.value = res.data;
    
    // Check access: user must be admin or owner of this org
    const isAdmin = store.getters['user/isAdmin'];
    const userId = store.getters['user/userId'];
    const isOwner = organization.value.members?.some(
      m => m.id === userId && m.organization_role === 'owner'
    );
    
    if (!isAdmin && !isOwner) {
      accessDenied.value = true;
      organization.value = null;
    }
  } catch (e) {
    if (e?.response?.status === 403 || e?.response?.status === 401) {
      accessDenied.value = true;
    } else {
      error.value = e?.response?.data?.message || 'Failed to load organization.';
    }
    organization.value = null;
  } finally {
    loading.value = false;
  }
}

// Watch for route changes (orgId)
watch(
  () => route.params.orgId,
  () => {
    fetchOrganization();
  }
);

onMounted(() => {
  fetchOrganization();
});
</script>

<style lang="scss" scoped>
.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>
