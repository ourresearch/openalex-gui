<template>
  <div>
    <div class="text-h5 mb-4">Profile</div>
    
    <v-card flat variant="outlined" class="bg-white">
      <v-list lines="two">
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="grey">mdi-account</v-icon>
          </template>
          <v-list-item-title class="text-grey">Name</v-list-item-title>
          <v-list-item-subtitle class="text-body-1 text-black">
            {{ userName || 'Not set' }}
          </v-list-item-subtitle>
        </v-list-item>
        
        <v-divider />
        
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="grey">mdi-email-outline</v-icon>
          </template>
          <v-list-item-title class="text-grey">Email</v-list-item-title>
          <v-list-item-subtitle class="text-body-1 text-black">
            {{ userEmail || 'Not set' }}
          </v-list-item-subtitle>
        </v-list-item>
        
        <v-divider />
        
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="grey">mdi-shield-account-outline</v-icon>
          </template>
          <v-list-item-title class="text-grey">Role</v-list-item-title>
          <v-list-item-subtitle class="text-body-1 text-black">
            <v-chip size="small" :color="roleColor" variant="flat">
              {{ userRole }}
            </v-chip>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-btn
          variant="text"
          color="grey"
          prepend-icon="mdi-logout"
          @click="logout"
        >
          Log out
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

defineOptions({ name: 'MeProfile' });

useHead({ title: 'Profile' });

const store = useStore();
const router = useRouter();

const userName = computed(() => store.state.user.name);
const userEmail = computed(() => store.state.user.email);

const userRole = computed(() => {
  if (store.state.user.isAdmin) return 'Admin';
  if (store.state.user.isLibrarian) return 'Librarian';
  return 'User';
});

const roleColor = computed(() => {
  if (store.state.user.isAdmin) return 'purple';
  if (store.state.user.isLibrarian) return 'blue';
  return 'grey';
});

const logout = () => {
  store.commit('user/logout');
  store.commit('snackbar', "You're logged out");
  router.push('/');
};
</script>
