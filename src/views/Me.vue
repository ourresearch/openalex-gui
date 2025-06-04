<template>
  <v-container fluid>
    <v-row>
      <v-spacer />
      <v-col cols="12" md="4"  xl="3" >
        <v-card rounded outlined class=" pb-10">
          <v-card-title class="">Your account details</v-card-title>
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
        </v-card>
      </v-col>
      <v-spacer />
    </v-row>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import { useHead } from '@unhead/vue';

import UserSavedSearch from "../components/user/UserSavedSearch.vue";

export default {
  name: "Me",
  created() {
    useHead({ title: 'Account' });
  },
  components: {
    UserSavedSearch,
  },
  computed: {
    ...mapGetters([
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