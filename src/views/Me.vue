<template>
  <v-container>
    <v-card>
      <v-card-title>
        My Account
        <v-icon>mdi-chevron-right</v-icon>
        <span class="font-weight-regular">{{ $route.params.tab.replace("-", " ") }}</span>
      </v-card-title>
      <v-row>
        <v-col sm="3">
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
              <v-list-item-title>Email alerts</v-list-item-title>
            </v-list-item>
            <v-list-item :dark="$route.params.tab==='saved-searches'" to="/me/saved-searches">
              <v-list-item-icon>
                <v-icon>mdi-content-save-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Saved searches</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-col>
        <v-col sm="9">
          <v-card flat v-if="$route.params.tab==='details'">
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
          </v-card>
          <v-card flat v-if="$route.params.tab==='email-alerts'">
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
          </v-card>
          <v-card flat v-if="$route.params.tab==='saved-searches'">
            <v-list nav>
              <v-list-item
                v-for="savedSearch in userSavedSearches"
                :key="savedSearch.id"
                :href="savedSearch.search_url"
              >
                <v-list-item-icon>
                  <v-icon>mdi-content-save-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ savedSearch.search_url }}</v-list-item-title>
                  <v-list-item-subtitle>URL</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn icon>
                    <v-icon>mdi-trash-outline</v-icon>
                  </v-btn>
                </v-list-item-action>
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
  components: {},
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
      "userEmailAlerts",
      "userSavedSearches",
    ]),
    tab() {
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
    this.$store.dispatch("user/fetchEmailAlerts")
    this.$store.dispatch("user/fetchSavedSearches")
  },
  watch: {}
}
</script>

<style scoped lang="scss">

.v-list .v-list-item--active {
  color: #1976d2; // primary
}

</style>