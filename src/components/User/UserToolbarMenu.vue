<template>
  <div class="d-flex align-center">
    <ui-variant-selector v-if="false && isAdmin" />
    
    <!-- User menu -->
    <v-menu class="rounded-lg" location="bottom" v-if="userId">
      <template v-slot:activator="{props}">
        <v-btn icon variant="plain" v-bind="props">
          <v-icon>mdi-account-outline</v-icon>
        </v-btn>
      </template>
      <v-list>
        <div class="pt-2 pb-0 px-4 font-weight-bold text-center">
          {{ userName }}
        </div>
        <div class="pb-2 px-4 text-caption text-grey text-center">
          {{ userEmail }}
        </div>
        <div v-if="isLibrarian" class="pb-2 px-4 text-center">
          <v-chip
            size="x-small"
            color="primary"
            variant="tonal"
            density="compact"
          >
            librarian
          </v-chip>
        </div>

        <v-divider></v-divider>
        
        <v-list-item to="/me/searches" prepend-icon="mdi-folder-outline">
          Saved Searches
        </v-list-item>

        <v-list-item to="/me/corrections" prepend-icon="mdi-pencil-outline">
          My Corrections
        </v-list-item>

        <v-list-item v-if="isTester" to="/me/labels" prepend-icon="mdi-tag-outline">
          Labels
        </v-list-item>

        <v-list-item v-if="isAdmin" to="/tests" prepend-icon="mdi-clipboard-check-multiple-outline">
          Tests
        </v-list-item>  

        <v-list-item :to="filters.entityZoomLink(userAuthorId)" v-if="userAuthorId" prepend-icon="mdi-account-outline">
          My author profile
        </v-list-item>
        <v-list-item @click="localLogout" prepend-icon="mdi-logout">
          Log out
        </v-list-item>
      </v-list>
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
            <v-list-item @click="setIsSignupDialogOpen(true)">
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
            <v-list-item @click="setIsLoginDialogOpen(true)">
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
          @click="setIsLoginDialogOpen(true)"
        >
          Log In
        </v-btn>
        <v-btn
          rounded
          variant="text"
          @click="setIsSignupDialogOpen(true)"
        >
          Sign Up
        </v-btn>
      </template>

    </div>

    <user-signup/>
    <user-login/>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify'

import filters from '@/filters';
import UserSignup from './UserSignup.vue';
import UserLogin from './UserLogin.vue';
import UiVariantSelector from '../Misc/UiVariantSelector.vue';

defineOptions({ name: 'UserToolbarMenu' });

const store = useStore();

const { smAndDown } = useDisplay();

const userId = computed(() => store.getters['user/userId']);
const userName = computed(() => store.getters['user/userName']);
const userEmail = computed(() => store.getters['user/userEmail']);
const userAuthorId = computed(() => store.getters['user/userAuthorId']);
const isTester = computed(() => store.getters['user/isTester']);
const isAdmin = computed(() => store.getters['user/isAdmin']);
const isLibrarian = computed(() => store.getters['user/isLibrarian']);

// Methods
const snackbar = (msg) => store.commit('snackbar', msg);
const logout = () => store.commit('user/logout');
const setIsSignupDialogOpen = (val) => store.commit('user/setIsSignupDialogOpen', val);
const setIsLoginDialogOpen = (val) => store.commit('user/setIsLoginDialogOpen', val);

const localLogout = () => {
  logout();
  snackbar("You're logged out");
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