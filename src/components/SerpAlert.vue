<template>
  <div>
    <v-btn icon @click="isDialogOpen = true">
      <v-icon>mdi-bell-outline</v-icon>
    </v-btn>
    <v-dialog
              v-model="isDialogOpen" max-width="600"

              :loading="isLoading">
      <v-card rounded :loading="isLoading">
        <v-card-title>
          <v-icon left>mdi-bell-outline</v-icon>
          Create alert
        </v-card-title>
        <v-card-subtitle class="pt-2">

          Get an email when new works appear in these search results.
        </v-card-subtitle>
        <v-card-text class="pb-0" style="min-height: 75px;">
          <v-alert v-if="velocityPermitsAlerts && !isLoading" class="" type="info" text rounded>
            Expected frequency:
            <span class="font-weight-bold">
              <template v-if="velocityObj?.week > 14">
                daily
              </template>
              <template v-else-if="velocityObj?.week > 7">
                weekly
              </template>
              <template v-else-if="velocityObj?.month > 2">
                monthly
              </template>
              <template v-else>
                yearly or less
              </template>

            </span>
          </v-alert>
          <v-alert v-if="!isLoading && !velocityPermitsAlerts" class="" type="error" text rounded>
            This search is too active for alerts.
          </v-alert>

        </v-card-text>


        <v-card-actions class="">
          <v-spacer></v-spacer>
          <v-btn text rounded @click="isDialogOpen = false">Cancel</v-btn>
          <v-btn rounded color="primary" @click="create" :disabled="!velocityPermitsAlerts || isLoading">Create alert</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";

const userApiBaseUrl = "https://user.openalex.org"


export default {
  name: "SerpAlert",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
      isLoading: false,
      isDialogOpen: false,
      velocityObj: null,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "inputFiltersAsString",
    ]),
    ...mapGetters("user", [
      "userEmail",
    ]),
    velocityPermitsAlerts() {
      return this.velocityObj?.week < 100
    },
    velocityString() {
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    async create() {
      this.isLoading = true
      const args = {
        filter: this.$route.query.filter
      }
      await this.$store.dispatch("user/createEmailAlert", args)
      this.isLoading = false
      this.snackbar("Email alert created")
      this.isDialogOpen = false
    },
    async getVelocityObj() {
      this.isLoading = true
      const filterStr = this.$route.query.filter ?? "open_access.is_oa:true|false|null" // needs a filter value or breaks
      const userApiBaseUrl = "https://user.openalex.org"
      const url = userApiBaseUrl + `/alert/work/${filterStr}/velocity`;
      const resp = await axios.get(url)
      this.velocityObj = resp.data
      this.isLoading = false
    }
  },
  created() {
  },
  mounted() {
  },
  watch: {
    isDialogOpen(to, from) {
      this.getVelocityObj()
    }
  }
}
</script>

<style scoped lang="scss">

</style>