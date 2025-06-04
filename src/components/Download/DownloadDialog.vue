<template>
  <v-card>
    <!-- Dialog Header -->
    <v-toolbar flat>
      <v-toolbar-title>Export to CSV</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="closeDialog">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- Dialog Body -->
    <v-card-text class="text-body-1" :loading="isLoading">
      <div v-if="!userId" class="text-center">
        <p>To download large datasets, please login or create an account.</p>
        <v-btn color="primary" class="mr-2" @click="openLogin">Login</v-btn>
        <v-btn color="secondary" @click="openSignup">Sign Up</v-btn>
      </div>

      <div v-else>
        <p v-if="!exportStarted">
          Exporting {{ filters.millify(resultsCount) }} results may take up to {{ estimatedTime }}.
          You’ll be notified by email when your CSV is ready to download.
        </p>
        <p v-if="exportStarted">{{ exportMessage }}</p>
        
        <div v-if="!exportStarted" class="mt-6 text-right">
          <v-btn color="primary" @click="createExport">Export</v-btn>
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
        </div>
        <div v-else class="mt-3 text-right">
          <v-btn variant="text" @click="closeDialog">Close</v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>


<script>

import { mapMutations, mapGetters } from "vuex";
import {api} from "@/api" 
import filters from "@/filters";

export default {
  name: "DownloadDialog",
  props: {
    resultsCount: Number,
    isOpen: false,
  },
  data() {
    return {
      exportStarted: false,
      exportMessage: "",
      isLoading: false,
      filters,
    };
  },
  computed: {
    ...mapGetters("user", [
      "userId",
      "userEmail",
    ]),
    ...mapGetters("search", [
      "query"
    ]),
    estimatedTime() {
      if (this.resultsCount <= 10_000) return "5 minutes"
      if (this.resultsCount <= 1_000_000) return "10 minutes"
      if (this.resultsCount <= 10_000_000) return "20 minutes"
      if (this.resultsCount <= 50_000_000) return "2 hours"
      if (this.resultsCount <= 300_000_000) return "5 hour"
      return "a day"; // Default for extremely large datasets
    },
  },
  methods: {
    ...mapMutations("user", [
      "setIsSignupDialogOpen",
      "setIsLoginDialogOpen",
    ]),
    closeDialog() {
      this.$emit("close");
    },
    openLogin() {
      this.setIsLoginDialogOpen(true);
    },
    openSignup() {
      this.setIsSignupDialogOpen(true);
    },
    resetState() {
      this.exportStarted = false;
      this.exportMessage = "";
    },
    async createExport() {
      try {
        this.exportMessage = "Processing your export request...";
        this.isLoading = true;
        this.exportStarted = true;
        await api.createExport(this.query, this.userEmail);
        this.isLoading = false;
        this.exportMessage =
          "Your export has been initiated. You will receive an email when it is ready to download.";
        this.exportStarted = true;
      } catch (error) {
        console.error("Export failed:", error);
        this.exportMessage = "An error occurred while processing your request. Please try again.";
      }
    },
  },
  watch: {
    isOpen(newValue) {
      if (!newValue) {
        this.resetState()
      }
    },
  },
};
</script>


<style scoped>
.text-center {
  text-align: center;
}
</style>