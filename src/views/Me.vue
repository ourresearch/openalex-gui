<template>
  <v-container>
    <div class="text-h4 py-4 px-2">My Account</div>

      <v-row>
        <v-col sm="3">
          <v-card>

          <v-list nav>
            <v-list-item :dark="$route.params.tab==='details'" to="/me/details">
              <v-list-item-icon>
                <v-icon>mdi-account-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Details</v-list-item-title>
            </v-list-item>
            <v-list-item :dark="$route.params.tab==='email-alerts'" to="/me/email-alerts">
              <v-list-item-icon>
                <v-icon>mdi-email-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-title>
                Email alerts
                <span>
                  ({{ userEmailAlerts.length }})
                </span>
              </v-list-item-title>
            </v-list-item>
            <v-list-item :dark="$route.params.tab==='saved-searches'" to="/me/saved-searches">
              <v-list-item-icon>
                <v-icon>mdi-content-save-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-title>
                Saved searches
                <span>
                  ({{ userSavedSearches.length }})
                </span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
          </v-card>
        </v-col>
        <v-col sm="9">
          <v-card>
            <v-card-title>
              <span class="">My {{ tabName }}</span>
            </v-card-title>

            <template v-if="$route.params.tab==='details'">
              <v-list>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-account</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ userName }}</v-list-item-title>
                    <v-list-item-subtitle>Your name</v-list-item-subtitle>

                  </v-list-item-content>
                </v-list-item>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-email</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ userEmail }}</v-list-item-title>
                    <v-list-item-subtitle>Your email</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </template>


            <template v-if="$route.params.tab==='email-alerts'">
              <v-list nav>
                <v-list-item
                    v-for="alert in userEmailAlerts"
                    :key="alert.id"
                >
                  <v-list-item-icon>
                    <v-icon>mdi-email-outline</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ alert.work_filter }}</v-list-item-title>
                    <v-list-item-subtitle>Filter</v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-btn icon>
                      <v-icon>mdi-trash-outline</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
            </template>


            <template v-if="$route.params.tab==='saved-searches'">
              <div v-if="userSavedSearches.length === 0" class="pa-4 grey--text">
                You have no saved searches.
              </div>
              <v-list nav v-else>
                <user-saved-search
                    v-for="(savedSearch, i) in userSavedSearches"
                    :key="savedSearch.id"
                    :data="savedSearch"
                    :disabled="globalIsLoading"

                >
                </user-saved-search>
              </v-list>
            </template>
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
        return {title: ["Account", this.tabName].join(" ") }
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
    tabName() {
      return this.$route.params.tab.replace("-", " ")
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
    // this.$store.dispatch("user/fetchEmailAlerts")
    // this.$store.dispatch("user/fetchSavedSearches")
  },
  watch: {}
}
</script>

<style scoped lang="scss">

.v-list .v-list-item--active {
  color: #1976d2; // primary
}

</style>