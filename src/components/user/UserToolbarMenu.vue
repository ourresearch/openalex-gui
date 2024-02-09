<template>
  <div>

    <v-menu offset-y v-if="userId">
      <template v-slot:activator="{on}">
        <v-btn icon v-on="on">
          <v-icon>mdi-account-outline</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-subheader>
          Logged in as <span class="font-weight-bold ml-1">{{ userName }}</span>
        </v-subheader>
        <v-divider></v-divider>
        <v-list-item exact-path to="/me/searches">
          <v-list-item-icon>
            <v-icon>mdi-folder-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            Saved Searches
          </v-list-item-content>
        </v-list-item>

        <v-list-item exact-path to="/me">
          <v-list-item-icon>
            <v-icon>mdi-account-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            Account settings
          </v-list-item-content>
        </v-list-item>

        <v-divider />
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
          :disabled="$route.name==='Login'"
          @click="dialogs.userLogin = true"
      >
        Log in
      </v-btn>
      <v-btn
          rounded
          color="primary"
          :disabled="$route.name==='Signup'"
          @click="dialogs.userSignup = true"
      >
        Sign up
      </v-btn>

    </div>

    <v-dialog v-model="dialogs.userSignup" max-width="400">
      <user-signup show-close-button @close="dialogs.userSignup = false"/>
    </v-dialog>

    <v-dialog v-model="dialogs.userLogin" max-width="400">
      <user-login show-close-button @close="dialogs.userLogin = false"/>
    </v-dialog>
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
      "userId",
    ]),
    isOpen: {
      get() {
        if (!this.$vuetify.breakpoint.mobile) return true
        return this.$store.state.showFiltersDrawer
      },
      set(val) {
        if (!this.$vuetify.breakpoint.mobile) return // you can't falsify isOpen on desktop
        this.$store.state.showFiltersDrawer = val
      },
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "logout",
    ]),
    ...mapActions([]),
    localLogout() {
      this.logout()
      this.$router.push("/")
      this.snackbar("You're logged out")
    },
    goToSavedSearches(){
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