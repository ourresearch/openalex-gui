<template>
  <div>

    <v-menu offset-y v-if="userId">
      <template v-slot:activator="{on}">
        <v-btn icon v-on="on">
          <v-icon>mdi-account-outline</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item class="">
          <div class="body-2">
            <span>
              Hello,
            </span>
            <span class="font-weight-bold">
              {{ userName }}
            </span>!
          </div>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item to="/u">
          Your account
        </v-list-item>
        <v-list-item @click="localLogout">
          Log out
        </v-list-item>
      </v-list>
    </v-menu>


    <div class="pt-2" v-else>
      <v-btn
              text
              @click="dialogs.userSignup = true"
      >
        Sign up
      </v-btn>
      <v-btn
              text
              @click="dialogs.userLogin = true"
      >
        Log in
      </v-btn>

    </div>

    <v-dialog v-model="dialogs.userSignup" max-width="400">
      <v-card>
        <v-toolbar flat>
          <v-toolbar-title>
            Sign up
          </v-toolbar-title>
          <v-spacer/>
          <v-btn icon @click="dialogs.userSignup = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <div class="pa-4">
          <user-signup/>
        </div>
      </v-card>

    </v-dialog>

    <v-dialog v-model="dialogs.userLogin" max-width="400">
      <v-card>
        <v-toolbar flat>
          <v-toolbar-title>
            Log in
          </v-toolbar-title>
          <v-spacer/>
          <v-btn icon @click="dialogs.userSignup = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <div class="pa-4">
          <user-login />
        </div>
      </v-card>

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
        localLogout(){
            this.logout()
            this.snackbar("You're logged out")
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