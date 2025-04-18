<template>
  <v-container class="d-flex align-center justify-center" style="min-height: 70vh;">
    <v-card flat class="pa-6 rounded-xl" max-width="560">
      <div class="text-center mb-4">
        <v-icon color="primary" size="48">mdi-flask</v-icon>
        <h1 class="mb-2 font-weight-bold">OpenAlex Analytics Alpha Testing</h1>
      </div>
      <v-divider class="mb-4"></v-divider>
      <div>
        <p>
          OpenAlex Analytics is currently available to invited alpha testers.
          If you'd like to request an invitation, please send an email to
          <span class="font-weight-medium primary--text">
            <a href="mailto:brett@openalex.org">brett@openalex.org</a>
          </span>
          including:
        </p>
        <ul>
          <li>A short description of your work, role, and what you hope OpenAlex Analytics can help you with.</li>
          <li>The email address associated with your OpenAlex account.</li>
        </ul>
      </div>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: "AnalyticsTesting",
  components: {
    
  }
}
</script>