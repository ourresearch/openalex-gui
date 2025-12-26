<template>
  <div>
    <!-- Breadcrumbs -->
    <DashboardBreadcrumbs :items="breadcrumbItems" />
    
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px;">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>
    
    <div v-else-if="user">
      <!-- User header -->
      <div class="d-flex align-center mb-6">
        <v-avatar size="56" class="mr-4" :color="getAvatarColor(user)">
          <v-img 
            v-if="user.gravatar_url" 
            :src="user.gravatar_url"
            :alt="user.display_name"
          />
          <span v-else class="text-white text-h5 font-weight-medium">
            {{ getInitial(user) }}
          </span>
        </v-avatar>
        <div>
          <div class="d-flex align-center ga-2">
            <h1 class="text-h5 font-weight-semibold">{{ user.display_name || 'No name' }}</h1>
            <v-chip
              v-if="user.is_admin"
              size="small"
              color="amber-darken-2"
              variant="tonal"
            >
              <v-icon start size="small">mdi-crown</v-icon>
              Admin
            </v-chip>
          </div>
          <div class="text-body-2 text-medium-emphasis">{{ user.email || 'No email' }}</div>
        </div>
        <v-spacer />
        <v-btn
          v-if="!isCurrentUser"
          variant="outlined"
          prepend-icon="mdi-account-switch"
          @click="impersonateUser"
        >
          Impersonate
        </v-btn>
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
    
    <v-alert v-else-if="error" type="error" density="compact">{{ error }}</v-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import DashboardBreadcrumbs from '@/components/DashboardBreadcrumbs.vue';
import UserProfileSection from '@/components/User/UserProfileSection.vue';
import UserOrganizationSection from '@/components/User/UserOrganizationSection.vue';
import UserPlanSection from '@/components/User/UserPlanSection.vue';
import UserApiSection from '@/components/User/UserApiSection.vue';
import UserDangerZoneSection from '@/components/User/UserDangerZoneSection.vue';

defineOptions({ name: 'AdminUserDetail' });

const route = useRoute();
const router = useRouter();
const store = useStore();

const user = ref(null);
const loading = ref(false);
const error = ref('');

// Check if viewing current user (can't impersonate yourself)
const isCurrentUser = computed(() => {
  return user.value?.id === store.state.user.id;
});

async function impersonateUser() {
  if (!user.value) return;
  await store.dispatch('user/startImpersonation', {
    userId: user.value.id,
    userName: user.value.display_name || user.value.email
  });
  router.push('/');
}

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
