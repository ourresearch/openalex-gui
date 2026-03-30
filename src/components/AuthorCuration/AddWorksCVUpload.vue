<template>
  <div class="cv-upload">
    <div class="text-body-2 text-medium-emphasis mb-4">
      Upload your CV or publication list and we'll match your publications to OpenAlex records.
      Supported formats: .txt, .pdf, .doc, .docx
    </div>

    <!-- Upload zone (hide after results) -->
    <template v-if="!parseResults">
      <div
        class="upload-zone"
        :class="{ 'upload-zone--dragover': isDragOver }"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-file-upload-outline</v-icon>
        <div class="text-body-2">
          Drag and drop your file here, or <span class="text-primary" style="cursor: pointer">browse</span>
        </div>
        <div class="text-caption text-medium-emphasis mt-1">
          .txt, .pdf, .doc, .docx
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept=".txt,.pdf,.doc,.docx"
        style="display: none"
        @change="handleFileSelect"
      />

      <!-- Selected file -->
      <div v-if="selectedFile" class="selected-file mt-3 d-flex align-center">
        <v-icon size="18" class="mr-2">mdi-file-document-outline</v-icon>
        <span class="text-body-2">{{ selectedFile.name }}</span>
        <v-spacer />
        <v-btn icon variant="text" size="x-small" @click="selectedFile = null">
          <v-icon size="16">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Upload button -->
      <div v-if="selectedFile && !isProcessing" class="mt-4">
        <v-btn color="primary" variant="flat" rounded :loading="isProcessing" @click="processFile">
          Parse publications
        </v-btn>
      </div>

      <!-- Processing -->
      <div v-if="isProcessing" class="mt-4 d-flex align-center text-body-2 text-medium-emphasis">
        <v-progress-circular indeterminate size="20" width="2" class="mr-3" />
        {{ currentLoadingMessage }}
      </div>

      <!-- Error -->
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-4 text-body-2">
        {{ errorMessage }}
      </v-alert>
    </template>

    <!-- Results -->
    <div v-if="parseResults" class="parse-results">
      <!-- Summary -->
      <div class="parse-summary mb-2">
        <div class="text-body-1 font-weight-bold">
          Parsed {{ parseResults.totalParsed }} publications from your CV
        </div>
      </div>

      <!-- Tabs for results categories -->
      <v-tabs v-model="resultsTab" density="compact">
        <v-tab value="addable" class="cv-tab cv-tab--addable">
          <v-icon size="14" start class="mr-1" color="#4CAF50">mdi-plus-circle</v-icon>
          Add ({{ addableWorks.length }})
        </v-tab>
        <v-tab value="linked" class="cv-tab cv-tab--linked">
          <v-icon size="14" start class="mr-1" color="grey">mdi-check-circle</v-icon>
          Already matched ({{ alreadyLinkedCount }})
        </v-tab>
        <v-tab value="unmatched" class="cv-tab cv-tab--unmatched">
          <v-icon size="14" start class="mr-1" color="#FF9800">mdi-help-circle</v-icon>
          Not found ({{ parseResults.unmatched.length }})
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="resultsTab">
        <!-- Works to add -->
        <v-window-item value="addable">
          <div v-if="addableWorks.length === 0" class="pa-4 text-body-2 text-medium-emphasis">
            No new works to add from your CV.
          </div>
          <div v-else>
            <div
              v-for="(item, idx) in addableWorks"
              :key="idx"
              class="cv-result-item"
              :class="{ 'cv-result-item--selected': item._isSelected }"
            >
              <div class="d-flex align-start">
                <!-- Checkbox -->
                <v-checkbox
                  v-model="item._isSelected"
                  hide-details
                  density="compact"
                  class="cv-result-checkbox mt-0 pt-0 mr-2"
                  :disabled="!item._authorshipConfirmed"
                />

                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-medium">
                    {{ item.oaWork.display_name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.oaWork.publication_year }}
                    <span v-if="item.oaWork.primary_location?.source?.display_name">
                      · <span class="font-italic">{{ item.oaWork.primary_location.source.display_name }}</span>
                    </span>
                  </div>

                  <!-- Authorship matching: show candidate names -->
                  <div class="mt-2" v-if="item._matchState !== 'added'">
                    <template v-if="item._candidateAuthorships && item._candidateAuthorships.length > 0">
                      <div class="text-caption text-medium-emphasis mb-1">Select your name on this work:</div>
                      <div class="d-flex flex-wrap ga-1">
                        <v-chip
                          v-for="(candidate, cidx) in item._candidateAuthorships"
                          :key="cidx"
                          size="small"
                          :variant="item._selectedIdx === candidate.idx ? 'flat' : 'outlined'"
                          :color="item._selectedIdx === candidate.idx ? 'primary' : undefined"
                          @click="selectCvAuthorship(item, candidate.idx)"
                        >
                          {{ candidate.authorship.raw_author_name || candidate.authorship.author?.display_name || 'Unknown' }}
                        </v-chip>
                      </div>
                      <div class="text-caption text-medium-emphasis mt-1">
                        Not listed?
                        <a href="#" @click.prevent="showCvAllAuthors(item)" class="text-primary">Show all authors</a>
                        ·
                        <a href="mailto:support@openalex.org">Contact support</a>
                      </div>
                    </template>

                    <template v-else-if="item._showAllAuthors">
                      <div class="text-caption text-medium-emphasis mb-1">Select your name:</div>
                      <div class="d-flex flex-wrap ga-1">
                        <v-chip
                          v-for="(authorship, aidx) in item.oaWork.authorships"
                          :key="aidx"
                          size="small"
                          :variant="item._selectedIdx === aidx ? 'flat' : 'outlined'"
                          :color="item._selectedIdx === aidx ? 'primary' : undefined"
                          @click="selectCvAuthorship(item, aidx)"
                        >
                          {{ authorship.raw_author_name || authorship.author?.display_name || 'Unknown' }}
                        </v-chip>
                      </div>
                      <div class="text-caption text-medium-emphasis mt-1">
                        Not here? <a href="mailto:support@openalex.org">Contact support</a>
                      </div>
                    </template>
                  </div>

                  <div v-else class="mt-1">
                    <span class="text-caption" style="color: #2E7D32;">
                      <v-icon size="14" color="success" class="mr-1">mdi-check-circle</v-icon>
                      Curation request submitted
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sticky footer for CV add tab -->
            <div v-if="cvSelectedCount > 0" class="cv-add-footer">
              <v-divider />
              <div class="cv-add-footer-content">
                <span class="text-body-2">
                  {{ cvSelectedCount }} work{{ cvSelectedCount === 1 ? '' : 's' }} selected
                </span>
                <v-btn
                  color="primary"
                  variant="flat"
                  rounded
                  size="small"
                  @click="submitCvSelectedWorks"
                >
                  Add works
                </v-btn>
              </div>
            </div>
          </div>
        </v-window-item>

        <!-- Already on profile (grey) -->
        <v-window-item value="linked">
          <div v-if="alreadyLinkedCount === 0" class="pa-4 text-body-2 text-medium-emphasis">
            No works from your CV are already on your profile.
          </div>
          <div v-else>
            <div
              v-for="(item, idx) in alreadyLinked"
              :key="'linked-' + idx"
              class="cv-result-item cv-result-item--linked"
            >
              <v-icon size="14" color="grey" class="mr-2">mdi-check-circle</v-icon>
              <div>
                <span class="text-body-2">{{ item.oaWork.display_name }}</span>
                <span class="text-caption text-medium-emphasis ml-1">{{ item.oaWork.publication_year }}</span>
              </div>
            </div>
          </div>
        </v-window-item>

        <!-- Not found in OpenAlex (orange) -->
        <v-window-item value="unmatched">
          <div v-if="parseResults.unmatched.length === 0" class="pa-4 text-body-2 text-medium-emphasis">
            All publications were found in OpenAlex.
          </div>
          <div v-else>
            <div
              v-for="(pub, idx) in parseResults.unmatched"
              :key="'unmatched-' + idx"
              class="cv-result-item cv-result-item--unmatched"
            >
              <v-icon size="14" color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
              <div>
                <span class="text-body-2">{{ pub.title }}</span>
                <span v-if="pub.year" class="text-caption text-medium-emphasis ml-1">({{ pub.year }})</span>
              </div>
            </div>
          </div>
        </v-window-item>
      </v-window>

      <!-- Start over -->
      <div class="mt-4">
        <v-btn variant="text" rounded size="small" @click="resetResults">
          Upload a different file
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AddWorksCVUpload' });

// Fun rotating loading messages
const loadingMessages = [
  'Parsing your publications...',
  'Searching the scholarly record...',
  'Matching titles across almost 500M works...',
  'Your CV is impressive, by the way...',
  'Cross-referencing with OpenAlex...',
  'Almost there — double-checking matches...',
  'Reading between the lines (literally)...',
  'Connecting the dots across databases...',
  'Doing in seconds what used to take librarians hours...',
  'Teaching an AI to read your CV — one publication at a time...',
  'Sifting through the world\'s research...',
  'If only peer review were this fast...',
];

const currentLoadingMessage = ref(loadingMessages[0]);
let loadingInterval = null;

function startLoadingMessages() {
  let lastIdx = 0;
  currentLoadingMessage.value = loadingMessages[0];
  loadingInterval = setInterval(() => {
    let idx;
    do {
      idx = Math.floor(Math.random() * loadingMessages.length);
    } while (idx === lastIdx);
    lastIdx = idx;
    currentLoadingMessage.value = loadingMessages[idx];
  }, 4000);
}

function stopLoadingMessages() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
}

onBeforeUnmount(() => stopLoadingMessages());

const props = defineProps({
  authorName: String,
  authorId: String,
});

const emit = defineEmits(['add-work']);

const fileInput = ref(null);
const selectedFile = ref(null);
const isDragOver = ref(false);
const isProcessing = ref(false);
const parseResults = ref(null);
const errorMessage = ref('');
const resultsTab = ref('addable');

const allowedExtensions = ['.txt', '.pdf', '.doc', '.docx'];

// CV parse server URL — uses proxy server (local dev or production)
const CV_PARSE_URL = `${urlBase.cvParseApi}/api/parse-cv`;

function isValidFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  return allowedExtensions.includes(ext);
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event) {
  const file = event.target.files?.[0];
  if (file && isValidFile(file)) {
    selectedFile.value = file;
    parseResults.value = null;
    errorMessage.value = '';
  }
}

function handleDrop(event) {
  isDragOver.value = false;
  const file = event.dataTransfer.files?.[0];
  if (file && isValidFile(file)) {
    selectedFile.value = file;
    parseResults.value = null;
    errorMessage.value = '';
  }
}

function normalizeName(name) {
  if (!name) return '';
  let n = name.trim();
  if (n.includes(',')) {
    const parts = n.split(',').map(p => p.trim());
    n = parts.reverse().join(' ');
  }
  return n.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
}

function nameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;
  const a = normalizeName(name1);
  const b = normalizeName(name2);
  if (a === b) return 1;
  const aWords = a.split(' ');
  const bWords = b.split(' ');
  const aLast = aWords[aWords.length - 1];
  const bLast = bWords[bWords.length - 1];
  if (aLast !== bLast) return 0;
  const aFirst = aWords[0] || '';
  const bFirst = bWords[0] || '';
  if (aFirst === bFirst) return 1;
  if (aFirst.startsWith(bFirst) || bFirst.startsWith(aFirst)) return 0.9;
  if (aFirst[0] === bFirst[0]) return 0.7;
  return 0.6;
}

function findCandidateAuthorships(work) {
  if (!work.authorships || work.authorships.length === 0) return [];
  const candidates = [];
  work.authorships.forEach((authorship, idx) => {
    const score = Math.max(
      nameSimilarity(props.authorName, authorship.raw_author_name || ''),
      nameSimilarity(props.authorName, authorship.author?.display_name || '')
    );
    if (score >= 0.6) {
      candidates.push({ idx, authorship, score });
    }
  });
  return candidates.sort((a, b) => b.score - a.score);
}

const alreadyLinked = computed(() =>
  parseResults.value?.matched?.filter(m => m.alreadyLinked) || []
);

const alreadyLinkedCount = computed(() => alreadyLinked.value.length);

const addableWorks = computed(() =>
  parseResults.value?.matched?.filter(m => !m.alreadyLinked) || []
);

async function processFile() {
  if (!selectedFile.value) return;
  isProcessing.value = true;
  errorMessage.value = '';
  startLoadingMessages();

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('authorId', props.authorId || '');
    formData.append('authorName', props.authorName || '');

    const authHeaders = axiosConfig({ userAuth: true }).headers || {};
    const resp = await axios.post(CV_PARSE_URL, formData, {
      headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min timeout for large CVs
    });

    const data = resp.data;

    // Run authorship matching on addable works (same UX as search)
    data.matched.forEach(item => {
      if (!item.alreadyLinked) {
        const candidates = findCandidateAuthorships(item.oaWork);
        item._candidateAuthorships = candidates;
        item._showAllAuthors = candidates.length === 0;
        item._isSelected = false;
        item._authorshipConfirmed = false;
        item._matchState = 'pending';

        // Auto-select if exactly one strong match
        if (candidates.length === 1 && candidates[0].score >= 0.7) {
          item._selectedIdx = candidates[0].idx;
          item._authorshipConfirmed = true;
          item._isSelected = true;
        } else {
          item._selectedIdx = null;
        }
      }
    });

    parseResults.value = data;
  } catch (err) {
    console.error('CV parse error:', err);
    errorMessage.value = err.response?.data?.error || 'Failed to parse CV. Please try again.';
  } finally {
    stopLoadingMessages();
    isProcessing.value = false;
  }
}

function showCvAllAuthors(item) {
  item._showAllAuthors = true;
  item._candidateAuthorships = [];
}

function selectCvAuthorship(item, idx) {
  item._selectedIdx = idx;
  item._authorshipConfirmed = true;
  item._isSelected = true;
}

const cvSelectedCount = computed(() =>
  addableWorks.value.filter(w => w._isSelected && w._authorshipConfirmed).length
);

function submitCvSelectedWorks() {
  const selected = addableWorks.value.filter(w => w._isSelected && w._authorshipConfirmed);
  selected.forEach(item => {
    const authorship = item.oaWork.authorships[item._selectedIdx];
    item._matchState = 'added';
    emit('add-work', {
      workId: item.oaWork.id,
      authorshipIdx: item._selectedIdx,
      authorship,
    });
  });
}

function resetResults() {
  parseResults.value = null;
  selectedFile.value = null;
  errorMessage.value = '';
  if (fileInput.value) fileInput.value.value = '';
}
</script>

<style scoped>
.upload-zone {
  border: 2px dashed #E0E0E0;
  border-radius: 12px;
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}

.upload-zone:hover {
  border-color: #BDBDBD;
  background: #FAFAFA;
}

.upload-zone--dragover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.selected-file {
  padding: 8px 12px;
  background: #F5F5F5;
  border-radius: 8px;
}

.parse-summary {
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.cv-result-item {
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.cv-result-item:last-child {
  border-bottom: none;
}

.cv-result-item--selected {
  background: rgba(var(--v-theme-primary), 0.04);
}

.cv-result-checkbox {
  flex-shrink: 0;
}

.cv-result-item--linked {
  display: flex;
  align-items: flex-start;
  color: rgba(0, 0, 0, 0.5);
}

.cv-result-item--unmatched {
  display: flex;
  align-items: flex-start;
  color: rgba(0, 0, 0, 0.5);
}

.cv-add-footer {
  position: sticky;
  bottom: 0;
  background: white;
  z-index: 1;
}

.cv-add-footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
}
</style>
