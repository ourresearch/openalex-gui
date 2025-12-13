<template>
  <div class="py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <v-breadcrumbs :items="breadcrumbs" divider="›" class="px-0 mt-n10" />
        
      <div class="text-h4 mb-4 d-flex" style="min-height: 44px;">
        <div>{{ editingWork?.display_name || "Loading..." }}</div>
        <v-spacer></v-spacer>
        
        <!-- Dots Menu -->
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

      <div class="mb-2">
        <v-btn :variant="tab === 'basic' ? 'flat' : 'text'" :color="tab === 'basic' ? 'blue-lighten-1' : 'grey-darken-2'" class="rounded-pill mr-2" @click="tab = 'basic'">
          Basic Metadata
        </v-btn>
        <v-btn :variant="tab === 'locations' ? 'flat' : 'text'" :color="tab === 'locations' ? 'blue-lighten-1' : 'grey-darken-2'" class="rounded-pill" @click="tab = 'locations'">
          Locations
          <v-tooltip text="Locations where this work is hosted on the web" location="bottom">
            <template #activator="{ props }">
              <v-icon icon="mdi-information-outline" :color="tab === 'locations' ? 'white' : 'grey-darken-2'" size="small" style="margin-left: 2px;" v-bind="props"></v-icon>
            </template>
          </v-tooltip>
        </v-btn>
      </div>

      <v-card flat rounded="xl" class="pa-4 pt-2">   
        <v-skeleton-loader v-if="!editingWork" type="list-item-two-line@3"></v-skeleton-loader>
        
        <div v-else-if="errorMessage" class="text-grey-darken-1 py-4">
          {{ errorMessage }}
        </div>

        <div v-else>
          <v-card-text class="pt-6" style="font-size: 16px;">

            <template v-if="tab === 'basic'">
              <div class="field mt-2">
                <div class="field-label">Type:</div>
                <div class="field-value">
                  {{ editingWork.type }}
                </div>
              </div>
              <div class="field">
                <div class="field-label">Publication Year:</div>
                <div class="field-value">
                  {{ editingWork.publication_year }}
                </div>
              </div>
              <div class="field">
                <div class="field-label">Language:</div>
                <div class="field-value">
                  {{ editingWork.language }}
                </div>
              </div>
              <div class="field">
                <div class="field-label">DOI:</div>
                <div class="field-value">
                  <a :href="editingWork.doi" target="_blank" class="text-decoration-none" style="color:inherit;">{{ editingWork.doi.replace('https://doi.org/', '') }}</a>
                </div>
              </div>

            </template>

            <template v-else-if="tab === 'locations'">
              <div v-if="editingWork.best_oa_location && editingWork.best_oa_location.id !== editingWork.primary_location.id" class="mb-4">
                <LocationForm 
                  :location="editingWork.best_oa_location"
                  :titleChips="['best_oa']"
                  :pendingCorrections="pendingCorrections" 
                  :isAcademicNetwork="isAcademicNetwork"
                  @submitCorrection="submitCorrection"
                />
              </div>

              <div>
                <LocationForm 
                  :location="editingWork.primary_location" 
                  :titleChips="editingWork.primary_location.id !== editingWork.best_oa_location?.id ? ['primary'] : ['primary', 'best_oa']"
                  :pendingCorrections="pendingCorrections" 
                  :isAcademicNetwork="isAcademicNetwork"
                  @submitCorrection="submitCorrection"
                />
              </div>

              <div v-for="location in additionalLocations" :key="location.id" class="mt-4">
                <LocationForm 
                  :location="location" 
                  :pendingCorrections="pendingCorrections" 
                  :isAcademicNetwork="isAcademicNetwork"
                  @submitCorrection="submitCorrection"
                />
              </div>

              <v-card color="grey-lighten-4" variant="flat" rounded="xl" class="pa-6 mt-4" v-ripple @click="showNewLocationDialog = true">
                <v-icon icon="mdi-plus" size="large" color="grey"></v-icon>
                Add new location
              </v-card>              
            </template>

          </v-card-text>
        </div>
      </v-card>

    </v-container>

    <!-- New Location Dialog -->
    <v-dialog v-model="showNewLocationDialog" width="600">
      <v-card flat rounded="xl" class="pa-2">
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
          <div class="dialog-field mb-4">
            <div class="dialog-field-input">
              <v-radio-group v-model="newLocationIsOa" inline hide-details>
                <v-radio label="Open Access" :value="true"></v-radio>
                <v-radio label="Closed Access" :value="false"></v-radio>
              </v-radio-group>
            </div>
          </div>

          <div class="dialog-field mb-6"> 
            <div class="dialog-field-input">
              <div v-if="newLocationSourceObj"> 
                <v-chip 
                  rounded="pill" 
                  flat 
                  style="height: 56px;" 
                >
                  {{ newLocationSourceObj.display_name.length > 70 ? newLocationSourceObj.display_name.slice(0, 70) + '...' : newLocationSourceObj.display_name }}
                  <template #append>
                    <v-icon 
                      icon="mdi-close" 
                      class="ml-1"
                      @click.stop="newLocationSourceObj = null"
                    />
                  </template>
                </v-chip>
                <div class="pseudo-hint">The journal or repository hosting this work online (Required)</div>
              </div>
              <entity-autocomplete v-else
                :entityType="'sources'" 
                :showWorkCounts="false" 
                variant="solo-filled"
                bg-color="grey-lighten-3"
                rounded="pill"
                flat
                density="default"
                label="Source"
                :hide-details="false"
                persistent-hint
                hint="The journal or repository hosting this work online (Required)"
                @update:model-value="onSourceSelected"
              />
            </div>
          </div>

          <div class="dialog-field mb-6">
            <div class="dialog-field-input">
              <v-text-field 
                v-model="newLocationLandingPageUrl" 
                variant="solo-filled"
                bg-color="grey-lighten-3"
                rounded="pill"
                flat
                label="Landing Page URL"
                hint="The primary URL for this work (Required)"
                persistent-hint
                placeholder="https://example.com/article"></v-text-field>
            </div>
          </div>

          <div class="dialog-field mb-6">
            <div class="dialog-field-input">
              <v-text-field 
                v-model="newLocationPdfUrl" 
                variant="solo-filled"
                bg-color="grey-lighten-3"
                rounded="pill"
                flat
                label="PDF URL"
                hint="URL of a fulltext PDF of this work"
                persistent-hint
                placeholder="https://example.com/article.pdf"></v-text-field>
            </div>
          </div>

          <div class="dialog-field mb-4">
            <div class="dialog-field-input">
              <v-select 
                v-model="newLocationVersion" 
                variant="solo-filled"
                bg-color="grey-lighten-3"
                rounded="pill"
                flat
                label="Version"
                hint="The version of this copy of the work"
                persistent-hint
                :items="versions"
              >
                <template v-slot:item="{ item, props }">
                  <v-list-item v-bind="props">
                    <v-list-item-subtitle>{{ item.raw.subtitle }}</v-list-item-subtitle>
                  </v-list-item>
                </template> 
              </v-select>
            </div>
          </div>

          <div class="dialog-field mb-4">
            <div class="dialog-field-input">
              <v-select 
                v-model="newLocationLicense" 
                variant="solo-filled"
                bg-color="grey-lighten-3"
                rounded="pill"
                flat
                label="License"
                hide-details
                :items="licenses"></v-select>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showNewLocationDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded :disabled="!isNewLocationFormValid" @click="addNewLocation">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

import axios from 'axios';
import ShortUniqueId from 'short-uuid';

import { urlBase } from '@/apiConfig';
import { useParams } from '@/composables/useStorage';
import EntityAutocomplete from '@/components/EntityAutocomplete.vue';
import LocationForm from '@/components/Curation/LocationForm.vue';

const { workId } = defineProps({
  workId: {
    type: String,
    required: true
  }
});

useHead({ title: 'Unpaywall Work Curation: ' + workId });

const store = useStore();
const router = useRouter();

const correctionsHost = urlBase.correctionsApi;

const pendingCorrections = ref([]);

const tab = useParams('tab', 'string', 'basic');

const editingWork = ref(null);

const newLocationIsOa = ref(true);
const newLocationSourceObj = ref(null);
const newLocationSource = ref(null);
const newLocationPdfUrl = ref(null);
const newLocationLandingPageUrl = ref(null);
const newLocationVersion = ref("submittedVersion");
const newLocationLicense = ref(null);

const email = computed(() => store.getters['user/userEmail']);
const isLibrarian = computed(() => store.getters['user/isLibrarian']);
const isAcademicNetwork = ref(false);

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

const onSourceSelected = (source) => {
  if (source) {
    newLocationSourceObj.value = source;
    newLocationSource.value = `https://openalex.org/${source.id.replace('sources/', '')}`;
  } else {
    newLocationSourceObj.value = null;
    newLocationSource.value = null;
  }
}

const versions = [
  { title: "Submitted Version", value: "submittedVersion", subtitle: "Not yet peer-reviewed" },
  { title: "Accepted Version", value: "acceptedVersion", subtitle: "Passed peer review, but without publisher typesetting and branding" },
  { title: "Published Version", value: "publishedVersion", subtitle: "Fully reviewed, typeset, and branded by the journal" },
];

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
  { title: "License not found", value: null }
];

const isNewLocationFormValid = computed(() => {
  return isValidUrl(newLocationLandingPageUrl.value) 
  && (isValidUrl(newLocationPdfUrl.value) || !newLocationPdfUrl.value) &&
  newLocationSource.value;
});

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

const clearLocationForm = () => {
  newLocationIsOa.value = true;
  newLocationLandingPageUrl.value = '';
  newLocationPdfUrl.value = '';
  newLocationVersion.value = "submittedVersion";
  newLocationLicense.value = null;
  newLocationSource.value = null;
  newLocationSourceObj.value = null;
}

const addNewLocation = () => {
  
  const newLocationValues = {
    "is_oa": newLocationIsOa.value,
    "landing_page_url": newLocationLandingPageUrl.value,
    "pdf_url": newLocationPdfUrl.value,
    "version": newLocationVersion.value,
    "license": newLocationLicense.value,
    "source_id": newLocationSource.value,
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
    //console.log(payload);
    axios.post(apiEndpoint, payload);
    snackbar("Your correction has been received and will be processed within a few days. Thank you for your help.");
    pendingCorrections.value.push(partialPayload.entity_id + "|" + partialPayload.property);
  } catch (e) {
    const errData = e.response && e.response.data;
    console.error('Error submitting correction:', errData);
    snackbar("There was an error submitting your correction. Please try again later.");
  }
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

watch(showNewLocationDialog, (val) => {
  if (!val) {
    setTimeout(() => {
      clearLocationForm();
    }, 500);
  }
});

</script>


<style scoped>
.field {
  display: flex;
  margin-bottom: 16px;
  line-height: 18px;
}
.field-label {
  flex-shrink: 0;
  display: flex;
  margin-right: 8px;
  color: #555;
  font-weight: bold;
}
.field-value {
  flex: 1;
  min-width: 0;
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
.pseudo-hint {
  color: #757575;
  font-size: 12px;
  padding-inline: 16px;
  padding-top: 6px;
}
</style>
