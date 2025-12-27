<template>
  <div class="d-flex align-center">
    <ui-variant-selector v-if="false && isAdmin" />
    
    <!-- User account menu -->
    <v-menu v-if="userId" location="bottom">
      <template v-slot:activator="{props}">
        <v-btn icon variant="plain" v-bind="props">
          <v-avatar size="32" :color="avatarColor">
            <span class="text-white text-body-2 font-weight-medium">{{ userInitial }}</span>
          </v-avatar>
        </v-btn>
      </template>
      <v-card>
        <v-list>
          <v-list-subheader class="py-1" style="min-height: auto;">{{ userName }}</v-list-subheader>
          <v-list-item to="/settings">
            <template #prepend>
              <v-icon>mdi-cog-outline</v-icon>
            </template>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item>

          <template v-if="isAdmin">
            <v-list-item to="/admin">
              <template #prepend>
                <v-icon>mdi-crown-outline</v-icon>
              </template>
              <v-list-item-title>Admin</v-list-item-title>
            </v-list-item>
          </template>

          <v-divider />
          <v-list-item @click="logout">
            <template #prepend>
              <v-icon>mdi-logout</v-icon>
            </template>
            <v-list-item-title>Log out</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>

    <div v-else>
      <!-- Login / Sign up links-->
      <template v-if="smAndDown">
        <v-menu location="bottom">
          <template v-slot:activator="{props}">
            <v-btn icon variant="plain" v-bind="props">
              <v-icon>mdi-menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item to="/signup">
              <template #prepend>
                <v-icon>mdi-account-plus</v-icon>
              </template>
              <v-list-item-title class="font-weight-bold">
                Sign Up
              </v-list-item-title>
              <v-list-item-subtitle>
                Create a new account
              </v-list-item-subtitle>  
            </v-list-item>
            <v-list-item to="/login">
              <template #prepend>
                <v-icon>mdi-account-arrow-right</v-icon>
              </template>
              <v-list-item-title>
                Log In
              </v-list-item-title>
              <v-list-item-subtitle>
                Access your existing account
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider/>
            
            <v-list-item href="https://openalex.zendesk.com/hc/en-us/requests/new" target="_blank">
              <template #prepend>
                <v-icon>mdi-comment-question-outline</v-icon>
              </template>
              <v-list-item-title>
                Contact support
              </v-list-item-title>
            </v-list-item>

            <v-list-item href="https://help.openalex.org/" target="_blank">
              <template #prepend>
                <v-icon>mdi-help-circle-outline</v-icon>
              </template>
              <v-list-item-title>
                Visit help center
              </v-list-item-title>
            </v-list-item>

          </v-list>
        </v-menu>
      </template>
      <template v-else>
        <v-btn
          variant="text"
          rounded
          to="/login"
        >
          Log In
        </v-btn>
        <v-btn
          rounded
          variant="text"
          to="/signup"
        >
          Sign Up
        </v-btn>
      </template>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify'

import UiVariantSelector from '../Misc/UiVariantSelector.vue';

defineOptions({ name: 'UserToolbarMenu' });

const store = useStore();

const { smAndDown } = useDisplay();

const userId = computed(() => store.getters['user/userId']);
const userName = computed(() => store.getters['user/userName']);
const isAdmin = computed(() => store.getters['user/isAdmin']);
const userEmail = computed(() => store.getters['user/userEmail']);

// Avatar colors (same as OrganizationMembers)
const avatarColors = [
  '#1976D2', '#388E3C', '#D32F2F', '#7B1FA2', 
  '#C2185B', '#0097A7', '#F57C00', '#5D4037'
];

const userInitial = computed(() => {
  if (userName.value) return userName.value.charAt(0).toUpperCase();
  if (userEmail.value) return userEmail.value.charAt(0).toUpperCase();
  return '?';
});

const avatarColor = computed(() => {
  const str = userId.value || userEmail.value || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
});

const logout = () => {
  store.commit('user/logout');
  store.commit('snackbar', "You're logged out");
};
</script>


<style scoped lang="scss">
.d-flex {
  display: flex;
}
.align-center {
  align-items: center;
}
</style>