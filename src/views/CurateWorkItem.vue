<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <v-breadcrumbs :items="breadcrumbs" divider="›" class="px-0 mt-n10" />
      
      <div v-if="editingWork">
          
        <div class="text-h4 mb-1 d-flex">
          <div>{{ editingWork.display_name }}</div>
          <v-spacer></v-spacer>
          <v-menu 
            teleport="body" 
            scroll-strategy="none" 
            location="bottom end"
            :contained="false"
            :absolute="false"
          >
            <template #activator="{ props }">
              <v-btn icon variant="text" size="large" density="comfortable" v-bind="props">
                <v-icon icon="mdi-dots-vertical" color="grey-darken-2"></v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-list class="text-grey-darken-3" style="font-size: 16px;">
                <v-list-item prepend-icon="mdi-file-document-outline" :href="`https://openalex.org/${editingWork.id}`" target="_blank">
                  Work profile
                  <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                </v-list-item>
                <v-list-item prepend-icon="mdi-api" :href="`https://api.openalex.org/${editingWork.id}?data-version=2`" target="_blank">
                  New API
                  <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                </v-list-item>
                <v-list-item prepend-icon="mdi-api" :href="`https://api.openalex.org/${editingWork.id}`" target="_blank">
                  Old API
                  <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                </v-list-item>
                <v-list-item prepend-icon="mdi-api" :href="`https://api.unpaywall.org/v2/${editingWork.doi.replace('https://doi.org/', '')}?email=team@ourresearch.org`" target="_blank">
                  Unpaywall API
                  <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                </v-list-item>
                <v-list-item prepend-icon="mdi-home-outline" :href="`${editingWork.doi}`" target="_blank">
                  DOI
                  <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>

        <div class="text-grey-darken-2 text-body-2 mb-4">
          {{ editingWork.publication_year }}
          <span style="margin: 0 2px;">•</span>
          {{ editingWork.type }}
          <span style="margin: 0 2px;">•</span>
          <a :href="editingWork.doi" target="_blank" class="text-decoration-none" style="color:inherit;">{{ editingWork.doi.replace('https://doi.org/', '') }}</a>
        </div>
      
      </div>

      <v-card flat rounded="xl" class="pa-4">   
        <v-skeleton-loader
          v-if="!editingWork && !errorMessage"
          type="list-item-two-line@2"
          class="mb-4"
        />
        <div v-else-if="errorMessage" class="text-grey-darken-1 py-4">
          {{ errorMessage }}
        </div>

        <div v-else>
          <v-card-text>

            <div v-if="editingWork.best_oa_location && editingWork.best_oa_location.id !== editingWork.primary_location.id" class="mb-10">
              <div class="location-title">
                Best Open Access location
              </div>
              <LocationForm 
                :location="editingWork.best_oa_location" 
                :pendingCorrections="pendingCorrections" 
                :isAcademicNetwork="isAcademicNetwork"
                @submitCorrection="submitCorrection"
              />
            </div>

            <div>
              <div class="location-title">
                {{ editingWork.primary_location.id !== editingWork.best_oa_location?.id ? 'Primary location' : 'Primary & Best Open Access location' }}
              </div>
              <LocationForm 
                :location="editingWork.primary_location" 
                :pendingCorrections="pendingCorrections" 
                :isAcademicNetwork="isAcademicNetwork"
                @submitCorrection="submitCorrection"
              />
            </div>

            <div v-if="additionalLocations.length" class="mt-4">
              <div v-if="!showAdditionalLocations">
                <v-btn variant="text" size="small" color="grey-darken-1" style="margin-left: -14px;" @click="showAdditionalLocations = true">
                  Show {{ additionalLocations.length }} additional {{ additionalLocations.length === 1 ? 'location' : 'locations' }}
                  <v-icon icon="mdi-menu-down" color="grey"></v-icon>
                </v-btn>
              </div>
              <div v-else>
                <div v-for="location in additionalLocations" :key="location.id" class="mt-10">
                  <LocationForm 
                    :location="location" 
                    :pendingCorrections="pendingCorrections" 
                    :isAcademicNetwork="isAcademicNetwork"
                    @submitCorrection="submitCorrection"
                  />
                </div>
              </div>

              <v-btn color="blue" variant="flat" rounded class="mt-6" @click="showNewLocationDialog = true">
              Add new location
            </v-btn>
            </div>
          </v-card-text>
        </div>
      </v-card>

    </v-container>

    <!-- New location dialog -->
    <v-dialog v-model="showNewLocationDialog" width="700">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            Add new location
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="showNewLocationDialog = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
        <v-card-text>
          <div class="dialog-field mb-6">
            <div class="dialog-field-label">
              Is Open Access
              <v-tooltip text="Whether this location provides Open Access or is behind a paywall." location="bottom">
                <template #activator="{ props }">
                  <v-icon icon="mdi-information-outline" color="grey" size="small" class="ml-1" v-bind="props"></v-icon>
                </template>
              </v-tooltip>
            </div>
            <div class="dialog-field-input">
              <v-radio-group v-model="newLocationIsOa" inline hide-details>
                <v-radio label="Open Access" :value="true"></v-radio>
                <v-radio label="Closed Access" :value="false"></v-radio>
              </v-radio-group>
            </div>
          </div>

          <div class="dialog-field mb-6">
            <div class="dialog-field-label">
              Landing Page URL
              <v-tooltip text="The URL of the landing page for this work where the full text HTML might be found." location="bottom">
                <template #activator="{ props }">
                  <v-icon icon="mdi-information-outline" color="grey" size="small" class="ml-1" v-bind="props"></v-icon>
                </template>
              </v-tooltip>
            </div>
            <div class="dialog-field-input">
              <v-text-field 
                v-model="newLocationLandingPageUrl" 
                variant="solo-filled"
                bg-color="grey-lighten-3"
                rounded
                flat
                hide-details
                placeholder="https://example.com/article"></v-text-field>
            </div>
          </div>

          <div class="dialog-field mb-6">
            <div class="dialog-field-label">
              PDF URL
              <v-tooltip text="The open access URL where the full text PDF for this work can be found." location="bottom">
                <template #activator="{ props }">
                  <v-icon icon="mdi-information-outline" color="grey" size="small" class="ml-1" v-bind="props"></v-icon>
                </template>
              </v-tooltip>
            </div>
            <div class="dialog-field-input">
              <v-text-field 
                v-model="newLocationPdfUrl" 
                variant="solo-filled"
                bg-color="grey-lighten-3"
                rounded
                flat
                hide-details
                placeholder="https://example.com/article.pdf"></v-text-field>
            </div>
          </div>

          <div class="dialog-field mb-4">
            <div class="dialog-field-label">
              License
              <v-tooltip text="The license under which this work is published." location="bottom">
                <template #activator="{ props }">
                  <v-icon icon="mdi-information-outline" color="grey" size="small" class="ml-1" v-bind="props"></v-icon>
                </template>
              </v-tooltip>
            </div>
            <div class="dialog-field-input">
              <v-select 
                v-model="newLocationLicense" 
                variant="solo-filled"
                bg-color="grey-lighten-3"
                rounded
                flat
                hide-details
                placeholder="Select a license"
                :items="licenses"></v-select>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" @click="showNewLocationDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded :disabled="!isNewLocationFormValid" @click="addNewLocation">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

import axios from 'axios';
import ShortUniqueId from 'short-uuid';

import { urlBase } from '@/apiConfig';
import LocationForm from '@/components/Curation/LocationForm.vue';

const { workId } = defineProps({
  workId: {
    type: String,
    required: true
  }
})

useHead({ title: 'Unpaywall Work Curation: ' + workId });

const store = useStore();
const router = useRouter();

const correctionsHost = urlBase.correctionsApi;

const pendingCorrections = ref([]);

const editingWork = ref(null);

const newLocationIsOa = ref(true);
const newLocationPdfUrl = ref(null);
const newLocationLandingPageUrl = ref(null);
const newLocationLicense = ref(null);

const email = computed(() => store.getters['user/userEmail']);
const isLibrarian = computed(() => store.getters['user/isLibrarian']);
const isAcademicNetwork = ref(false);

const showAdditionalLocations = ref(false);
const showNewLocationDialog = ref(false);

const errorMessage = ref(null);

const snackbar = (val) => store.commit('snackbar', val);

// Preserve previous search query params in breadcrumbs
const worksBackUrl = (() => {
  const history = router.options.history;
  const previousRoute = history.state?.back;
  if (previousRoute?.includes('/curate/works') && !previousRoute.includes('/curate/works/')) {
    return previousRoute;
  }
  return '/curate/works';
})();

const breadcrumbs = [
  { title: 'Curate', to: '/curate' },
  { title: 'Works', to: worksBackUrl },
  { title: workId, to: '/curate/works/' + workId, disabled: true },
];

const getWork = async () => {
  try {
    const response = await axios.get(`https://api.openalex.org/works/${workId}?data-version=2`);
    editingWork.value = response.data;
  } catch (error) {
    errorMessage.value = `Work ${workId} not found.`;
  }
}

const additionalLocations = computed(() => {
  if (!editingWork.value) return [];

  const topLocations = [editingWork.value.primary_location.id];
  if (editingWork.value.best_oa_location) {
    topLocations.push(editingWork.value.best_oa_location.id);
  }
  return editingWork.value.locations.filter(location => !topLocations.includes(location.id));
});

const licenses = [
  { title: "CC BY", value: "cc-by" },
  { title: "CC BY-SA", value: "cc-by-sa" },
  { title: "CC BY-ND", value: "cc-by-nd" },
  { title: "CC BY-NC-ND", value: "cc-by-nc-nd" },
  { title: "CC BY-NC", value: "cc-by-nc" },
  { title: "CC BY-NC-SA", value: "cc-by-nc-sa" },
  { title: "Public domain (CC0)", value: "public-domain" },
  { title: "MIT", value: "mit" },
  { title: "GNU GPLv3", value: "gpl-v3" },
  { title: "Apache License 2.0", value: "apache-2-0" },
  { title: "ISC License", value: "isc" },
  { title: "Publisher specific open access", value: "publisher-specific-oa" },
  { title: "Other open access", value: "other-oa" },
  { title: "None", value: null }
];

const isNewLocationFormValid = computed(() => {
  return isValidUrl(newLocationLandingPageUrl.value) && (isValidUrl(newLocationPdfUrl.value) || !newLocationPdfUrl.value);
});

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

const addNewLocation = () => {
  
  const newLocationValues = {
      "is_oa": newLocationIsOa.value,
      "landing_page_url": newLocationLandingPageUrl.value,
      "pdf_url": newLocationPdfUrl.value,
      "license": newLocationLicense.value,
      "work_id": editingWork.value.id,
      "title": editingWork.value.title
  };

  const newLocationJson = JSON.stringify(newLocationValues);

  const shortUUID = ShortUniqueId();
  const newId = "openalex_curation:" + shortUUID.new();

  const partialPayload = {
    "entity_id": newId,
    "property": null,
    "property_value": newLocationJson,
    "create_new": true
  };
  submitCorrection(partialPayload);
  showNewLocationDialog.value = false;
}

const submitCorrection = (partialPayload) => {
  const apiEndpoint = `${correctionsHost}/v2/corrections`;

  if (!partialPayload.entity_id) {
    snackbar("No entity ID provided for available.");
    return;
  }

  try {
    const payload = {
      "status": isLibrarian.value ? "approved" : "needs-moderation",
      "entity": "locations",
      "entity_id": partialPayload.entity_id,
      "property": partialPayload.property,
      "property_value": partialPayload.property_value,
      "create_new": partialPayload.create_new,
      "submitter_email": email.value,
      "moderator_email": isLibrarian.value ? email.value : null,
    };
    axios.post(apiEndpoint, payload);
    snackbar("Your correction has been received and will be processed within a few days. Thank you for your help.");
    pendingCorrections.value.push(partialPayload.entity_id + "|" + partialPayload.property);
  } catch (e) {
    const errData = e.response && e.response.data;
    console.error('Error submitting correction:', errData);
    snackbar("There was an error submitting your correction. Please try again later.");
  }
}

const extractId = (id) => {
  if (id.startsWith('https://openalex.org/')) {
    return id.replace('https://openalex.org/', '');
  }
  return id;
}

const getPendingCorrections = async () => {
  try {
    const apiEndpoint = `${correctionsHost}/v2/pending`;
    const response = await axios.get(apiEndpoint);
    pendingCorrections.value = response.data;
  } catch (error) {
    console.error('Error fetching pending corrections:', error);
  }
};

async function getIP() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    const data = response.data;
    return data.ip;
  } catch (error) {
    return null;
  }
}

async function checkAcademicNetwork() {
  const ip = await getIP();
  if (ip) {
    const response = await axios.get(`https://api.ipregistry.co/${ip}?key=ira_eSftkFvhJ5DjGZ7GRIJHXqmo4Wm1122x74ob`);
    const data = response.data;
    isAcademicNetwork.value = data.company.type === "education";
  }
}

getPendingCorrections();
getWork();
checkAcademicNetwork();

</script>


<style scoped>
.location-title {
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: bold;
  color: #9e9e9e;
}
.dialog-field {
  display: flex;
  align-items: center;
  gap: 16px;
}
.dialog-field-label {
  flex-shrink: 0;
  width: 180px;
  font-weight: bold;
  color: #555;
  display: flex;
  align-items: center;
}
.dialog-field-input {
  flex: 1;
  min-width: 0;
}
</style>
