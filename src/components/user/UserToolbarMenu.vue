<template>
  <div>
    <v-btn v-if="userId" icon to="/me/searches">
      <v-icon>mdi-folder-outline</v-icon>
    </v-btn>

    <v-menu rounded offset-y v-if="userId">
      <template v-slot:activator="{on}">
        <v-btn icon v-on="on">
          <v-icon>mdi-account-outline</v-icon>
        </v-btn>
      </template>
      <v-list>
        <div class="py-2 px-4">
          {{ userName }}
        </div>
        <div class="pb-2 px-4 body-2 grey--text">
          {{ userEmail }}
        </div>
<!--        <v-divider></v-divider>-->
<!--        <v-list-item exact-path to="/me/searches">-->
<!--          <v-list-item-icon>-->
<!--            <v-icon>mdi-folder-outline</v-icon>-->
<!--          </v-list-item-icon>-->
<!--          <v-list-item-content>-->
<!--            Saved Searches-->
<!--          </v-list-item-content>-->
<!--        </v-list-item>-->

<!--        <v-list-item exact-path to="/me">-->
<!--          <v-list-item-icon>-->
<!--            <v-icon>mdi-account-outline</v-icon>-->
<!--          </v-list-item-icon>-->
<!--          <v-list-item-content>-->
<!--            Account settings-->
<!--          </v-list-item-content>-->
<!--        </v-list-item>-->

        <v-divider/>
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


    <div class="" v-else>
      <v-btn
          text
          rounded
          @click="setIsLoginDialogOpen(true)"
      >
        Log in
      </v-btn>
      <v-btn
          rounded
          color="primary"
          @click="setIsSignupDialogOpen(true)"
      >
        Sign up
      </v-btn>

    </div>

    <user-signup />
    <user-login />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import UserSignup from "./UserSignup.vue";
import UserLogin from "./UserLogin.vue";

export default {
  name: "UserToolbarMenu",
  components: {
    UserSignup,
    UserLogin,
  },
  props: {},
  data() {
    return {
      foo: 42,
      dialogs: {
        userSignup: false,
        userLogin: false,
      }
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    ...mapGetters("user", [
      "userName",
      "userEmail",
      "userId",
      "isSignupDialogOpen",
      "isLoginDialogOpen"
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
    ...mapActions([]),
    localLogout() {
      this.logout()
      // this.$router.push("/")
      this.snackbar("You're logged out")
    },
    goToSavedSearches() {
      this.$router.push("/me/searches")
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">

</style>