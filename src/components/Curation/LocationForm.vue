<template>
  <Card class="location-form px-6 pt-6 pb-2 bg-muted">
    <div v-if="titleChips" class="mb-4 flex gap-2">
      <Badge v-for="chip in titleChips" :key="chip" variant="secondary">
        <template v-if="chip === 'primary'">
          Primary location
          <Tooltip>
            <TooltipTrigger asChild>
              <Info class="h-3 w-3 ml-1 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>This is the canonical primary location for this work</TooltipContent>
          </Tooltip>        
        </template>
        <template v-else-if="chip === 'best_oa'">
          Best Open Access location
          <Tooltip>
            <TooltipTrigger asChild>
              <Info class="h-3 w-3 ml-1 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>This is the best Open Access location available for this work</TooltipContent>
          </Tooltip>
        </template>
      </Badge>
    </div>
    <div class="field">
      <div class="field-label">
        Source
        <Tooltip>
          <TooltipTrigger asChild>
            <Info class="h-3 w-3 ml-1 text-muted-foreground inline" />
          </TooltipTrigger>
          <TooltipContent>The journal or repository that hosts this location</TooltipContent>
        </Tooltip>
        :
      </div>
      <div class="field-value">
        <span v-if="location.source.display_name">{{ location.source.display_name }}</span>
        <span v-else class="text-muted-foreground">None</span>
      </div>
    </div>

    <div class="field">
      <div class="field-label">
        Is OA
        <Tooltip>
          <TooltipTrigger asChild>
            <Info class="h-3 w-3 ml-1 text-muted-foreground inline" />
          </TooltipTrigger>
          <TooltipContent>Whether this work is Open Access or not.</TooltipContent>
        </Tooltip>
        :
      </div>
      <code class="field-value">{{ location.is_oa }}</code>
    </div>

    <div class="field">
      <div class="field-label">
        Landing page URL
        <Tooltip>
          <TooltipTrigger asChild>
            <Info class="h-3 w-3 ml-1 text-muted-foreground inline" />
          </TooltipTrigger>
          <TooltipContent>The URL of the landing page for this work where the full text HTML might be found</TooltipContent>
        </Tooltip>
        :
      </div>
      <div class="field-value">
        <a v-if="location.landing_page_url" :href="location.landing_page_url" target="_blank" class="hover:underline">
          <code>{{ location.landing_page_url }}</code>
        </a>
        <span v-else class="text-muted-foreground">None</span>
      </div>
    </div>

    <div class="field">
      <div class="field-label">
        PDF URL
        <Tooltip>
          <TooltipTrigger asChild>
            <Info class="h-3 w-3 ml-1 text-muted-foreground inline" />
          </TooltipTrigger>
          <TooltipContent>The open access URL where the full text PDF for this work can be found</TooltipContent>
        </Tooltip>
        :
      </div>
      <div class="field-value">
        <a v-if="location.pdf_url" :href="location.pdf_url" target="_blank" class="hover:underline">
          <code>{{ location.pdf_url }}</code>
        </a>
        <span v-else class="text-muted-foreground">None</span>
        
        <Tooltip v-if="pendingCorrections.includes(`${location.id}|pdf_url`)">
          <TooltipTrigger asChild>
            <Hourglass class="h-4 w-4 ml-1 text-muted-foreground inline" />
          </TooltipTrigger>
          <TooltipContent>A correction is currently pending for this attribute. It will be processed within 2 days.</TooltipContent>
        </Tooltip>
        <Button v-else variant="ghost" size="icon" class="h-6 w-6 ml-2" @click="editField('pdfUrl')">
          <Pencil class="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>

    <div class="field">
      <div class="field-label">
        License
        <Tooltip>
          <TooltipTrigger asChild>
            <Info class="h-3 w-3 ml-1 text-muted-foreground inline" />
          </TooltipTrigger>
          <TooltipContent>The license under which this work is published</TooltipContent>
        </Tooltip>
        :
      </div>
      <div class="field-value">
        <span v-if="location.license"> 
          {{ licenseName(location.license) }}
        </span>
        <span v-else class="text-muted-foreground">None</span>
        <Tooltip v-if="pendingCorrections.includes(`${location.id}|license`)">
          <TooltipTrigger asChild>
            <Hourglass class="h-4 w-4 ml-1 text-muted-foreground inline" />
          </TooltipTrigger>
          <TooltipContent>A correction is currently pending for this attribute. It will be processed within 2 days.</TooltipContent>
        </Tooltip>
        <Button v-else-if="isLicenseEditable" variant="ghost" size="icon" class="h-6 w-6 ml-2" @click="editField('license')">
          <Pencil class="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  </Card>


  <!-- Edit PDF URL Dialog -->
  <Dialog v-model:open="isEditPdfUrlDialogOpen">
    <DialogContent class="max-w-[580px]">
      <DialogHeader>
        <DialogTitle>{{ location.pdf_url ? 'Change' : 'Add' }} PDF URL</DialogTitle>
      </DialogHeader>
      <Alert v-if="isAcademicNetwork" variant="warning" class="mb-4">
        <AlertTriangle class="h-4 w-4" />
        <AlertDescription>
          <b>You are visiting from an academic network.</b>
          <br/>
          Please be sure this URL is open for everyone by checking the page for signs of institutional subscription or by opening the URL from another network like your phone's.
        </AlertDescription>
      </Alert>
      <Input v-model="editingPdfUrl" placeholder="PDF URL" />
      <p class="text-sm text-muted-foreground mt-2">
        A URL of an Open Access PDF of the fulltext of this work.
        <span v-if="location.pdf_url" class="block mt-2">
          If the current link does not give access, you may correct it or remove it.
        </span>
      </p>
      <DialogFooter>
        <Button variant="ghost" @click="isEditPdfUrlDialogOpen = false">Cancel</Button>
        <Button :disabled="!isPdfUrlFormValid" @click="savePdfUrl">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>


  <!-- Edit License Dialog -->
  <Dialog v-model:open="isEditLicenseDialogOpen">
    <DialogContent class="max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Change license</DialogTitle>
      </DialogHeader>
      <Select v-model="editingLicense">
        <SelectTrigger>
          <SelectValue placeholder="Select a license" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="license in licenses" :key="license.value" :value="license.value">
            {{ license.title }}
          </SelectItem>
        </SelectContent>
      </Select>
      <DialogFooter>
        <Button variant="ghost" @click="isEditLicenseDialogOpen = false">Cancel</Button>
        <Button :disabled="!isLicenseFormValid" @click="saveLicense">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>


</template>

<script setup>

import { ref, computed, watch, toRef } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import { Info, Hourglass, Pencil, AlertTriangle } from 'lucide-vue-next';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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

    
    