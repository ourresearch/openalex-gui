<template>
  <div class="py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <v-breadcrumbs :items="breadcrumbs" divider="›" class="px-0 mt-n10" />
          
      <div class="text-h4 mb-1 d-flex" style="min-height: 44px;">
        <div>{{ editingSource?.display_name || "Loading..." }}</div>
        <v-spacer></v-spacer>

        <v-btn v-if="editingSource" icon variant="text" size="large" density="comfortable" :href="`https://api.openalex.org/sources/${editingSource.id}?data-version=2`" target="_blank">
          <v-icon icon="mdi-api" color="grey-darken-2"></v-icon>
        </v-btn>
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
                Display Name
                <v-tooltip text="The display name of this source." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="x-small" style="margin-left: 2px;" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                :
              </div>
              <div class="field-value">
                <code>{{ editingSource.display_name }}</code>
                  <v-tooltip v-if="pendingCorrections.includes(`${sourceId}|display_name`)" location="bottom">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-timer-sand" size="x-small" class="ml-1" color="grey"></v-icon>
                  </template>
                  A correction is currently pending for this attribute. It will be processed within 2 days.
                </v-tooltip>
                <v-btn v-else icon variant="text" size="default" density="compact" class="ml-2 mt-n1" style="vertical-align: sub;" @click="editField('display_name')">
                  <v-icon icon="mdi-pencil" color="grey"></v-icon>
                </v-btn>
              </div>
            </div>

            <div class="field">
              <div class="field-label">
                Source Homepage
                <v-tooltip text="The homepage of this source." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="x-small" style="margin-left: 2px;" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                :
              </div>
              <div class="field-value">
                <code><a :href="editingSource.homepage_url" target="_blank">{{ editingSource.homepage_url }}</a></code>
                  <v-tooltip v-if="pendingCorrections.includes(`${sourceId}|homepage_url`)" location="bottom">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-timer-sand" size="x-small" class="ml-1" color="grey"></v-icon>
                  </template>
                  A correction is currently pending for this attribute. It will be processed within 2 days.
                </v-tooltip>
                <v-btn v-else icon variant="text" size="default" density="compact" class="ml-2 mt-n1" style="vertical-align: sub;" @click="editField('homepage_url')">
                  <v-icon icon="mdi-pencil" color="grey"></v-icon>
                </v-btn>
              </div>
            </div>

            <div class="field">
              <div class="field-label">
                Type
                <v-tooltip text="The type of this source." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="x-small" style="margin-left: 2px;" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                :
              </div>
              <div class="field-value">
                <code>{{ editingSource.type }}</code>
                  <v-tooltip v-if="pendingCorrections.includes(`${sourceId}|type`)" location="bottom">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-timer-sand" size="x-small" class="ml-1" color="grey"></v-icon>
                  </template>
                  A correction is currently pending for this attribute. It will be processed within 2 days.
                </v-tooltip>
                <v-btn v-else icon variant="text" size="default" density="compact" class="ml-2 mt-n1" style="vertical-align: sub;" @click="editField('type')">
                  <v-icon icon="mdi-pencil" color="grey"></v-icon>
                </v-btn>
              </div>
            </div>

            <div class="field">
              <div class="field-label">
                Publisher
                <v-tooltip text="The publisher of this source." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="x-small" style="margin-left: 2px;" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                :
              </div>
              <div class="field-value">
                <code v-if="editingSource.host_organization_name">{{ editingSource.host_organization_name }}</code>
                <span v-else class="text-grey-darken-1">None</span>
                <v-tooltip v-if="pendingCorrections.includes(`${sourceId}|publisher`)" location="bottom">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-timer-sand" size="x-small" class="ml-1" color="grey"></v-icon>
                  </template>
                  A correction is currently pending for this attribute. It will be processed within 2 days.
                </v-tooltip>
                <v-btn v-else icon variant="text" size="default" density="compact" class="ml-2 mt-n1" style="vertical-align: sub;" @click="editField('publisher')">
                  <v-icon icon="mdi-pencil" color="grey"></v-icon>
                </v-btn>
              </div>
            </div>


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

            <div class="field">
              <div class="field-label">
                OpenAlex Profile
                <v-tooltip text="The OpenAlex profile of this source." location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-information-outline" color="grey" size="x-small" style="margin-left: 2px;" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
                :
              </div>
              <div class="field-value">
                <code><a :href="editingSource.id" target="_blank">{{ editingSource.id }}</a></code>
              </div>
            </div>
          </v-card-text>
        </div>
      </v-card>
    </v-container>
  </div>


  <!-- Edit Display Name Dialog -->
  <v-dialog v-model="isEditDisplayNameDialogOpen" width="580">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            Change Display Name
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isEditDisplayNameDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-text-field v-model="editingDisplayName" placeholder="e.g., Journal of Open Source Software" variant="solo-filled" bg-color="grey-lighten-3" hide-details flat rounded></v-text-field>
        <div class="text-body-2 text-grey-darken-2 mx-4 mt-2">
          The display name of this source.
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="text" rounded @click="isEditDisplayNameDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" rounded :disabled="!isDisplayNameFormValid" @click="saveDisplayName">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Edit Homepage Dialog -->
  <v-dialog v-model="isEditHomepageDialogOpen" width="580">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            {{editingSource.homepage_url ? 'Change' : 'Add'}} Homepage URL
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isEditHomepageDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-text-field v-model="editingHomepageUrl" placeholder="e.g., https://example.com" variant="solo-filled" bg-color="grey-lighten-3" hide-details flat rounded></v-text-field>
        <div class="text-body-2 text-grey-darken-2 mx-4 mt-2">
          The homepage URL of this source.
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="text" rounded @click="isEditHomepageDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" rounded :disabled="!isHomepageUrlFormValid" @click="saveHomepageUrl">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>


  <!-- Edit License Dialog -->
  <v-dialog v-model="isEditTypeDialogOpen" width="500">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            Change type
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isEditTypeDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-select v-model="editingType" :items="sourceTypes" label="Type"></v-select>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="outline" rounded @click="isEditTypeDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" rounded :disabled="!isTypeFormValid" @click="saveType">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Edit Publisher Dialog -->
  <v-dialog v-model="isEditPublisherDialogOpen" width="500">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            {{editingSource.host_organization ? 'Change publisher' : 'Add publisher'}}
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isEditPublisherDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div v-if="editingPublisherObj"> 
          <v-chip 
            rounded="pill" 
            flat 
            style="height: 56px;" 
          >
            {{ editingPublisherObj.display_name.length > 70 ? editingPublisherObj.display_name.slice(0, 70) + '...' : editingPublisherObj.display_name }}
            <template #append>
              <v-icon 
                icon="mdi-close" 
                class="ml-1"
                @click.stop="editingPublisherObj = null"
              />
            </template>
          </v-chip>
        </div>
        <entity-autocomplete
          v-else
          :entityType="editingSource.type === 'repository' ? 'institutions' : 'publishers'" 
          :showWorkCounts="false" 
          variant="solo-filled"
          bg-color="grey-lighten-3"
          rounded="pill"
          flat
          density="default"
          :hide-details="false"
          @update:model-value="onPublisherSelected"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="outline" rounded @click="isEditPublisherDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" rounded :disabled="!isPublisherFormValid" @click="savePublisher">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>


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
import EntityAutocomplete from '@/components/EntityAutocomplete.vue';

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

const editingSource       = ref(null);
const editingDisplayName  = ref(null);
const editingHomepageUrl  = ref(null);
const editingType         = ref(null);
const editingPublisherObj = ref(null);  
const editingIsOa         = ref(null);
const editingOaFlipYear   = ref(null);

const isEditDisplayNameDialogOpen       = ref(false);
const isEditPublisherDialogOpen         = ref(false);
const isEditTypeDialogOpen              = ref(false);
const isEditHomepageDialogOpen          = ref(false);
const isEditIsOaDialogOpen              = ref(false);
const isEditOaFlipYearDialogOpen        = ref(false);

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
const sourceTypes = ["journal", "repository", "book series", "conference", "ebook platform", "other"];

const editField = (field) => {
  if (!email.value) {
    router.push({ name: 'Login' });
    return;
  }
  switch (field) {
    case 'display_name':
      editDisplayName();
      break;
    case 'homepage_url':
      editHomepageUrl();
      break;
    case 'publisher':
      editPublisher();
      break;
    case 'type':
      editType();
      break;
    case 'is_oa':
      editIsOa();
      break;
    case 'oa_flip_year':
      editOaFlipYear();
      break;
  }
};

const editDisplayName = () => {
  editingDisplayName.value = editingSource.value.display_name;
  isEditDisplayNameDialogOpen.value = true;
};

const editHomepageUrl = () => {
  editingHomepageUrl.value = editingSource.value.homepage_url;
  isEditHomepageDialogOpen.value = true;
};

const editPublisher = () => {
  if (editingSource.value.host_organization) {
    editingPublisherObj.value = {id: editingSource.value.host_organization, display_name: editingSource.value.host_organization_name};
  } else {
    editingPublisherObj.value = null;
  }
  isEditPublisherDialogOpen.value = true;
};

const editType = () => {
  editingType.value = editingSource.value.type;
  isEditTypeDialogOpen.value = true;
};

const editIsOa = () => {
  editingIsOa.value = editingSource.value.is_oa;
  isEditIsOaDialogOpen.value = true;
};

const editOaFlipYear = () => {
  editingOaFlipYear.value = editingSource.value.oa_flip_year;
  isEditOaFlipYearDialogOpen.value = true;
};

const isDisplayNameFormValid = computed(() => {
  return editingDisplayName.value && editingDisplayName.value !== editingSource.value.display_name;
});

const isHomepageUrlFormValid = computed(() => {
  return editingHomepageUrl.value !== editingSource.value.homepage_url && isValidUrl(editingHomepageUrl.value);
});

const isPublisherFormValid = computed(() => {
  return editingPublisherObj.value && editingPublisherObj.value.id !== editingSource.value.host_organization;
});

const isTypeFormValid = computed(() => {
  return editingType.value !== editingSource.value.type;
});

const isOaFlipYearFormValid = computed(() => {
  return editingOaFlipYear.value !== editingSource.value.oa_flip_year && isYear(editingOaFlipYear.value);
});

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

const onPublisherSelected = (publisher) => {
  if (publisher) {
    editingPublisherObj.value = publisher;
  } else {
    editingPublisherObj.value = null;
  }
} 

const saveDisplayName = () => {
  const payload = {
    "field": "display_name",
    "value": editingDisplayName.value
  };
  submitCorrection(payload);
  isEditDisplayNameDialogOpen.value = false;
  editingSource.value.display_name = editingDisplayName.value;
};

const saveHomepageUrl = () => {
  const payload = {
    "field": "homepage_url",
    "value": editingHomepageUrl.value
  };
  submitCorrection(payload);
  isEditHomepageDialogOpen.value = false;
  editingSource.value.homepage_url = editingHomepageUrl.value;
};

const saveType = () => {
  const payload = {
    "field": "type",
    "value": editingType.value
  };
  submitCorrection(payload);
  isEditTypeDialogOpen.value = false;
  editingSource.value.type = editingType.value;
};

const savePublisher = () => {
  const publisherId = "https://openalex.org/" + editingPublisherObj.value.id.split('/')[1];
  const payload = {
    "field": "host_organization",
    "value": publisherId
  };
  submitCorrection(payload);
  isEditPublisherDialogOpen.value = false;
  editingSource.value.host_organization = publisherId;
  editingSource.value.host_organization_name = editingPublisherObj.value.display_name;
};

const saveIsOa = () => {
  const payload = {
    "field": "is_oa",
    "value": editingIsOa.value
  };
  submitCorrection(payload);
  isEditIsOaDialogOpen.value = false;
  editingSource.value.is_oa = editingIsOa.value;
};

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
.field-value a {
  color: inherit;
  text-decoration: none;
}
</style>
