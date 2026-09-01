<template>
  <v-container class="page" style="max-width: 700px;">
    <div class="d-flex align-center mb-1">
      <router-link to="/repositories" class="text-body-2 text-medium-emphasis mr-2">
        Repositories
      </router-link>
      <span class="text-medium-emphasis">/</span>
    </div>

    <div class="text-h4 font-weight-bold mb-2 mt-4">Add Your Repository</div>

    <v-card variant="tonal" class="pa-6 mt-4">
      <div class="text-body-1 mb-3">
        To get your repository harvested by OpenAlex, email
        <a href="mailto:support@openalex.org?subject=Add%20my%20repository">support@openalex.org</a>
        with:
      </div>
      <ul class="text-body-1 ml-6 mb-4">
        <li>your <strong>OAI-PMH endpoint URL</strong> (e.g. <code>https://example.edu/oai</code>)</li>
        <li>the <strong>set</strong> to harvest, if your endpoint serves more than one collection</li>
        <li>your repository's name and homepage</li>
      </ul>
      <div class="text-body-2 text-medium-emphasis">
        We read every message. Once your repository is connected, its source page's
        Harvest tab shows the endpoint we harvest, last-harvest status, and a
        next-harvest countdown — no account needed.
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
// Registration form retired 2026-09-01 (oxjob #804 follow-up): submissions went
// to a passive inbox (users-api repository_requests) nobody worked. Intake is
// now a support ticket, handled by the agent SOP against the live registry.
defineOptions({ name: 'RepositoryAdd' });
</script>
