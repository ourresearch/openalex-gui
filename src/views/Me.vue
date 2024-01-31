<template>
  <v-container>
    <v-btn
          color="primary"
          rounded
          class="my-2"
          text
          @click="$router.back()"
      >
        <v-icon left>mdi-arrow-left</v-icon>
        back
      </v-btn>
    <v-row>
      <v-col cols="12" >
        <v-card rounded flat class="color-3">
          <v-card-title class="color-2">My account details</v-card-title>
          <v-list color="transparent">
            <v-list-item>
              <v-list-item-icon>
                <v-icon>mdi-account</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ userName }}</v-list-item-title>
                <v-list-item-subtitle>Name</v-list-item-subtitle>

              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-icon>
                <v-icon>mdi-email</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ userEmail }}</v-list-item-title>
                <v-list-item-subtitle>Email</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
          <v-card-actions class="">
            <v-spacer></v-spacer>
            <v-btn text rounded @click="logout">
              <v-icon left>mdi-logout</v-icon>
              Log out
            </v-btn>
            <v-btn text rounded color="primary" to="/">
              <v-icon left>mdi-home-outline</v-icon>
              Home
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>



    </v-row>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import UserSavedSearch from "../components/user/UserSavedSearch.vue";

export default {
  name: "Me",
  metaInfo() {
    return {title: "Account"}
  },
  components: {
    UserSavedSearch,
  },
  props: {},
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "globalIsLoading",
    ]),
    ...mapGetters("user", [
      "userId",
      "userName",
      "userEmail",
      "userEmailAlerts",
      "userSavedSearches",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "logout",
    ]),
    ...mapActions("user", [
    ]),


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">


</style>