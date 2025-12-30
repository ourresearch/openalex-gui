<template>
  <span>
    <v-tooltip location="top">
      <template v-slot:activator="{props}">
          <v-btn v-bind="props" icon @click="openExportDialog">
            <v-icon color="grey-darken-1">mdi-tray-arrow-down</v-icon>
          </v-btn>
      </template>
      <div v-if="isResultsExportDisabled">
        Too many items to download (max 100k)
      </div>
      <div v-else-if="!isLoggedIn">
        Log in to export results
      </div>
      <div v-else>Export results</div>
    </v-tooltip>

    <!-- Sign in required dialog -->
    <v-dialog v-model="showSignInDialog" max-width="400">
      <v-card>
        <div class="d-flex align-center pa-4 pb-0">
          <span class="text-h6">Sign in required</span>
          <v-spacer />
          <v-btn icon variant="text" size="small" @click="showSignInDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider class="mt-3" />
        <v-card-text class="pt-4">
          You need a user account in order to export results. Sign up is free and takes less than one minute.
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            color="primary"
            rounded
            @click="goToSignUp"
          >
            Sign up for free
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Export dialog for logged-in users -->
    <v-dialog v-model="showExportDialog" max-width="420" :persistent="exportState === 'submitted'">
      <v-card>
        <!-- Header -->
        <div class="d-flex align-center pa-4 pb-0">
          <span class="text-h6">
            {{ exportState === 'submitted' ? 'Export submitted' : 'Export results' }}
          </span>
          <v-spacer />
          <v-btn icon variant="text" size="small" @click="closeExportDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider class="mt-3" />

        <!-- Pre-submission state -->
        <template v-if="exportState === 'initial'">
          <v-card-text class="pt-4">
            <div class="mb-4 text-body-2" v-if="rateLimitData && !hasInsufficientTokens">
              Exporting these {{ resultsCount.toLocaleString() }} rows will consume 
              {{ queriesNeeded.toLocaleString() }} of your remaining 
              {{ rateLimitData.remaining.toLocaleString() }} query tokens today.
            </div>
            <div class="mb-4 text-body-2 text-error" v-else-if="rateLimitData && hasInsufficientTokens">
              This export requires {{ queriesNeeded.toLocaleString() }} query tokens, 
              but you only have {{ rateLimitData.remaining.toLocaleString() }} remaining today.
            </div>
            <div class="mb-4 text-body-2" v-else>
              Exporting {{ resultsCount.toLocaleString() }} rows.
            </div>

            <v-select
              v-model="exportFormat"
              label="Select format"
              :items="formatOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
            />

            <v-checkbox
              v-model="includeAbstracts"
              label="Include abstracts (increases download size)"
              density="compact"
              hide-details
              class="mt-4"
            />
          </v-card-text>
          <v-card-actions class="pa-4 pt-2">
            <v-spacer />
            <v-btn variant="text" @click="closeExportDialog">Cancel</v-btn>
            <v-btn
              color="primary"
              rounded
              :disabled="!exportFormat || hasInsufficientTokens"
              @click="startExport"
            >
              Start export
            </v-btn>
          </v-card-actions>
        </template>

        <!-- Post-submission state -->
        <template v-else-if="exportState === 'submitted'">
          <v-card-text class="pt-4">
            <div class="mb-3">
              <template v-if="submittedExport?.queue_position === 1 || submittedExport?.status === 'running'">
                Your export is running now.
              </template>
              <template v-else-if="submittedExport?.queue_position">
                You are position <strong>{{ submittedExport.queue_position }}</strong> of 
                <strong>{{ submittedExport.queue_total }}</strong> in the queue.
              </template>
              <template v-else>
                Your export has been queued.
              </template>
            </div>
            <div>
              You can track your export's progress in 
              <router-link :to="{ name: 'settings-exports' }">Settings → Exports</router-link>.
            </div>
          </v-card-text>
          <v-card-actions class="pa-4 pt-2">
            <v-spacer />
            <v-btn color="primary" rounded @click="closeExportDialog">
              Done
            </v-btn>
          </v-card-actions>
        </template>
      </v-card>
    </v-dialog>
  </span>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

const store = useStore();
const route = useRoute();
const router = useRouter();

// Dialog state
const showSignInDialog = ref(false);
const showExportDialog = ref(false);
const exportState = ref('initial'); // 'initial' or 'submitted'
const exportFormat = ref(null);
const rateLimitData = ref(null);
const submittedExport = ref(null);
const includeAbstracts = ref(false);

// Default columns for export (will be user-configurable in future)
const defaultColumns = [
  'id',
  'doi',
  'ids.pmid',
  'display_name',
  'publication_year',
  'publication_date',
  'type',
  'language',
  'is_retracted',
  'cited_by_count',
  'fwci',
  'open_access.is_oa',
  'open_access.oa_status',
  'best_oa_location.license',
  'primary_location.source.display_name',
  'primary_location.source.id',
  'primary_location.source.issn_l',
  'primary_location.source.type',
  'authorships.author.display_name',
  'authorships.author.id',
  'authorships.author.orcid',
  'authorships.is_corresponding',
  'corresponding_institution_ids',
  'authorships.institutions.display_name',
  'authorships.institutions.id',
  'authorships.countries',
  'primary_topic.display_name',
  'funders.display_name',
];

// Format options
const formatOptions = [
  { label: 'CSV (Excel-optimized)', value: 'csv-excel' },
  { label: 'CSV (standard)', value: 'csv' },
  { label: 'Endnote', value: 'ris' },
  { label: 'Text', value: 'wos-plaintext' },
];

// Computed
const resultsCount = computed(() => store.state?.resultsObject?.meta?.count ?? 0);
const userId = computed(() => store.getters['user/userId']);
const userApiKey = computed(() => store.getters['user/apiKey']);
const isLoggedIn = computed(() => !!userId.value);
const isResultsExportDisabled = computed(() => resultsCount.value > 100000);
const queriesNeeded = computed(() => Math.ceil(resultsCount.value / 10));
const hasInsufficientTokens = computed(() => {
  if (!rateLimitData.value) return false;
  return queriesNeeded.value > rateLimitData.value.remaining;
});

// Methods
function openExportDialog() {
  if (!isLoggedIn.value) {
    showSignInDialog.value = true;
    return;
  }
  
  // Reset state
  exportState.value = 'initial';
  exportFormat.value = null;
  submittedExport.value = null;
  includeAbstracts.value = false;
  showExportDialog.value = true;
  
  // Fetch rate limit data
  fetchRateLimit();
}

function closeExportDialog() {
  showExportDialog.value = false;
  exportState.value = 'initial';
  exportFormat.value = null;
  submittedExport.value = null;
}

function goToSignUp() {
  showSignInDialog.value = false;
  router.push({ name: 'Signup', query: { redirect: route.fullPath } });
}

async function fetchRateLimit() {
  if (!userApiKey.value) return;
  
  try {
    const resp = await axios.get(
      `https://api.openalex.org/rate-limit?api_key=${userApiKey.value}`
    );
    rateLimitData.value = resp.data.rate_limit;
  } catch (err) {
    console.error('Failed to fetch rate limit:', err);
    rateLimitData.value = null;
  }
}

async function startExport() {
  const filterStr = route.query.filter;
  
  // Determine actual format and truncate setting
  let actualFormat = exportFormat.value;
  let truncate = false;
  
  if (exportFormat.value === 'csv-excel') {
    actualFormat = 'csv';
    truncate = true;
  }
  
  // Build columns list
  const columns = [...defaultColumns];
  if (includeAbstracts.value) {
    columns.push('abstract');
  }
  
  const params = new URLSearchParams({
    filter: filterStr,
    format: actualFormat,
    truncate: truncate,
    columns: columns.join(','),
  });
  
  // Include XPAC works if the parameter is set in the URL
  if (route.query.include_xpac === 'true') {
    params.set('include_xpac', 'true');
  }

  try {
    const resp = await axios.get(
      `${urlBase.userApi}/export/works?${params.toString()}`,
      axiosConfig({ userAuth: true })
    );
    console.log('startExport resp:', resp);
    submittedExport.value = resp.data;
    exportState.value = 'submitted';
  } catch (error) {
    console.error('Export failed:', error);
    store.commit('snackbar', 'Export failed. Please try again.');
    closeExportDialog();
  }
}
</script>
