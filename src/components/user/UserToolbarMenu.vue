<template>
  <div class="d-flex align-center">
    <v-btn v-if="isTester && $route.path !== '/analytics'" color="catWorksDarker" to="/analytics" class="mr-2">
      <v-icon left>mdi-poll</v-icon>
      Analytics
    </v-btn>

    <ui-variant-selector v-if="isAdmin" />
    
    <v-btn icon to="/tests" v-if="isAdmin">
      <v-icon>mdi-clipboard-check-multiple-outline</v-icon>
    </v-btn>  
    
    <v-menu rounded offset-y v-if="userId">
      <template v-slot:activator="{on}">
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
          <v-list-item-icon>
            <v-icon>mdi-folder-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            Saved Searches
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="isTester" exact-path to="/me/labels">
          <v-list-item-icon>
            <v-icon>mdi-tag-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            Labels
          </v-list-item-content>
        </v-list-item>

        <v-list-item exact-path :to="userAuthorId | entityZoomLink" v-if="userAuthorId">
          <v-list-item-icon>
            <v-icon>mdi-account-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            My author profile
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="localLogout">
          <v-list-item-icon>
            <v-icon>mdi-logout</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            Log out
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>

    <div v-else>
      <template v-if="$vuetify.breakpoint.mobile">
        <v-menu offset-y>
          <template v-slot:activator="{on}">
            <v-btn icon v-on="on">
              <v-icon>mdi-menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="setIsSignupDialogOpen(true)">
              <v-list-item-icon>
                <v-icon>mdi-account-plus</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="font-weight-bold">
                  Sign Up
                </v-list-item-title>
                <v-list-item-subtitle>
                  Create a new account
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item @click="setIsLoginDialogOpen(true)">
              <v-list-item-icon>
                <v-icon>mdi-account-arrow-right</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  Log In
                </v-list-item-title>
                <v-list-item-subtitle>
                  Access your existing account
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-divider/>
            <v-list-item href="https://openalex.zendesk.com/hc/en-us/requests/new" target="_blank">
              <v-list-item-icon>
                <v-icon>mdi-comment-question-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  Contact support
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item href="https://help.openalex.org/" target="_blank">
              <v-list-item-icon>
                <v-icon>mdi-help-circle-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  Visit help center
                </v-list-item-title>
              </v-list-item-content>
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
          Log In
        </v-btn>
        <v-btn
            rounded
            text
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
      }
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
  created() {
  },
  mounted() {
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