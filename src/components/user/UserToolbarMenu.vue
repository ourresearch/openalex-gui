<template>
  <div>
    <v-btn
            text
            @click="dialogs.userSignup = true"
    >
      Sign up
    </v-btn>
    <v-btn
            text
    >
      Log in
    </v-btn>

    <v-menu offset-y content-class="no-highlight" min-width="150">
      <template v-slot:activator="{on}">
        <v-btn icon color="" v-on="on">
          <v-icon class="">mdi-menu</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item to="/">
          Home
        </v-list-item>
        <v-list-item to="/about">
          About
        </v-list-item>
        <v-list-item to="/premium">
          Premium
        </v-list-item>
        <v-list-item to="/help">
          Help
        </v-list-item>
      </v-list>
    </v-menu>
    <v-dialog v-model="dialogs.userSignup" max-width="400">
      <v-card>
        <v-toolbar flat>
          <v-toolbar-title>
            Sign up
          </v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="dialogs.userSignup = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <div class="pa-4">
          <user-signup/>
        </div>
      </v-card>

    </v-dialog>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import UserSignup from "./UserSignup.vue";

export default {
    name: "UserToolbarMenu",
    components: {
        UserSignup,
    },
    props: {},
    data() {
        return {
            foo: 42,
            dialogs: {
                userSignup: false,
            }
        }
    },
    computed: {
        ...mapGetters([
            "resultsFilters",
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
        ...mapActions([]),


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