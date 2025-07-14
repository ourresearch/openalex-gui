<template>
  <v-navigation-drawer 
    :model-value="isDrawerOpen" 
    @update:model-value="handleModelValueChange($event)" 
    temporary
    :disable-route-watcher="true"
    disable-resize-watcher
    :scroll-strategy="'none'"
    location="right" 
    width="700" 
    class="full-height-drawer"
  >
    <template v-if="workData">
      <v-card flat>
        <v-row>
          <v-col cols="10">
            <div class="text-h6 pt-12 px-8">
              {{ workData.title || '[Title Missing]' }}
            </div>
          </v-col>
          <v-col cols="2" class="text-right">
            <v-btn icon variant="plain" @click="emit('close')">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-col>
        </v-row>

        <!-- Links Section -->
        <div class="d-flex px-8 pt-3">
          <v-btn 
            color="blue-lighten-1" 
            size="small"
            variant="flat"
            :href="`https://api.openalex.org/${isV2 ? 'v2/' : ''}works/${workId}`"
            target="_blank"
            class="mr-1"
          >
            <v-icon start color="white">mdi-open-in-new</v-icon>
            API
          </v-btn>
          
          <v-btn 
            v-if="workData.primary_location?.landing_page_url"
            color="blue-lighten-1" 
            size="small"
            variant="outlined"
            :href="workData.primary_location.landing_page_url"
            target="_blank"
            class="mr-1"
          >
            <v-icon start color="blue">mdi-open-in-new</v-icon>
            Landing Page
          </v-btn>
          
          <v-btn 
            v-if="workData.primary_location?.pdf_url"
            variant="outlined"
            color="blue-lighten-1"
            size="small"
            :href="workData.primary_location.pdf_url"
            target="_blank"
            class="mr-1"
          >
            <v-icon start color="blue">mdi-open-in-new</v-icon>
            PDF
          </v-btn>
          <v-btn 
            variant="outlined"
            color="blue-lighten-1"
            size="small"
            @click="openZoomDrawer(workId)"
            class="mr-1"
          >
            <v-icon start color="blue">mdi-book-open-outline</v-icon>
            Prod Drawer
          </v-btn>
        </div>


        <v-card-text class="pa-8">          
          <!-- Authors Section -->
          <div class="text-body-2 mb-5 text-green-darken-1">
            <template v-if="workData.authorships && workData.authorships.length > 0">
              <span>
                {{ workData.authorships.map(a => a.raw_author_name).join(', ') }}
              </span>
            </template>
            <span v-else class="text-grey">No author information</span>
          </div>
          
          <!-- Primary Source Section -->
          <div class="text-overline">Primary Source</div>
          <v-row class="mb-2">
            <v-col cols="12">
              <v-card variant="outlined" class="pa-3" style="border-color: #f5f5f5">
                <div class="mb-1">
                  <strong>Source:</strong> <span>{{ workData.primary_location?.source?.display_name || 'Unknown' }}</span>
                </div>
                <div class="mb-1">
                  <strong>Open Access:</strong> <span>{{ workData.primary_location?.is_oa ? 'true' : 'false' }}</span>
                </div>
                <div v-if="workData.primary_location?.license" class="mb-1">
                  <strong>License:</strong> <span>{{ workData.primary_location.license }}</span>
                </div>
                <div v-if="workData.primary_location?.version" class="mb-0">
                  <strong>Version:</strong> <span>{{ workData.primary_location.version }}</span>
                </div>
              </v-card>
            </v-col>

            <v-col cols="12">
              <div class="text-overline">Metadata</div>
              <v-card variant="outlined" class="pa-3" style="border-color: #f5f5f5">
                <div class="mb-1">
                  <strong>Type:</strong> <span>{{ workData.type || 'Unknown' }}</span>
                </div>
                <div class="mb-1">
                  <strong>OA Status:</strong> <span>{{ workData.open_access?.oa_status || 'Unknown' }}</span>
                </div>
                <div class="mb-1">
                  <strong>Publication Date:</strong> <span>{{ workData.publication_date || workData.publication_year || 'Unknown date' }}</span>
                </div>
                <div v-if="workData.language" class="mb-1">
                  <strong>Language:</strong> <span>{{ workData.language.toUpperCase() }}</span>
                </div>
                <div class="mb-1">
                  <strong>Citations:</strong> <span>{{ workData.cited_by_count || 0 }}</span>
                </div>
                <div class="mb-1">
                  <strong>References:</strong> <span>{{ workData.referenced_works?.length || 0 }}</span>
                </div>
                <div v-if="workData.is_retracted !== undefined" class="mb-1">
                  <strong>Is Retracted:</strong> <span>{{ workData.is_retracted ? 'true' : 'false' }}</span>
                </div>
                <div class="d-flex align-center mb-1">
                  <strong>Updated:</strong>
                  <span class="ml-2">{{ workData.updated_date ? new Date(workData.updated_date).toLocaleString() : 'Unknown' }}</span>
                </div>
                <div class="d-flex align-center">
                  <strong>Created:</strong>
                  <span class="ml-2">{{ workData.created_date ? new Date(workData.created_date).toLocaleString() : 'Unknown' }}</span>
                </div>
              </v-card>
            </v-col>
          </v-row>
          
          <!-- IDs Section -->
          <div class="text-overline">IDs</div>
          <v-card variant="outlined" class="pa-3 mb-4" style="border-color: #f5f5f5">
            <div class="d-flex align-center mb-1" v-if="workData.ids?.doi">
              <strong>DOI:</strong>
              <a :href="`https://doi.org/${workData.ids.doi}`" target="_blank" class="ml-2 text-decoration-none">
                {{ workData.ids.doi }}
              </a>
            </div>
            <div class="d-flex align-center">
              <strong>OpenAlex ID:</strong>
              <span class="ml-2">{{ workData.id }}</span>
            </div>
          </v-card>

          <!-- Bibliography Section -->
          <div v-if="workData.biblio && Object.values(workData.biblio).some(v => v)" class="mb-4">
            <div class="text-overline">Bibliography</div>
            <v-card variant="outlined" class="pa-3" style="border-color: #f5f5f5">
              <div v-if="workData.biblio.volume" class="mb-1">
                <strong>Volume:</strong> <span>{{ workData.biblio.volume }}</span>
              </div>
              <div v-if="workData.biblio.issue" class="mb-1">
                <strong>Issue:</strong> <span>{{ workData.biblio.issue }}</span>
              </div>
              <div v-if="workData.biblio.first_page || workData.biblio.last_page" class="">
                <strong>Pages:</strong> <span>{{ workData.biblio.first_page || '' }}{{ workData.biblio.first_page && workData.biblio.last_page ? '-' : '' }}{{ workData.biblio.last_page || '' }}</span>
              </div>
            </v-card>
          </div>
                    
        </v-card-text>
      </v-card>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { useStore } from 'vuex';

defineProps({
  workId: {
    type: String,
    default: null
  },
  workData: {
    type: Object,
    default: null
  },
  isDrawerOpen: {
    type: Boolean,
    default: false
  },
  isV2: {
    type: Boolean,
    default: true,
  }
});

const emit = defineEmits(['close']);

const store = useStore();


function handleModelValueChange(value) {
  if (value === false) {
    emit('close');
  }
}

function openZoomDrawer(id) {
  emit("close");
  store.commit('setZoomId', "v2/works/" + id);
}
</script>


<style scoped>
.v-navigation-drawer {
  height: 100% !important;
  top: 0 !important;
  z-index: 10000 !important;
}
</style>
