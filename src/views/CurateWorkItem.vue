<template>
  <div class="py-0 sm:py-12 min-h-[70vh]" ref="scrollContainer">
    <div class="container mx-auto px-0 sm:px-4 max-w-[900px]">
      <nav class="flex items-center gap-1 text-sm text-muted-foreground px-0 -mt-10 mb-4">
        <router-link to="/curate" class="hover:text-foreground">Curate</router-link>
        <span>›</span>
        <router-link :to="worksBackUrl" class="hover:text-foreground">Works</router-link>
        <span>›</span>
        <span>{{ workId }}</span>
      </nav>
        
      <div class="flex items-center justify-between mb-4 min-h-[44px]">
        <h1 class="text-2xl font-bold">{{ editingWork?.display_name || "Loading..." }}</h1>
        
        <!-- Dots Menu -->
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical class="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a :href="`https://openalex.org/${editingWork?.id}`" target="_blank" class="flex items-center">
                <FileText class="h-4 w-4 mr-2" />
                Work profile
                <ExternalLink class="h-3 w-3 ml-1 text-muted-foreground" />
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a :href="`https://api.openalex.org/${editingWork?.id}?data-version=2`" target="_blank" class="flex items-center">
                <Code class="h-4 w-4 mr-2" />
                New API
                <ExternalLink class="h-3 w-3 ml-1 text-muted-foreground" />
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a :href="`https://api.openalex.org/${editingWork?.id}`" target="_blank" class="flex items-center">
                <Code class="h-4 w-4 mr-2" />
                Old API
                <ExternalLink class="h-3 w-3 ml-1 text-muted-foreground" />
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem v-if="editingWork?.doi" asChild>
              <a :href="`https://api.unpaywall.org/v2/${editingWork.doi.replace('https://doi.org/', '')}?email=team@ourresearch.org`" target="_blank" class="flex items-center">
                <Code class="h-4 w-4 mr-2" />
                Unpaywall API
                <ExternalLink class="h-3 w-3 ml-1 text-muted-foreground" />
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem v-if="editingWork?.doi" asChild>
              <a :href="editingWork.doi" target="_blank" class="flex items-center">
                <Home class="h-4 w-4 mr-2" />
                DOI
                <ExternalLink class="h-3 w-3 ml-1 text-muted-foreground" />
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div class="mb-2 flex gap-2">
        <Button 
          :variant="tab === 'basic' ? 'default' : 'ghost'" 
          class="rounded-full"
          @click="tab = 'basic'"
        >
          Basic Metadata
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              :variant="tab === 'locations' ? 'default' : 'ghost'" 
              class="rounded-full"
              @click="tab = 'locations'"
            >
              Locations
              <Info class="h-4 w-4 ml-1" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Locations where this work is hosted on the web</TooltipContent>
        </Tooltip>
      </div>

      <Card class="p-4 pt-2">   
        <div v-if="!editingWork" class="animate-pulse space-y-3 py-4">
          <div v-for="i in 3" :key="i" class="h-12 bg-muted rounded"></div>
        </div>
        
        <div v-else-if="errorMessage" class="text-muted-foreground py-4">
          {{ errorMessage }}
        </div>

        <div v-else>
          <CardContent class="pt-6 text-base">

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

              <Card 
                class="bg-muted p-6 mt-4 cursor-pointer hover:bg-muted/80 transition-colors flex items-center gap-2"
                @click="showNewLocationDialog = true"
              >
                <Plus class="h-6 w-6 text-muted-foreground" />
                Add new location
              </Card>              
            </template>

          </CardContent>
        </div>
      </Card>

    </div>

    <!-- New Location Dialog -->
    <Dialog v-model:open="showNewLocationDialog">
      <DialogContent class="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add new location</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-6">
          <div>
            <RadioGroup v-model="newLocationIsOaStr" class="flex gap-4">
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="true" id="oa-true" />
                <Label for="oa-true">Open Access</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="false" id="oa-false" />
                <Label for="oa-false">Closed Access</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <div v-if="newLocationSourceObj"> 
              <Badge variant="secondary" class="h-14 px-4 text-sm">
                {{ newLocationSourceObj.display_name.length > 70 ? newLocationSourceObj.display_name.slice(0, 70) + '...' : newLocationSourceObj.display_name }}
                <Button variant="ghost" size="icon" class="h-6 w-6 ml-2" @click="newLocationSourceObj = null">
                  <X class="h-4 w-4" />
                </Button>
              </Badge>
              <p class="text-xs text-muted-foreground mt-2 px-1">The journal or repository hosting this work online (Required)</p>
            </div>
            <div v-else>
              <entity-autocomplete
                :entityType="'sources'" 
                :showWorkCounts="false" 
                placeholder="Source"
                @update:model-value="onSourceSelected"
              />
              <p class="text-xs text-muted-foreground mt-2 px-1">The journal or repository hosting this work online (Required)</p>
            </div>
          </div>

          <div class="space-y-2">
            <Label>Landing Page URL</Label>
            <Input 
              v-model="newLocationLandingPageUrl" 
              placeholder="https://example.com/article"
            />
            <p class="text-xs text-muted-foreground">The primary URL for this work (Required)</p>
          </div>

          <div class="space-y-2">
            <Label>PDF URL</Label>
            <Input 
              v-model="newLocationPdfUrl" 
              placeholder="https://example.com/article.pdf"
            />
            <p class="text-xs text-muted-foreground">URL of a fulltext PDF of this work</p>
          </div>

          <div class="space-y-2">
            <Label>Version</Label>
            <Select v-model="newLocationVersion">
              <SelectTrigger>
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="v in versions" :key="v.value" :value="v.value">
                  <div>
                    <div>{{ v.title }}</div>
                    <div class="text-xs text-muted-foreground">{{ v.subtitle }}</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">The version of this copy of the work</p>
          </div>

          <div class="space-y-2">
            <Label>License</Label>
            <Select v-model="newLocationLicense">
              <SelectTrigger>
                <SelectValue placeholder="Select license" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="l in licenses" :key="l.value" :value="l.value">
                  {{ l.title }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showNewLocationDialog = false">Cancel</Button>
          <Button :disabled="!isNewLocationFormValid" @click="addNewLocation">Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>

</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

import axios from 'axios';
import ShortUniqueId from 'short-uuid';

import { MoreVertical, FileText, Code, ExternalLink, Home, Info, Plus, X } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
const newLocationIsOaStr = computed({
  get: () => newLocationIsOa.value ? 'true' : 'false',
  set: (val) => { newLocationIsOa.value = val === 'true'; }
});
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
</style>
