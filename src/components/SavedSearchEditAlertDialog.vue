<template>
  <v-dialog v-model="isOpen" max-width="300">
      <v-card flat rounded :loading="isLoading"  v-if="userId">
        <v-card-title>
          <v-icon start>{{ hasAlert ? "mdi-bell-minus" : "mdi-bell-plus "}}</v-icon>
          {{ hasAlert ? "Remove alert?" : "Create alert?" }}
        </v-card-title>
        <v-card-text>
          <template v-if="hasAlert">
            You'll no longer get emails when new results appear in this search.
          </template>
          <template v-else>
            You'll get an email when new results appear in this search.
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="isOpen = false">Cancel</v-btn>
          <v-btn variant="flat" rounded color="primary" @click="toggleAlerts">
            {{ hasAlert ? "Remove alert" : "Create alert"}}
          </v-btn>
        </v-card-actions>
      </v-card>
    <v-card v-else flat rounded>
      <v-card-title>Login required</v-card-title>
      <v-card-text>
        You have to login edit alerts.
      </v-card-text>
      <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded to="/login">Log in</v-btn>
          <v-btn variant="text" rounded color="primary" to="signup">Sign up</v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "SavedSearchEditAlertDialog",
  components: {},
  props: {
  },
  data() {
    return {
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters("user", [
       "userSavedSearches",
    ]),
    ...mapGetters("user", [
      "userId",
      "renameId",
      "editAlertId",
    ]),
    isOpen: {
      get(){return !!this.editAlertId},
      set(to){
        return this.$store.commit("user/setEditAlertId", to)
      }
    },
    hasAlert(){
      return this.userSavedSearches.find(s => s.id === this.editAlertId)?.has_alert
    },
  },
  methods: {
    ...mapMutations("user", [
      "setEditAlertId",
    ]),
    ...mapActions("user", [
        "updateSearchDescription",
    ]),
    async toggleAlerts(){
      this.isLoading = true
      console.log("toggle alerts", this.editAlertId)
      await this.$store.dispatch("user/updateSearchAlert", {
        id: this.editAlertId,
        has_alert: !this.hasAlert,
      })
      this.isLoading = false
      this.isOpen = false
    },
  },
}
</script>


<style scoped lang="scss">

</style>