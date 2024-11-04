<template>
  <div>
    <!--    <v-btn v-if="userId" icon to="/me/searches">-->
    <!--      <v-icon>mdi-folder-outline</v-icon>-->
    <!--    </v-btn>-->

    <v-menu rounded offset-y v-if="userId">
      <template #activator="{ on }">
        <v-btn icon v-on="on">
          <v-icon>mdi-account-outline</v-icon>
        </v-btn>
      </template>
      <v-list>
        <div class="pt-2 pb-0 px-4 font-weight-bold text-center">
          {{ userName }}
        </div>
        <div class="pb-2 px-4 caption grey--text text-center">
          {{ userEmail }}
        </div>
        <v-divider></v-divider>
        <v-list-item exact-path to="/me/searches">
          <span>
            <v-icon>mdi-folder-outline</v-icon>
          </span>
          
            Saved Searches
          
        </v-list-item>
        <v-list-item exact-path :to="userAuthorId || entityZoomLink" v-if="userAuthorId">
          <span>
            <v-icon>mdi-account-outline</v-icon>
          </span>
          
            My author profile
          
        </v-list-item>

        <!--        <v-list-item exact-path to="/me">-->
        <!--          <span>-->
        <!--            <v-icon>mdi-account-outline</v-icon>-->
        <!--          </span>-->
        <!--          -->
        <!--            Account settings-->
        <!--          -->
        <!--        </v-list-item>-->

<!--        <v-divider/>-->
        <v-list-item @click="localLogout">
          <span>
            <v-icon>mdi-logout</v-icon>
          </span>
          
            Log out
          
        </v-list-item>
      </v-list>
    </v-menu>


    <div class="" v-else>
      <template v-if="isMobile">
        <v-menu offset-y>
          <template v-slot:activator="{on}">
            <v-btn icon v-on="on">
              <v-icon>mdi-menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="setIsSignupDialogOpen(true)">
              <span>
                <v-icon>mdi-account-plus</v-icon>
              </span>
              
                <v-list-item-title class="font-weight-bold">
                  Sign up
                </v-list-item-title>
                <v-list-item-subtitle>
                  Create a new account
                </v-list-item-subtitle>
              
            </v-list-item>
            <v-list-item @click="setIsLoginDialogOpen(true)">
              <span>
                <v-icon>mdi-account-arrow-right</v-icon>
              </span>
              
                <v-list-item-title>
                  Log in
                </v-list-item-title>
                <v-list-item-subtitle>
                  Access your existing account
                </v-list-item-subtitle>
              
            </v-list-item>
            <v-divider/>
            <v-list-item href="https://openalex.zendesk.com/hc/en-us/requests/new" target="_blank">
              <span>
                <v-icon>mdi-comment-question-outline</v-icon>
              </span>
              
                <v-list-item-title>
                  Contact support
                </v-list-item-title>
              
            </v-list-item>
            <v-list-item href="https://help.openalex.org/" target="_blank">
              <span>
                <v-icon>mdi-help-circle-outline</v-icon>
              </span>
              
                <v-list-item-title>
                  Visit help center
                </v-list-item-title>
              
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
      <template v-else>
        <v-btn
            text
            rounded
            @click="setIsLoginDialogOpen(true)"
        >
          Log in
        </v-btn>
        <v-btn
            rounded
            text
            @click="setIsSignupDialogOpen(true)"
        >
          Sign up
        </v-btn>
      </template>

    </div>

    <user-signup/>
    <user-login/>
  </div>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';
import UserSignup from './UserSignup.vue';
import UserLogin from './UserLogin.vue';


const store = useStore();
const { xs, smAndDown } = useDisplay();

// Using the computed properties from Vuex
const userName = computed(() => store.getters['user/userName']);
const userEmail = computed(() => store.getters['user/userEmail']);
const userAuthorId = computed(() => store.getters['user/userAuthorId']);
const userId = computed(() => store.getters['user/userId']);
const isSignupDialogOpen = computed({
  get: () => store.getters['user/isSignupDialogOpen'],
  set: (val) => store.commit('user/setIsSignupDialogOpen', val),
});
const isLoginDialogOpen = computed({
  get: () => store.getters['user/isLoginDialogOpen'],
  set: (val) => store.commit('user/setIsLoginDialogOpen', val),
});

// Determine if it's mobile based on breakpoint
const isMobile = computed(() => xs.value || smAndDown.value);

// Methods
const setIsSignupDialogOpen = (isOpen: boolean) => {
  store.commit('user/setIsSignupDialogOpen', isOpen);
};
const setIsLoginDialogOpen = (isOpen: boolean) => {
  store.commit('user/setIsLoginDialogOpen', isOpen);
};

const localLogout = () => {
  store.commit('user/logout');
  store.commit('snackbar', "You're logged out");
};

const entityZoomLink = (id: string) => {
  // Assuming this function generates a route object or URL for "entityZoomLink"
  return { name: 'EntityZoom', params: { id } };
};
</script>

<style scoped lang="scss">

</style>
