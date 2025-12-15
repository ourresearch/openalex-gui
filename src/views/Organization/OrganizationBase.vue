<template>
  <div class="py-8">
    <div class="container mx-auto px-4">
      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center items-center h-[300px]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
      
      <!-- Access denied -->
      <div v-else-if="accessDenied">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>
            You don't have access to this organization. Only organization owners and admins can view this page.
          </AlertDescription>
        </Alert>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
      </div>
      
      <!-- Main content -->
      <div v-else-if="organization" class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="md:col-span-1">
          <div class="text-xl font-semibold mb-1">{{ organization.name }}</div>
          <div v-if="organization.domains && organization.domains.length" class="text-sm text-muted-foreground mb-4">
            {{ organization.domains[0] }}
          </div>
          <nav class="space-y-1">
            <router-link
              v-for="item in navItems"
              :key="item.route"
              :to="item.route"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
              :class="{ 'bg-primary/10 text-primary': $route.path === item.route }"
            >
              <component :is="item.icon" class="h-4 w-4" />
              {{ item.title }}
            </router-link>
          </nav>
        </div>
        <div class="md:col-span-3">
          <router-view :organization="organization" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';

import { Info, Users, AlertCircle } from 'lucide-vue-next';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'OrganizationBase' });

const route = useRoute();
const router = useRouter();
const store = useStore();

const organization = ref(null);
const loading = ref(true);
const error = ref('');
const accessDenied = ref(false);

const $route = route;

const navItems = computed(() => {
  const orgId = route.params.orgId;
  return [
    { title: 'About', route: `/organizations/${orgId}/about`, icon: Info },
    { title: 'Members', route: `/organizations/${orgId}/members`, icon: Users },
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

<style scoped>
/* Styles handled via Tailwind classes */
</style>
