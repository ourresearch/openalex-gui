<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <v-breadcrumbs :items="breadcrumbs" divider="›" class="px-0 mt-n10" />
      
      <div v-if="editingJournal">
          
        <div class="text-h4 mb-1 d-flex">
          <div>{{ editingJournal.display_name }}</div>
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
                <v-list-item prepend-icon="mdi-file-document-outline" :href="`https://openalex.org/${editingJournal.id}`" target="_blank">
                  Journal profile
                  <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                </v-list-item>
                <v-list-item prepend-icon="mdi-api" :href="`https://api.openalex.org/${editingJournal.id}?data-version=2`" target="_blank">
                  New API
                  <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                </v-list-item>
                <v-list-item prepend-icon="mdi-api" :href="`https://api.openalex.org/${editingJournal.id}`" target="_blank">
                  Old API
                  <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                </v-list-item>
                <v-list-item v-if="editingJournal.homepage_url" prepend-icon="mdi-home-outline" :href="editingJournal.homepage_url" target="_blank">
                  Journal homepage
                  <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>

        <div class="text-grey-darken-2 text-body-2 mb-4">
          {{ editingJournal.issn_l }}
        </div>
      
      </div>
      <v-card flat rounded="xl" class="pa-4">   
        <v-skeleton-loader
          v-if="!editingJournal && !errorMessage"
          type="list-item-two-line@2"
          class="mb-4"
        />
        <div v-else-if="errorMessage" class="text-grey-darken-1 py-4">
          {{ errorMessage }}
        </div>

        <div v-else>
          <v-card-text>

            <div class="field">
              <div class="field-label">
                Is Open Access
                <v-tooltip text="Whether this journal is Open Access or not." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="small" class="ml-1" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                :
              </div>
              <div class="field-value">
                <code>{{ editingJournal.is_oa }}</code>
                  <v-tooltip v-if="pendingCorrections.includes(`${journalId}|is_oa`)" location="bottom">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-timer-sand" size="small" class="ml-1" color="grey"></v-icon>
                  </template>
                  A correction is currently pending for this attribute. It will be processed within 2 days.
                </v-tooltip>
                <v-btn v-else icon variant="text" size="small" density="compact" class="ml-2" @click="editField('is_oa')">
                  <v-icon icon="mdi-pencil" color="grey"></v-icon>
                </v-btn>
              </div>
            </div>

            <div class="field">
              <div class="field-label">
                Open Access Flip Year
                <v-tooltip text="The year this journal flipped to Open Access." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="small" class="ml-1" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                :
              </div>
              <div :class="['field-value']">
                <span v-if="editingJournal.oa_flip_year">{{ editingJournal.oa_flip_year }}</span>
                <span v-else class="text-grey-darken-1">None</span>
                
                <v-tooltip v-if="pendingCorrections.includes(`${journalId}|oa_flip_year`)" location="bottom">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-timer-sand" size="small" class="ml-1" color="grey"></v-icon>
                  </template>
                  A correction is currently pending for this attribute. It will be processed within 2 days.
                </v-tooltip>
                <v-btn v-else-if="editingJournal.is_oa" icon variant="text" size="small" density="compact" class="ml-2" @click="editField('oa_flip_year')">
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
        <v-btn color="primary" variant="flat" rounded :disabled="editingJournal.is_oa === editingIsOa" @click="saveIsOa">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>


  <!-- Edit OA Flip Year Dialog -->
  <v-dialog v-model="isEditOaFlipYearDialogOpen" width="580">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            {{editingJournal.oa_flip_year ? 'Change' : 'Add'}} Open Access flip year
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isEditOaFlipYearDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div class="text-body-2 text-grey-darken-2 mx-4 mb-8">
          In what year did this journal flip to Open Access?
        </div>
        <v-text-field v-model="editingOaFlipYear" placeholder="e.g., 2020" variant="solo-filled" bg-color="grey-lighten-3" flat rounded></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="text" rounded @click="isEditOaFlipYearDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" rounded :disabled="!isOaFlipYearFormValid" @click="saveOaFlipYear">Save</v-btn>
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

const { journalId } = defineProps({
  journalId: {
    type: String,
    required: true
  }
})

useHead({ title: 'Unpaywall Journal Curation: ' + journalId });

const store = useStore();
const router = useRouter();

const correctionsHost = urlBase.correctionsApi;

const pendingCorrections = ref([]);

const editingJournal     = ref(null);
const editingIsOa        = ref(null);
const editingOaFlipYear  = ref(null);

const isEditIsOaDialogOpen       = ref(false);
const isEditOaFlipYearDialogOpen = ref(false);

const email = computed(() => store.getters['user/userEmail']);
const isLibrarian = computed(() => store.getters['user/isLibrarian']);

const errorMessage = ref(null);

const snackbar = (val) => store.commit('snackbar', val);

// Preserve previous search query params in breadcrumbs
const journalsBackUrl = (() => {
  const history = router.options.history;
  const previousRoute = history.state?.back;
  if (previousRoute?.includes('/curate/journals') && !previousRoute.includes('/curate/journals/')) {
    return previousRoute;
  }
  return '/curate/journals';
})();

const breadcrumbs = [
  { title: 'Curate', to: '/curate' },
  { title: 'Journals', to: journalsBackUrl },
  { title: journalId, to: '/curate/journals/' + journalId, disabled: true },
];

const getJournal = async () => {
  try {
    const response = await axios.get(`https://api.openalex.org/sources/${journalId}?data-version=2`);
    editingJournal.value = response.data;
  } catch (error) {
    errorMessage.value = `Journal ${journalId} not found.`;
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
  console.log("Setting editingIsOa to", editingJournal.value.is_oa);
  editingIsOa.value = editingJournal.value.is_oa;
  isEditIsOaDialogOpen.value = true;
};

const editOaFlipYear = () => {
  editingOaFlipYear.value = editingJournal.value.oa_flip_year;
  isEditOaFlipYearDialogOpen.value = true;
};

const isOaFlipYearFormValid = computed(() => {
  return editingOaFlipYear.value !== editingJournal.value.oa_flip_year && isYear(editingOaFlipYear.value);
});

const saveIsOa = () => {
  const payload = {
    "field": "is_oa",
    "value": editingIsOa.value
  };
  submitCorrection(payload);
  isEditIsOaDialogOpen.value = false;
  editingJournal.value.is_oa = editingIsOa.value;
}

const saveOaFlipYear = () => {
  const payload = {
    "field": "oa_flip_year",
    "value": editingOaFlipYear.value === "" ? null : editingOaFlipYear.value
  };
  submitCorrection(payload);
  isEditOaFlipYearDialogOpen.value = false;
  editingJournal.value.oa_flip_year = editingOaFlipYear.value;
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
      "entity": "journals",
      "entity_id": extractId(editingJournal.value.id),
      "property": partialPayload.field,
      "property_value": partialPayload.value,
      "email": email.value,
    };
    axios.post(apiEndpoint, payload);
    snackbar("Your correction has been received and will be processed within a few days. Thank you for your help.");
    pendingCorrections.value.push(extractId(editingJournal.value.id) + "|" + partialPayload.field);
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

getJournal();
getPendingCorrections();

watch(editingJournal, () => {
  if (editingJournal.value) {
    if (editingJournal.value.is_oa && !editingIsOa.value) {
      editingJournal.value.oa_flip_year = null;
    }
  }
}, { deep: true });

</script>
<style scoped>
.field {
  display: flex;
  margin-bottom: 10px;
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
.field-value.vertical-adjust {
  margin-top: -8px;
}
</style>
