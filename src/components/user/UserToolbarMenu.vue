<template>
  <div class="d-flex align-center">
    <v-btn 
      v-if="isTester && $route.path !== '/analytics'" 
      color="catWorksDarker" 
      variant="flat" 
      to="/analytics" 
      class="mr-2"
    >
      <v-icon start>mdi-poll</v-icon>
      Analytics
    </v-btn>

    <ui-variant-selector v-if="false && isAdmin" />
    
    <v-btn icon variant="plain" to="/tests" v-if="isAdmin">
      <v-icon>mdi-clipboard-check-multiple-outline</v-icon>
    </v-btn>  
    
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

        <v-divider></v-divider>
        
        <v-list-item to="/me/searches" prepend-icon="mdi-folder-outline">
          Saved Searches
        </v-list-item>
        <v-list-item v-if="isTester" to="/me/labels" prepend-icon="mdi-tag-outline">
          Labels
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
      <template v-if="$vuetify.display.mobile">
        <v-menu location="bottom">
          <template v-slot:activator="{props}">
            <v-btn icon variant="plain" v-bind="props">
              <v-icon>mdi-menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="setIsSignupDialogOpen(true)">
              <v-icon>mdi-account-plus</v-icon>             
              <v-list-item-title class="font-weight-bold">
                Sign Up
              </v-list-item-title>
              <v-list-item-subtitle>
                Create a new account
              </v-list-item-subtitle>  
            </v-list-item>
            <v-list-item @click="setIsLoginDialogOpen(true)">
              <v-icon>mdi-account-arrow-right</v-icon>
              <v-list-item-title>
                Log In
              </v-list-item-title>
              <v-list-item-subtitle>
                Access your existing account
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider/>
            
            <v-list-item href="https://openalex.zendesk.com/hc/en-us/requests/new" target="_blank">
              <v-icon>mdi-comment-question-outline</v-icon>
              <v-list-item-title>
                Contact support
              </v-list-item-title>
            </v-list-item>

            <v-list-item href="https://help.openalex.org/" target="_blank">
              <v-icon>mdi-help-circle-outline</v-icon>
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

<script>

import {mapGetters, mapMutations} from "vuex";
import filters from '@/filters';
import UserSignup from "./UserSignup.vue";
import UserLogin from "./UserLogin.vue";
import UiVariantSelector from "../Misc/UiVariantSelector.vue";

export default {
  name: "UserToolbarMenu",
  components: {
    UserSignup,
    UserLogin,
    UiVariantSelector,
  },
  props: {},
  data() {
    return {
      dialogs: {
        userSignup: false,
        userLogin: false,
      },
      filters,
    }
  },
  computed: {
    ...mapGetters("user", [
      "userId",
      "userName",
      "userEmail",
      "userAuthorId",
      "isTester",
      "isAdmin",
    ]),
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "logout",
      "setIsSignupDialogOpen",
      "setIsLoginDialogOpen",
    ]),
    localLogout() {
      this.logout();
      this.snackbar("You're logged out");
    },
  },
}
</script>


<style scoped lang="scss">
.d-flex {
  display: flex;
}
.align-center {
  align-items: center;
}
</style>