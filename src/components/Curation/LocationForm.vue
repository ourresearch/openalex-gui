<template>
  <v-card 
    flat 
    rounded="xl"
    color="grey-lighten-4"
    class="location-form px-6 pt-6 pb-2"
  >
    <div v-if="titleChips" class="mb-4">
      <v-chip v-for="chip in titleChips" :key="chip" size="default" color="grey-darken-2" variant="flat" class="mr-2">
        <template v-if="chip === 'primary'">
          Primary location
          <v-tooltip text="This is the canonical primary location for this work" location="bottom">
            <template #activator="{ props }">
              <v-icon icon="mdi-information-outline" color="grey-lighten-3" size="small" style="margin-left: 2px;" v-bind="props"></v-icon>
            </template>
          </v-tooltip>        
        </template>
        <template v-else-if="chip === 'best_oa'">
          Best Open Access location
          <v-tooltip text="This is the best Open Access location available for this work" location="bottom">
            <template #activator="{ props }">
              <v-icon icon="mdi-information-outline" color="grey-lighten-3" size="small" style="margin-left: 2px;" v-bind="props"></v-icon>
            </template>
          </v-tooltip>
        </template>
      </v-chip>
    </div>
    <div class="field">
      <div class="field-label">
        Source
        <v-tooltip text="The journal or repository that hosts this location" location="bottom">
          <template #activator="{ props }">
            <v-icon icon="mdi-information-outline" color="grey" size="x-small" style="margin-left: 2px;" v-bind="props"></v-icon>
          </template>
        </v-tooltip>
        :
      </div>
      <div class="field-value">
        <span v-if="location.source.display_name">{{ location.source.display_name }}</span>
        <span v-else class="text-grey-darken-1">None</span>
      </div>
    </div>

    <div class="field">
      <div class="field-label">
        Is OA
        <v-tooltip text="Whether this work is Open Access or not." location="bottom">
          <template #activator="{ props }">
            <v-icon icon="mdi-information-outline" color="grey" size="x-small" style="margin-left: 2px;" v-bind="props"></v-icon>
          </template>
        </v-tooltip>
        :
      </div>
      <code class="field-value">{{ location.is_oa }}</code>
    </div>

    <div class="field">
      <div class="field-label">
        Landing page URL
        <v-tooltip text="The URL of the landing page for this work where the full text HTML might be found" location="bottom">
          <template #activator="{ props }">
            <v-icon icon="mdi-information-outline" color="grey" size="x-small" style="margin-left: 2px;" v-bind="props"></v-icon>
          </template>
        </v-tooltip>
        :
      </div>
      <div :class="['field-value']">
        <a v-if="location.landing_page_url" :href="location.landing_page_url" target="_blank">
          <code>{{ location.landing_page_url }}</code>
        </a>
        <span v-else class="text-grey-darken-1">None</span>
      </div>
    </div>

    <div class="field">
      <div class="field-label">
        PDF URL
        <v-tooltip text="The open access URL where the full text PDF for this work can be found" location="bottom">
          <template #activator="{ props }">
            <v-icon icon="mdi-information-outline" color="grey" size="x-small" style="margin-left: 2px;" v-bind="props"></v-icon>
          </template>
        </v-tooltip>
        :
      </div>
      <div :class="['field-value']">
        <a v-if="location.pdf_url" :href="location.pdf_url" target="_blank">
          <code>{{ location.pdf_url }}</code>
        </a>
        <span v-else class="text-grey-darken-1">None</span>
        
        <v-tooltip v-if="pendingCorrections.includes(`${location.id}|pdf_url`)" location="bottom">
          <template #activator="{ props }">
            <v-icon v-bind="props" icon="mdi-timer-sand" size="small" class="ml-1" color="grey"></v-icon>
          </template>
          A correction is currently pending for this attribute. It will be processed within 2 days.
        </v-tooltip>
        <v-btn v-else icon variant="text" size="default" density="compact" class="ml-2 mt-n1" style="vertical-align: sub;" @click="editField('pdfUrl')">
          <v-icon icon="mdi-pencil" color="grey"></v-icon>
        </v-btn>
      </div>
    </div>

    <div class="field">
      <div class="field-label">
        License
        <v-tooltip text="The license under which this work is published" location="bottom">
          <template #activator="{ props }">
            <v-icon icon="mdi-information-outline" color="grey" size="x-small" style="margin-left: 2px;" v-bind="props"></v-icon>
          </template>
        </v-tooltip>
        :
      </div>
      <div :class="['field-value']">
        <span v-if="location.license"> 
          {{ licenseName(location.license) }}
        </span>
        <span v-else class="text-grey-darken-1">None</span>
        <v-tooltip v-if="pendingCorrections.includes(`${location.id}|license`)" location="bottom">
          <template #activator="{ props }">
            <v-icon v-bind="props" icon="mdi-timer-sand" size="small" class="ml-1" color="grey"></v-icon>
          </template>
          A correction is currently pending for this attribute. It will be processed within 2 days.
        </v-tooltip>
        <v-btn v-else-if="isLicenseEditable" icon variant="text" density="compact" size="default" class="ml-2 mt-n1" style="vertical-align: sub;" @click="editField('license')">
          <v-icon icon="mdi-pencil" color="grey"></v-icon>
        </v-btn>
      </div>
    </div>
  </v-card>


  <!-- Edit PDF URL Dialog -->
  <v-dialog v-model="isEditPdfUrlDialogOpen" width="580">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            {{ location.pdf_url ? 'Change' : 'Add' }} PDF URL
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isEditPdfUrlDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-alert type="warning" v-if="isAcademicNetwork" class="mb-6" style="font-size: 14px;">
          <b>You are visiting from an academic network.</b>
          <br/>
          Please be sure this URL is open for everyone by checking the page for signs of institutional subscription or by opening the URL from another network like your phone's.
        </v-alert>
        <v-text-field v-model="editingPdfUrl" label="PDF URL" variant="solo-filled" bg-color="grey-lighten-3" hide-details flat rounded></v-text-field>
        <div class="text-body-2 text-grey-darken-2 mx-4 mt-2">
          A URL of an Open Access PDF of the fulltext of this work.
          <div v-if="location.pdf_url" class="mt-2">
            If the current link does not give access, you may correct it or remove it.
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="text" rounded @click="isEditPdfUrlDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" rounded :disabled="!isPdfUrlFormValid" @click="savePdfUrl">Save</v-btn>
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
        <v-btn variant="text" rounded @click="isEditLicenseDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" rounded :disabled="!isLicenseFormValid" @click="saveLicense">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>


</template>

<script setup>

import { ref, computed, watch, toRef } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

defineOptions({ name: 'LocationForm' });

const props = defineProps({
  location: {
    type: Object,
    required: true
  },
  titleChips: {
    type: Array,
    required: false,
    default: null
  },
  pendingCorrections: {
    type: Array,
    required: true
  },
  isAcademicNetwork: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['submitCorrection']);

const location = toRef(props.location);

const store = useStore();
const router = useRouter(); 

const isEditPdfUrlDialogOpen = ref(false);
const isEditLandingPageUrlDialogOpen = ref(false);
const isEditLicenseDialogOpen = ref(false);

const editingPdfUrl = ref(null);
const editingLandingPageUrl = ref(null);
const editingLicense = ref(null);

const email = computed(() => store.getters['user/userEmail']);

const editField = (field) => {
  if (!email.value) {
    router.push({ name: 'Login' });
    return;
  }
  switch (field) {
    case 'pdfUrl':
      editPdfUrl();
      break;
    case 'landingPageUrl':
      editLandingPageUrl();
      break;
    case 'license':
      editLicense();
      break;
  }
};

const editPdfUrl = () => {
  editingPdfUrl.value = location.value.pdf_url;
  isEditPdfUrlDialogOpen.value = true;
};

const editLandingPageUrl = () => {
  editingLandingPageUrl.value = location.value.landing_page_url;
  isEditLandingPageUrlDialogOpen.value = true;
};

const editLicense = () => {
  editingLicense.value = location.value.license;
  isEditLicenseDialogOpen.value = true;
};

const isLicenseEditable = computed(() => {
  return location.value.pdf_url || location.value.html_url;
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
  { title: "No explicit license", value: null }
];

const licenseName = (license) => {
  const licenseItem = licenses.find(l => l.value === license);
  return licenseItem ? licenseItem.title : "-";
};

const isPdfUrlFormValid = computed(() => {
  if (location.value.pdf_url === editingPdfUrl.value) {
    return false;
  }
  return isValidUrl(editingPdfUrl.value) || !editingPdfUrl.value;
});

const isLandingPageUrlFormValid = computed(() => {
  if (location.value.landing_page_url === editingLandingPageUrl.value) {
    return false;
  }
  return isValidUrl(editingLandingPageUrl.value) || !editingLandingPageUrl.value;
});

const isLicenseFormValid = computed(() => {
  return editingLicense.value !== location.value.license;
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
    "property": "pdf_url",
    "property_value": editingPdfUrl.value === "" ? null : editingPdfUrl.value
  };
  submitCorrection(payload);
  isEditPdfUrlDialogOpen.value = false;
  location.value.pdf_url = editingPdfUrl.value;
}

const saveLandingPageUrl = () => {
  const payload = {
    "property": "landing_page_url",
    "property_value": editingLandingPageUrl.value === "" ? null : editingLandingPageUrl.value
  };
  submitCorrection(payload);
  isEditLandingPageUrlDialogOpen.value = false;
  location.value.landing_page_url = editingLandingPageUrl.value;
}

const saveLicense = () => {
  const payload = {
    "property": "license",
    "property_value": editingLicense.value
  };
  submitCorrection(payload);
  isEditLicenseDialogOpen.value = false;
  location.value.license = editingLicense.value;
}

const submitCorrection = (partialPayload) => {    
  partialPayload.entity_id = location.value.id;
  emit('submitCorrection', partialPayload);
}

watch(location, () => {
  if (location.value) {
    if (location.value.pdf_url || location.value.html_url) {
      location.value.is_oa = true;
    }

    if (!location.value.pdf_url && !location.value.html_url) {
      location.value.is_oa = false;
      location.value.license = null;
    }
  }
}, { deep: true });

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
</style>

    
    