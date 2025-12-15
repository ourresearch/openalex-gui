<template>
  <div>
    <!-- Breadcrumbs -->
    <DashboardBreadcrumbs :items="breadcrumbItems" />
    
    <div v-if="loading" class="flex justify-center items-center h-[300px]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="user">
      <!-- User header -->
      <div class="flex items-center mb-6">
        <Avatar class="h-14 w-14 mr-4" :style="{ backgroundColor: getAvatarColor(user) }">
          <AvatarImage 
            v-if="user.gravatar_url" 
            :src="user.gravatar_url"
            :alt="user.display_name"
          />
          <AvatarFallback class="text-white text-xl font-medium">
            {{ getInitial(user) }}
          </AvatarFallback>
        </Avatar>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold">{{ user.display_name || 'No name' }}</h1>
            <Badge
              v-if="user.is_admin"
              variant="secondary"
              class="bg-amber-100 text-amber-700"
            >
              <Crown class="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
          <div class="text-sm text-muted-foreground">{{ user.email || 'No email' }}</div>
        </div>
      </div>
      
      <!-- Profile Section -->
      <UserProfileSection
        :user="user"
        :can-edit="true"
        :is-admin="true"
        @updated="fetchUser"
      />

      <!-- Organization Section -->
      <UserOrganizationSection
        :user="user"
        @updated="fetchUser"
        class="mt-8"
      />

      <!-- Plan Section -->
      <UserPlanSection
        :user="user"
        @updated="fetchUser"
        class="mt-8"
      />

      <!-- API Section -->
      <UserApiSection
        :user="user"
        class="mt-8"
      />

      <!-- Danger Zone -->
      <div class="mt-8">
        <UserDangerZoneSection
          :user="user"
          redirect-to="/admin/users"
          @deleted="onDeleted"
        />
      </div>
    </div>
    
    <Alert v-else-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

import { Crown, AlertCircle } from 'lucide-vue-next';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { urlBase, axiosConfig } from '@/apiConfig';
import DashboardBreadcrumbs from '@/components/DashboardBreadcrumbs.vue';
import UserProfileSection from '@/components/User/UserProfileSection.vue';
import UserOrganizationSection from '@/components/User/UserOrganizationSection.vue';
import UserPlanSection from '@/components/User/UserPlanSection.vue';
import UserApiSection from '@/components/User/UserApiSection.vue';
import UserDangerZoneSection from '@/components/User/UserDangerZoneSection.vue';

defineOptions({ name: 'AdminUserDetail' });

const route = useRoute();

const user = ref(null);
const loading = ref(false);
const error = ref('');

const breadcrumbItems = computed(() => [
  { text: 'Admin', to: '/admin/users' },
  { text: 'Users', to: '/admin/users' },
  { text: user.value?.display_name || user.value?.email || 'User' }
]);

// Avatar colors
const avatarColors = [
  '#1976D2', '#388E3C', '#D32F2F', '#7B1FA2', 
  '#C2185B', '#0097A7', '#F57C00', '#5D4037'
];

onMounted(() => {
  fetchUser();
});

async function fetchUser() {
  const userId = route.params.userId;
  if (!userId) {
    error.value = 'No user ID provided';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const res = await axios.get(
      `${urlBase.userApi}/users/${userId}`,
      axiosConfig({ userAuth: true })
    );
    user.value = res.data;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load user.';
    user.value = null;
  } finally {
    loading.value = false;
  }
}

function onDeleted() {
  // Navigation is handled by the component
}

function getInitial(user) {
  if (user.display_name) return user.display_name.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();
  return '?';
}

function getAvatarColor(user) {
  const str = user.id || user.email || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}
</script>

<style scoped>
</style>
