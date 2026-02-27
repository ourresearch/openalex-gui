<template>
  <v-container class="page" style="max-width: 800px;">
    <!-- Loading -->
    <div v-if="loading" class="text-center mt-12">
      <v-progress-circular indeterminate color="primary" size="48" />
      <div class="text-body-1 mt-4 text-medium-emphasis">Loading repository data...</div>
    </div>

    <!-- Error -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mt-8">
      {{ error }}
      <template v-slot:append>
        <router-link to="/repositories" class="text-body-2">Back to search</router-link>
      </template>
    </v-alert>

    <!-- Dashboard -->
    <template v-else-if="dashboard">
      <!-- Header -->
      <div class="mt-6 mb-6">
        <div class="d-flex align-center mb-1">
          <router-link to="/repositories" class="text-body-2 text-medium-emphasis mr-2">
            Repositories
          </router-link>
          <span class="text-medium-emphasis">/</span>
        </div>
        <div class="text-h4 font-weight-bold mb-2">{{ dashboard.display_name }}</div>
        <div v-if="dashboard.host_organization" class="text-body-1 text-medium-emphasis mb-1">
          {{ dashboard.host_organization }}
        </div>
        <div class="d-flex ga-4 flex-wrap">
          <a v-if="dashboard.homepage_url" :href="dashboard.homepage_url" target="_blank"
             class="text-body-2 d-inline-flex align-center">
            <v-icon size="small" class="mr-1">mdi-open-in-new</v-icon>
            Homepage
          </a>
          <router-link
            :to="`/sources/${dashboard.source_id}`"
            class="text-body-2 d-inline-flex align-center"
          >
            <v-icon size="small" class="mr-1">mdi-database</v-icon>
            View in OpenAlex
          </router-link>
        </div>
      </div>

      <!-- Not a repository warning -->
      <v-alert v-if="!dashboard.is_repository" type="info" variant="tonal" class="mb-6">
        This source is classified as "{{ dashboard.type }}", not a repository.
        Repository-specific harvesting data may not be available.
      </v-alert>

      <!-- Coverage Card -->
      <v-card variant="outlined" class="mb-6">
        <v-card-title class="text-h6">Coverage</v-card-title>
        <v-card-text>
          <v-table density="compact">
            <tbody>
              <tr>
                <td class="text-medium-emphasis" style="width: 60%;">Works in OpenAlex</td>
                <td class="text-right font-weight-medium">
                  {{ formatNumber(dashboard.works_count) }}
                </td>
              </tr>
              <template v-if="dashboard.repo_stats">
                <tr>
                  <td class="text-medium-emphasis">PMH records harvested</td>
                  <td class="text-right font-weight-medium">
                    {{ formatNumber(dashboard.repo_stats.total_records) }}
                  </td>
                </tr>
                <tr>
                  <td class="text-medium-emphasis pl-8">With DOI match</td>
                  <td class="text-right">
                    {{ formatNumber(dashboard.repo_stats.records_with_doi) }}
                  </td>
                </tr>
                <tr>
                  <td class="text-medium-emphasis pl-8">Without DOI</td>
                  <td class="text-right">
                    {{ formatNumber(dashboard.repo_stats.records_without_doi) }}
                  </td>
                </tr>
                <tr v-if="dashboard.repo_stats.last_record_date">
                  <td class="text-medium-emphasis">Last record date</td>
                  <td class="text-right">{{ dashboard.repo_stats.last_record_date }}</td>
                </tr>
              </template>
              <template v-else>
                <tr>
                  <td colspan="2" class="text-medium-emphasis text-body-2 py-4">
                    No harvesting data available. This repository may not yet be connected to our harvester.
                    <router-link to="/repositories/add">Add it here</router-link>.
                  </td>
                </tr>
              </template>
            </tbody>
          </v-table>

          <v-btn
            variant="text"
            color="primary"
            size="small"
            class="mt-2"
            @click="browsWorks"
          >
            Browse all works from this repository
            <v-icon end size="small">mdi-arrow-right</v-icon>
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- Endpoint Health Check Card -->
      <v-card variant="outlined" class="mb-6">
        <v-card-title class="text-h6">Endpoint Health Check</v-card-title>
        <v-card-text>
          <div v-if="!healthResult && !healthLoading" class="text-body-2 text-medium-emphasis mb-3">
            Test the OAI-PMH endpoint to verify it's responding correctly.
          </div>

          <div v-if="!pmhUrlInput" class="mb-3">
            <v-text-field
              v-model="customPmhUrl"
              label="OAI-PMH endpoint URL"
              placeholder="https://example.edu/oai"
              variant="outlined"
              density="compact"
              hide-details
            />
          </div>

          <v-btn
            :loading="healthLoading"
            :disabled="!effectivePmhUrl"
            variant="outlined"
            color="primary"
            size="small"
            @click="checkHealth"
          >
            {{ healthResult ? 'Re-check' : 'Check Endpoint Health' }}
          </v-btn>

          <!-- Health Results -->
          <div v-if="healthResult" class="mt-4">
            <div v-if="healthResult.identify" class="d-flex align-center mb-2">
              <v-icon
                :color="healthResult.identify.status === 'success' ? 'success' : 'error'"
                size="small"
                class="mr-2"
              >
                {{ healthResult.identify.status === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
              <span class="text-body-2">
                <strong>OAI-PMH Identify:</strong>
                {{ healthResult.identify.status === 'success' ? 'SUCCESS' : healthResult.identify.error || 'FAILED' }}
              </span>
            </div>
            <div v-if="healthResult.query" class="d-flex align-center mb-2">
              <v-icon
                :color="healthResult.query.status === 'success' ? 'success' : 'error'"
                size="small"
                class="mr-2"
              >
                {{ healthResult.query.status === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
              <span class="text-body-2">
                <strong>OAI-PMH ListRecords:</strong>
                {{ healthResult.query.status === 'success' ? 'SUCCESS' : healthResult.query.error || 'FAILED' }}
              </span>
            </div>
            <div v-if="healthResult.sample" class="mt-2">
              <div class="text-body-2 text-medium-emphasis mb-1">Sample record:</div>
              <v-sheet color="grey-lighten-4" rounded class="pa-3 text-body-2" style="overflow-x: auto; max-height: 200px;">
                <pre style="white-space: pre-wrap; margin: 0;">{{ healthResult.sample }}</pre>
              </v-sheet>
            </div>
          </div>

          <v-alert v-if="healthError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ healthError }}
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- Whitelisting Info -->
      <v-card variant="outlined" class="mb-6">
        <v-card-title class="text-h6">Whitelisting Our Harvester</v-card-title>
        <v-card-text class="text-body-2">
          <p class="mb-3">
            If your repository has firewall rules or bot protection, you may need to
            whitelist our harvester to ensure we can access your content.
          </p>
          <v-table density="compact">
            <tbody>
              <tr>
                <td class="text-medium-emphasis" style="width: 40%;">User-Agent</td>
                <td><code>OAI-PMH harvester (mailto:team@ourresearch.org)</code></td>
              </tr>
              <tr>
                <td class="text-medium-emphasis">Contact</td>
                <td>
                  <a href="mailto:team@ourresearch.org">team@ourresearch.org</a>
                  &mdash; we can provide IP ranges if needed
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>

      <!-- Contact -->
      <div class="text-center text-body-2 text-medium-emphasis mb-8">
        Something wrong?
        <a href="https://openalex.zendesk.com/hc/requests/new" target="_blank">Contact us</a>
      </div>
    </template>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'RepositoryDashboard' });

const route = useRoute();
const router = useRouter();

const dashboard = ref(null);
const loading = ref(true);
const error = ref(null);

// Health check state
const healthResult = ref(null);
const healthLoading = ref(false);
const healthError = ref(null);
const customPmhUrl = ref('');
const pmhUrlInput = ref(null);

const effectivePmhUrl = computed(() => pmhUrlInput.value || customPmhUrl.value);

useHead({
  title: computed(() => dashboard.value?.display_name ? `${dashboard.value.display_name} - Repository Dashboard` : 'Repository Dashboard'),
});

const formatNumber = (n) => {
  if (n === null || n === undefined) return '0';
  return Number(n).toLocaleString();
};

const browsWorks = () => {
  const sourceId = dashboard.value?.source_id;
  if (sourceId) {
    router.push(`/works?filter=primary_location.source.id:${sourceId}`);
  }
};

const fetchDashboard = async () => {
  const sourceId = route.params.sourceId;
  loading.value = true;
  error.value = null;

  try {
    const resp = await axios.get(
      `${urlBase.userApi}/repository-dashboard/${sourceId}`,
      axiosConfig()
    );
    dashboard.value = resp.data;
  } catch (e) {
    const msg = e.response?.data?.message || e.message || 'Failed to load dashboard data.';
    error.value = msg;
  } finally {
    loading.value = false;
  }
};

const checkHealth = async () => {
  const pmhUrl = effectivePmhUrl.value;
  if (!pmhUrl) return;

  healthLoading.value = true;
  healthError.value = null;
  healthResult.value = null;

  try {
    const resp = await axios.post(
      `${urlBase.userApi}/repository-requests/validate`,
      { pmh_url: pmhUrl },
      axiosConfig()
    );
    healthResult.value = resp.data;
  } catch (e) {
    healthError.value = e.response?.data?.message || 'Health check failed.';
  } finally {
    healthLoading.value = false;
  }
};

onMounted(() => {
  fetchDashboard();
});
</script>
