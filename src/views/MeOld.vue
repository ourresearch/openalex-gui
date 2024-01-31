<template>
  <v-container>
    <!--    <div class="text-h4 py-4 px-2">My Account</div>-->
    <v-row>
      <v-col cols="12" md="4" lg="3" v-if="$vuetify.breakpoint.mdAndUp || !selectedTab">
        <v-card rounded flat class="mb-12" color="transparent">
          <v-card-title>
            My account
          </v-card-title>
          <v-list rounded class="color-2">
            <v-list-item-group
                v-model="selectedTab"
                color="primary"
            >
              <v-list-item key="details" value="details" @click="setTab('details')">
                <v-list-item-icon>
                  <v-icon>mdi-account-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-title>Details</v-list-item-title>
                <v-list-item-icon>
                  <v-icon>mdi-chevron-right</v-icon>
                </v-list-item-icon>
              </v-list-item>
              <v-list-item key="alerts" value="alerts" @click="setTab('alerts')">
                <v-list-item-icon>
                  <v-icon>mdi-email-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  Alerts
                  <span>
                    ({{ userEmailAlerts.length }})
                  </span>
                </v-list-item-title>
                <v-list-item-icon>
                  <v-icon>mdi-chevron-right</v-icon>
                </v-list-item-icon>
              </v-list-item>
              <v-list-item key="saved" value="saved" @click="setTab('saved')">
                <v-list-item-icon>
                  <v-icon>mdi-content-save-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  Saved searches
                  <span>
                    ({{ userSavedSearches.length }})
                  </span>
                </v-list-item-title>
                <v-list-item-icon>
                  <v-icon>mdi-chevron-right</v-icon>
                </v-list-item-icon>
              </v-list-item>

            </v-list-item-group>
          </v-list>
        </v-card>
      </v-col>
      <v-col v-if="!!selectedTab" class="flex-grow-1">
        <v-btn rounded v-if="$vuetify.breakpoint.smAndDown" class="my-4" text @click="selectedTab = undefined">
          <v-icon left>mdi-arrow-left</v-icon>
          Back
        </v-btn>
        <div v-else class="pa-8"></div>
        <v-card rounded flat class="">
          <v-card-title class="color-2">
            <span class="">My {{ selectedTab?.replace("saved", "saved searches" ) }}</span>
          </v-card-title>

          <template v-if="selectedTab==='details'">
            <v-list>
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
          </template>


          <template v-if="selectedTab==='alerts'">
            <div v-if="userEmailAlerts.length === 0" class="pa-4 grey--text">
              You have no alerts set.
            </div>
            <v-list nav v-else>
              <v-list-item
                  v-for="alert in userEmailAlerts"
                  :key="alert.id"
              >
                <v-list-item-icon>
                  <v-icon>mdi-email-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title style="white-space: unset;">{{ alert.work_filter }}</v-list-item-title>
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


          <template v-if="selectedTab==='saved'">
            <div v-if="userSavedSearches.length === 0" class="pa-4 grey--text">
              You have no saved searches.
            </div>
            <v-list nav v-else>
              <user-saved-search
                  v-for="(savedSearch, i) in userSavedSearches"
                  :key="savedSearch.id"
                  :id="savedSearch.id"
                  :search-url="savedSearch.search_url"
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
    return {title: ["Account", this.selectedTab].join(" ")}
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
    selectedTab: {
      get() {
        return this.$route.params?.tab
      },
      set(to) {
        this.$router.push({
          name: "Me",
          params: {tab: to}
        })
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    setTab(name) {

    }


  },
  created() {
  },
  mounted() {
    if (this.$vuetify.breakpoint.mdAndUp && !this.selectedTab) {
      this.selectedTab =  "details"
    } else {

    }
    // this.$store.dispatch("user/fetchEmailAlerts")
    // this.$store.dispatch("user/fetchSavedSearches")
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