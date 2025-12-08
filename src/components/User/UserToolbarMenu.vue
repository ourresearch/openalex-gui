<template>
  <div class="d-flex align-center">
    <ui-variant-selector v-if="false && isAdmin" />
    
    <!-- User profile link -->
    <v-btn v-if="userId" icon variant="plain" to="/me/profile">
      <v-icon>mdi-account-outline</v-icon>
    </v-btn>

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

import UserSignup from './UserSignup.vue';
import UserLogin from './UserLogin.vue';
import UiVariantSelector from '../Misc/UiVariantSelector.vue';

defineOptions({ name: 'UserToolbarMenu' });

const store = useStore();

const { smAndDown } = useDisplay();

const userId = computed(() => store.getters['user/userId']);
const isAdmin = computed(() => store.getters['user/isAdmin']);

// Methods
const setIsSignupDialogOpen = (val) => store.commit('user/setIsSignupDialogOpen', val);
const setIsLoginDialogOpen = (val) => store.commit('user/setIsLoginDialogOpen', val);
</script>


<style scoped lang="scss">
.d-flex {
  display: flex;
}
.align-center {
  align-items: center;
}
</style>