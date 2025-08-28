<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <v-breadcrumbs :items="breadcrumbs" divider="›" class="px-0 mt-n10" />
          
      <div class="text-h4 mb-1 d-flex" style="min-height: 44px;">
        <div>{{ editingSource?.display_name || "Loading..." }}</div>
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
              <v-list-item prepend-icon="mdi-file-document-outline" :href="`https://openalex.org/${editingSource.id}`" target="_blank">
                Source profile
                <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
              </v-list-item>
              <v-list-item prepend-icon="mdi-api" :href="`https://api.openalex.org/${editingSource.id}?data-version=2`" target="_blank">
                New API
                <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
              </v-list-item>
              <v-list-item prepend-icon="mdi-api" :href="`https://api.openalex.org/${editingSource.id}`" target="_blank">
                Old API
                <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
              </v-list-item>
              <v-list-item v-if="editingSource.homepage_url" prepend-icon="mdi-home-outline" :href="editingSource.homepage_url" target="_blank">
                Source homepage
                <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </div>

      <div class="text-grey-darken-2 text-body-2 mb-4">
        {{ editingSource?.issn_l || "" }}
      </div>

      <v-card flat rounded="xl" class="pa-4">   
        <v-skeleton-loader v-if="!editingSource" type="list-item-two-line@1"></v-skeleton-loader>
        <div v-else-if="errorMessage" class="text-grey-darken-1 py-4">
          {{ errorMessage }}
        </div>

        <div v-else>
          <v-card-text style="font-size: 16px;">

            <div class="field">
              <div class="field-label">
                Is Open Access
                <v-tooltip text="Whether this source is Open Access or not." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="x-small" style="margin-left: 2px;" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                :
              </div>
              <div class="field-value">
                <code>{{ editingSource.is_oa }}</code>
                  <v-tooltip v-if="pendingCorrections.includes(`${sourceId}|is_oa`)" location="bottom">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-timer-sand" size="x-small" class="ml-1" color="grey"></v-icon>
                  </template>
                  A correction is currently pending for this attribute. It will be processed within 2 days.
                </v-tooltip>
                <v-btn v-else icon variant="text" size="default" density="compact" class="ml-2 mt-n1" style="vertical-align: sub;" @click="editField('is_oa')">
                  <v-icon icon="mdi-pencil" color="grey"></v-icon>
                </v-btn>
              </div>
            </div>

            <div class="field">
              <div class="field-label">
                Open Access Flip Year
                <v-tooltip text="The year this source flipped to Open Access." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="x-small" style="margin-left: 2px;" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                :
              </div>
              <div :class="['field-value']">
                <span v-if="editingSource.oa_flip_year">{{ editingSource.oa_flip_year }}</span>
                <span v-else class="text-grey-darken-1">None</span>
                
                <v-tooltip v-if="pendingCorrections.includes(`${sourceId}|oa_flip_year`)" location="bottom">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-timer-sand" size="default" class="ml-1" color="grey"></v-icon>
                  </template>
                  A correction is currently pending for this attribute. It will be processed within 2 days.
                </v-tooltip>
                <v-btn v-else-if="editingSource.is_oa" icon variant="text" size="default" density="compact" class="ml-2 mt-n1" style="vertical-align: sub;" @click="editField('oa_flip_year')">
                  <v-icon icon="mdi-pencil" color="grey"></v-icon>
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </div>
      </v-card>
  
    </v-container>
  </div>

  <!-- Edit Is OA Dialog -->
  <v-dialog v-model="isEditIsOaDialogOpen" width="450">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            Change Open Access status
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isEditIsOaDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-radio-group v-model="editingIsOa" hide-details>
          <v-radio label="Open Access" :value="true"></v-radio>
          <v-radio label="Closed Access" :value="false"></v-radio>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="text" rounded @click="isEditIsOaDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" rounded :disabled="editingSource.is_oa === editingIsOa" @click="saveIsOa">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>


  <!-- Edit OA Flip Year Dialog -->
  <v-dialog v-model="isEditOaFlipYearDialogOpen" width="580">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            {{editingSource.oa_flip_year ? 'Change' : 'Add'}} Open Access flip year
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isEditOaFlipYearDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-text-field v-model="editingOaFlipYear" placeholder="e.g., 2020" variant="solo-filled" bg-color="grey-lighten-3" hide-details flat rounded></v-text-field>
        <div class="text-body-2 text-grey-darken-2 mx-4 mt-2">
          In what year did this source flip to Open Access?
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="text" rounded @click="isEditOaFlipYearDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" rounded :disabled="!isOaFlipYearFormValid" @click="saveOaFlipYear">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { urlBase } from '@/apiConfig';

const { sourceId } = defineProps({
  sourceId: {
    type: String,
    required: true
  }
})

useHead({ title: 'Unpaywall Source Curation: ' + sourceId });

const store = useStore();
const router = useRouter();

const correctionsHost = urlBase.correctionsApi;

const pendingCorrections = ref([]);

const editingSource     = ref(null);
const editingIsOa        = ref(null);
const editingOaFlipYear  = ref(null);

const isEditIsOaDialogOpen       = ref(false);
const isEditOaFlipYearDialogOpen = ref(false);

const email = computed(() => store.getters['user/userEmail']);
const isLibrarian = computed(() => store.getters['user/isLibrarian']);

const errorMessage = ref(null);

const snackbar = (val) => store.commit('snackbar', val);

// Preserve previous search query params in breadcrumbs
const sourcesBackUrl = (() => {
  const history = router.options.history;
  const previousRoute = history.state?.back;
  if (previousRoute?.includes('/curate/sources') && !previousRoute.includes('/curate/sources/')) {
    return previousRoute;
  }
  return '/curate/sources';
})();

const breadcrumbs = [
  { title: 'Curate', to: '/curate' },
  { title: 'Sources', to: sourcesBackUrl },
  { title: sourceId, to: '/curate/sources/' + sourceId, disabled: true },
];

const getSource = async () => {
  try {
    const response = await axios.get(`https://api.openalex.org/sources/${sourceId}?data-version=2`);
    editingSource.value = response.data;
  } catch (error) {
    errorMessage.value = `Source ${sourceId} not found.`;
  }
}

const editField = (field) => {
  if (!email.value) {
    store.commit('user/setIsLoginDialogOpen', true);
    return;
  }
  switch (field) {
    case 'is_oa':
      editIsOa();
      break;
    case 'oa_flip_year':
      editOaFlipYear();
      break;
  }
};

const editIsOa = () => {
  console.log("Setting editingIsOa to", editingSource.value.is_oa);
  editingIsOa.value = editingSource.value.is_oa;
  isEditIsOaDialogOpen.value = true;
};

const editOaFlipYear = () => {
  editingOaFlipYear.value = editingSource.value.oa_flip_year;
  isEditOaFlipYearDialogOpen.value = true;
};

const isOaFlipYearFormValid = computed(() => {
  return editingOaFlipYear.value !== editingSource.value.oa_flip_year && isYear(editingOaFlipYear.value);
});

const saveIsOa = () => {
  const payload = {
    "field": "is_oa",
    "value": editingIsOa.value
  };
  submitCorrection(payload);
  isEditIsOaDialogOpen.value = false;
  editingSource.value.is_oa = editingIsOa.value;
}

const saveOaFlipYear = () => {
  const payload = {
    "field": "oa_flip_year",
    "value": editingOaFlipYear.value === "" ? null : editingOaFlipYear.value
  };
  submitCorrection(payload);
  isEditOaFlipYearDialogOpen.value = false;
  editingSource.value.oa_flip_year = editingOaFlipYear.value;
}

const isYear = (value) => {
  if (!value) return false;
  return /^(19|20)\d{2}$/.test(value);
};

const submitCorrection = (partialPayload) => {
  const apiEndpoint = `${correctionsHost}/v2/corrections`;

  try {
    const payload = {
      "status": isLibrarian.value ? "approved" : "needs-moderation",
      "entity": "sources",
      "entity_id": extractId(editingSource.value.id),
      "property": partialPayload.field,
      "property_value": partialPayload.value,
      "submitter_email": email.value,
      "moderator_email": isLibrarian.value ? email.value : null,
    };
    axios.post(apiEndpoint, payload);
    snackbar("Your correction has been received and will be processed within a few days. Thank you for your help.");
    pendingCorrections.value.push(extractId(editingSource.value.id) + "|" + partialPayload.field);
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

getSource();
getPendingCorrections();

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
