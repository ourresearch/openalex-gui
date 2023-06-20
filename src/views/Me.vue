<template>
  <v-container>
    <v-card>
      <v-card-title>My Account</v-card-title>
      <v-row>
        <v-col sm="3">
          <v-list nav>
            <v-list-item dark value="true" to="/me">
              <v-list-item-icon>
                <v-icon>mdi-account-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Account</v-list-item-title>
            </v-list-item>
            <v-list-item to="/me/notifications">
              <v-list-item-icon>
                <v-icon>mdi-email-search-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Email alerts</v-list-item-title>
            </v-list-item>
            <v-list-item to="/me/saved-searches">
              <v-list-item-icon>
                <v-icon>mdi-text-search</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Saved searches</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-col>
        <v-col sm="9">
          <v-card flat>
            <v-list nav>
            <v-list-item>
              <v-list-item-icon>
                <v-icon>mdi-badge-account-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ userName }}</v-list-item-title>
                <v-list-item-subtitle>Your name</v-list-item-subtitle>

              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-icon>
                <v-icon>mdi-email-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ userEmail }}</v-list-item-title>
                <v-list-item-subtitle>Your email</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {
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
    ]),
    ...mapGetters("user", [
      "userId",
      "userName",
      "userEmail",
    ]),
    tab(){
      return null
    }
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
  }
}
</script>

<style scoped lang="scss">

.v-list .v-list-item--active {
  color: #1976d2; // primary
}

</style>