<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <v-breadcrumbs :items="breadcrumbs" divider="›" class="px-0 mt-n10" />
      <div class="text-h3 mb-4">
        Unpaywall: Curate a Work
      </div>

      <div class="text-subtitle-1 mb-6 text-grey-darken-3">
        Change the open access URLs and license of this work. Changes will show up within two days.
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
            <div class="font-weight-medium mb-1" style="font-size: 18px; max-width: 700px;">
              <a :href="editingWork.id" class="text-decoration-none" style="color:inherit;">{{ editingWork.display_name }}</a>
            </div>
            <div class="text-grey-darken-2 text-body-2 mb-10">
              {{ editingWork.publication_year }}
              <span style="margin: 0 2px;">•</span>
              {{ editingWork.type }}
              <span style="margin: 0 2px;">•</span>
              <a :href="editingWork.doi" target="_blank" class="text-decoration-none" style="color:inherit;">{{ editingWork.doi.replace('https://doi.org/', '') }}</a>
              <span style="margin: 0 2px;">•</span>
              <a :href="`https://api.openalex.org/works/${extractId(editingWork.id)}`" target="_blank" class="text-decoration-none" style="color:inherit;">
                API
                <v-icon icon="mdi-open-in-new" size="x-small" color="grey" class=""></v-icon>
              </a>
            </div>

            <div v-if="editingWork.best_oa_location?.source?.display_name" class="field">
              <div class="field-label">
                <v-tooltip text="The best known Open Access location for this work." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="small" class="mr-2" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                Best open location:
              </div>
              <div class="field-value">{{ editingWork.best_oa_location.source.display_name }}</div>
            </div>
            <div class="field">
              <div class="field-label">
                <v-tooltip text="Whether this work is Open Access." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="small" class="mr-2" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                Is OA:
              </div>
              <div class="field-value">{{ editingWork.primary_location.is_oa }}</div>
            </div>
            <div class="field">
              <div class="field-label">
                <v-tooltip text="The open access URL where the full text PDF for this work can be found." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="small" class="mr-2" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                PDF URL:
              </div>
              <div :class="['field-value', needsVerticalAdjust(editingWork.primary_location.pdf_url) ? 'vertical-adjust' : '']">
                <a v-if="editingWork.primary_location.pdf_url" :href="editingWork.primary_location.pdf_url" target="_blank">
                  <code>{{ editingWork.primary_location.pdf_url }}</code>
                </a>
                <span v-else class="text-grey">-</span>
                <v-btn icon variant="text" size="small" @click="editField('pdfUrl')">
                  <v-icon icon="mdi-pencil" color="grey"></v-icon>
                </v-btn>
              </div>
            </div>

            <div class="field">
              <div class="field-label">
                <v-tooltip text="The open access URL where the full text HTML for this work can be found." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="small" class="mr-2" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                HTML URL:
              </div>
              <div :class="['field-value', needsVerticalAdjust(editingWork.primary_location.html_url) ? 'vertical-adjust' : '']">
                <a v-if="editingWork.primary_location.html_url" :href="editingWork.primary_location.html_url" target="_blank">
                  <code>{{ editingWork.primary_location.html_url }}</code>
                </a>
                <span v-else class="text-grey">-</span>
                <v-btn icon variant="text" size="small" @click="editField('htmlUrl')">
                  <v-icon icon="mdi-pencil" color="grey"></v-icon>
                </v-btn>
              </div>
            </div>

            <div class="field">
              <div class="field-label">
                <v-tooltip text="The license under which this work is published." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="small" class="mr-2" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                License:
              </div>
              <div :class="['field-value', isLicenseEditable ? 'vertical-adjust' : '']">
                <span v-if="editingWork.primary_location.license"> 
                  {{ licenseName(editingWork.primary_location.license) }}
                </span>
                <span v-else class="text-grey">-</span>
                <v-btn v-if="isLicenseEditable" icon variant="text" size="small" @click="editField('license')">
                  <v-icon icon="mdi-pencil" color="grey"></v-icon>
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </div>
      </v-card>

    </v-container>
  </div>

  <!-- Edit PDF URL Dialog -->
  <v-dialog v-model="isEditPdfUrlDialogOpen" width="580">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            {{ editingWork.primary_location.pdf_url ? 'Change' : 'Add' }} PDF URL
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isEditPdfUrlDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div class="text-body-2 text-grey-darken-2 mx-4 mb-8">
          This URL points to an Open Access PDF of the fulltext of this work.
          <div v-if="editingWork.primary_location.pdf_url" class="mt-2">
            If the current link does not give access, you may correct it or remove it.
          </div>
        </div>
        <v-alert type="warning" v-if="isAcademicNetwork" class="mb-6" style="font-size: 14px;">
          <b>You are visiting from an academic network.</b>
          <br/>
          Please be sure this URL is open for everyone by checking the page for signs of institutional subscription or by opening the URL from another network like your phone's.
        </v-alert>
        <v-text-field v-model="editingPdfUrl" label="PDF URL" variant="solo-filled" bg-color="grey-lighten-3" flat rounded></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="text" rounded @click="isEditPdfUrlDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" rounded :disabled="!isPdfUrlFormValid" @click="savePdfUrl">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>


  <!-- Edit HTML URL Dialog -->
  <v-dialog v-model="isEditHtmlUrlDialogOpen" width="580">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            {{editingWork.primary_location.html_url ? 'Change' : 'Add'}} HTML URL
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isEditHtmlUrlDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div class="text-body-2 text-grey-darken-2 mx-4 mb-8">
          This URL points to an Open Access HTML version of the fulltext of this work.
          <div v-if="editingWork.primary_location.html_url" class="mt-2">
            If the current link does not give access, you may correct it or remove it.
          </div>
        </div>
        <v-alert type="warning" v-if="isAcademicNetwork" class="mb-6" style="font-size: 14px;">
          <b>You are visiting from an academic network.</b>
          <br/>
          Please be sure this URL is open for everyone by checking the page for signs of institutional subscription or by opening the URL from another network like your phone's.
        </v-alert>
        <v-text-field v-model="editingHtmlUrl" label="HTML URL" variant="solo-filled" bg-color="grey-lighten-3" flat rounded></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="outline" rounded @click="isEditHtmlUrlDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" rounded :disabled="!isHtmlUrlFormValid" @click="saveHtmlUrl">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>


  <!-- Edit License Dialog -->
  <v-dialog v-model="isEditLicenseDialogOpen" width="500">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            Change license
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isEditLicenseDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-select v-model="editingLicense" :items="licenses" label="License"></v-select>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="outline" rounded @click="isEditLicenseDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" rounded :disabled="!isLicenseFormValid" @click="saveLicense">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { urlBase } from '@/apiConfig';

const { workId } = defineProps({
  workId: {
    type: String,
    required: true
  }
})

useHead({ title: 'Unpaywall Work Curation: ' + workId });

const store = useStore();

const correctionsHost = urlBase.correctionsApi;

const pendingCorrections = ref([]);

const editingWork = ref(null);
const editingPdfUrl = ref(null);
const editingHtmlUrl = ref(null);
const editingLicense = ref(null);

const isEditPdfUrlDialogOpen = ref(false);
const isEditHtmlUrlDialogOpen = ref(false);
const isEditLicenseDialogOpen = ref(false);

const email = computed(() => store.getters['user/userEmail']);
const isLibrarian = computed(() => store.getters['user/isLibrarian']);
const isAcademicNetwork = ref(false);

const errorMessage = ref(null);

const snackbar = (val) => store.commit('snackbar', val);

const router = useRouter();

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

const needsVerticalAdjust = (value) => {
  return !value || value.length < 50;
}

const editField = (field) => {
  if (!email.value) {
    store.commit('user/setIsLoginDialogOpen', true);
    return;
  }
  switch (field) {
    case 'pdfUrl':
      editPdfUrl();
      break;
    case 'htmlUrl':
      editHtmlUrl();
      break;
    case 'license':
      editLicense();
      break;
  }
};

const editPdfUrl = () => {
  editingPdfUrl.value = editingWork.value.primary_location.pdf_url;
  isEditPdfUrlDialogOpen.value = true;
};

const editHtmlUrl = () => {
  editingHtmlUrl.value = editingWork.value.primary_location.html_url;
  isEditHtmlUrlDialogOpen.value = true;
};

const editLicense = () => {
  editingLicense.value = editingWork.value.primary_location.license;
  isEditLicenseDialogOpen.value = true;
};

const isLicenseEditable = computed(() => {
  return editingWork.value.primary_location.pdf_url || editingWork.value.primary_location.html_url;
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

const licenseName = (license) => {
  const licenseItem = licenses.find(l => l.value === license);
  return licenseItem ? licenseItem.title : "-";
};

const isPdfUrlFormValid = computed(() => {
  if (editingWork.value.primary_location.pdf_url === editingPdfUrl.value) {
    return false;
  }
  return isValidUrl(editingPdfUrl.value) || !editingPdfUrl.value;
});

const isHtmlUrlFormValid = computed(() => {
  if (editingWork.value.primary_location.html_url === editingHtmlUrl.value) {
    return false;
  }
  return isValidUrl(editingHtmlUrl.value) || !editingHtmlUrl.value;
});

const isLicenseFormValid = computed(() => {
  return editingLicense.value !== editingWork.value.primary_location.license;
});

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

const savePdfUrl = () => {
  const payload = {
    "field": "pdf_url",
    "value": editingPdfUrl.value === "" ? null : editingPdfUrl.value
  };
  submitCorrection(payload);
  isEditPdfUrlDialogOpen.value = false;
  editingWork.value.primary_location.pdf_url = editingPdfUrl.value;
}

const saveHtmlUrl = () => {
  const payload = {
    "field": "html_url",
    "value": editingHtmlUrl.value === "" ? null : editingHtmlUrl.value
  };
  submitCorrection(payload);
  isEditHtmlUrlDialogOpen.value = false;
  editingWork.value.primary_location.html_url = editingHtmlUrl.value;
}

const saveLicense = () => {
  const payload = {
    "field": "license",
    "value": editingLicense.value
  };
  submitCorrection(payload);
  isEditLicenseDialogOpen.value = false;
  editingWork.value.primary_location.license = editingLicense.value;
}

const submitCorrection = (partialPayload) => {
  const apiEndpoint = `${correctionsHost}/v2/corrections`;

  try {
    const payload = {
      "entity": "works",
      "entity_id": extractId(editingWork.value.id),
      "property": partialPayload.field,
      "property_value": partialPayload.value,
      "email": email.value,
    };
    if (isLibrarian.value) {
      payload.accepted = true;
    }
    axios.post(apiEndpoint, payload);
    snackbar("Your correction has been received and will be processed within a few days. Thank you for your help.");
    pendingCorrections.value.push(extractId(editingWork.value.id));
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

getWork();
checkAcademicNetwork();
getPendingCorrections();

watch(editingWork, () => {
  if (editingWork.value) {
    if (editingWork.value.primary_location.pdf_url || editingWork.value.primary_location.html_url) {
      editingWork.value.primary_location.is_oa = true;
    }

    if (!editingWork.value.primary_location.pdf_url && !editingWork.value.primary_location.html_url) {
      editingWork.value.primary_location.is_oa = false;
      editingWork.value.primary_location.license = null;
    }
  }
}, { deep: true });

</script>
<style scoped>
.field {
  display: flex;
  margin-bottom: 28px;
}
.field-label {
  width: 130px;
  flex-shrink: 0;
  display: flex;
  
  color: #555;
}
.field-value {
  flex: 1;
  min-width: 0;
  max-width: 500px;
}
.field-value.vertical-adjust {
  margin-top: -8px;
}
</style>
