<template>
  <v-dialog
    :key="showExportProgress ? 'export' : 'works'"
    :model-value="modelValue"
    @update:model-value="onDialogModel"
    :max-width="showExportProgress ? 420 : 900"
    :persistent="showExportProgress && !exportDone && !exportError"
  >
    <!-- Works list -->
    <v-card v-if="!showExportProgress">
      <v-card-title class="d-flex align-center pa-4">
        <div class="dialog-title text-body-1">
          {{ rasText }}
        </div>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="$emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <div ref="scrollContainer" class="works-scroll-container">
        <template v-if="works.length">
          <div
            v-for="work in works"
            :key="work.id"
            class="work-item"
            @click="openLandingPage(work)"
          >
            <div class="d-flex align-start">
              <div class="flex-grow-1 min-width-0">
                <div class="text-body-2 font-weight-medium">{{ work.title || 'Untitled' }}</div>
                <div class="text-caption text-grey-darken-1 mt-1">
                  {{ work.publication_year }}<template v-if="getSourceName(work)"> &middot; {{ getSourceName(work) }}</template>
                </div>
              </div>
              <v-menu location="bottom end">
                <template v-slot:activator="{ props: menuProps }">
                  <v-btn
                    v-bind="menuProps"
                    icon
                    variant="text"
                    size="x-small"
                    class="ml-2 mt-n1 menu-btn"
                    @click.stop
                  >
                    <v-icon size="18">mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item @click="openApiPage(work)">
                    <v-list-item-title>View in OpenAlex API</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="openOpenAlexPage(work)">
                    <v-list-item-title>View OpenAlex landing page</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="copyToClipboard(work)">
                    <v-list-item-title>Copy to clipboard</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
        </template>

        <div v-if="isLoading" class="d-flex justify-center pa-4">
          <v-progress-circular indeterminate size="24" />
        </div>

        <div v-if="!isLoading && works.length === 0" class="text-center pa-6 text-grey">
          No works found for this affiliation.
        </div>

        <div v-if="errorMsg" class="pa-4">
          <v-alert type="error" variant="tonal">{{ errorMsg }}</v-alert>
        </div>

        <!-- Infinite scroll sentinel -->
        <div ref="sentinel" style="height: 1px;" />
      </div>

      <v-divider />

      <v-card-actions class="px-4">
        <span class="text-caption text-grey-darken-1">
          {{ works.length }} of {{ totalWorks.toLocaleString() }} works loaded
        </span>
        <v-spacer />
        <v-btn
          variant="text"
          size="small"
          :loading="isExporting"
          :disabled="isExporting || totalWorks === 0"
          @click="exportCsv"
        >
          Export CSV
        </v-btn>
        <v-btn variant="text" size="small" @click="$emit('update:modelValue', false)">Close</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Export progress (same dialog, swapped content) -->
    <v-card v-else class="export-card" elevation="0">
      <div class="pa-6">
        <div class="d-flex align-center mb-1">
          <span class="export-title">
            {{ exportError ? 'Export failed' : exportDone ? 'Export complete' : 'Exporting works' }}
          </span>
          <v-spacer />
          <v-icon v-if="exportDone" color="success" size="20">mdi-check-circle</v-icon>
          <v-icon v-else-if="exportError" color="error" size="20">mdi-alert-circle</v-icon>
        </div>
        <div class="export-subtitle mb-5">{{ rasText }}</div>

        <template v-if="!exportError">
          <div class="d-flex align-baseline mb-3">
            <span class="export-count">{{ exportLoaded.toLocaleString() }}</span>
            <span class="export-total">&nbsp;/ {{ exportTotalDisplay }} works</span>
            <v-spacer />
            <span class="export-pct">{{ exportPct }}%</span>
          </div>

          <v-progress-linear
            :model-value="exportPct"
            :indeterminate="!exportTarget && !exportDone"
            height="6"
            rounded
            :color="exportDone ? 'success' : 'primary'"
            bg-color="grey-lighten-3"
          />

          <div v-if="exportTruncated && exportDone" class="export-note mt-4">
            This affiliation has more than {{ EXPORT_MAX.toLocaleString() }} works — exported the
            first {{ exportTotalDisplay }}.
          </div>
        </template>

        <div v-else class="export-note-error mt-1">{{ exportError }}</div>

        <div class="d-flex justify-end mt-6" style="gap: 8px;">
          <v-btn
            v-if="!exportDone && !exportError"
            variant="text"
            size="small"
            @click="cancelExport"
          >
            Cancel
          </v-btn>
          <v-btn v-else variant="flat" color="primary" size="small" @click="finishExport">
            Done
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { exportArrayToCsv } from '@/utils/csvExport';

defineOptions({ name: 'RasWorksDialog' });

const props = defineProps({
  modelValue: Boolean,
  rasText: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const store = useStore();
const works = ref([]);
const isLoading = ref(false);
const errorMsg = ref(null);
const page = ref(1);
const totalWorks = ref(0);
const hasMore = ref(true);
const scrollContainer = ref(null);
const sentinel = ref(null);
let observer = null;

// OpenAlex caps offset paging at 10,000 results (page * per_page <= 10,000),
// so this is both our export cap and the API's basic-paging ceiling.
const EXPORT_MAX = 10000;
const isExporting = ref(false);

// Export progress dialog state
const showExportProgress = ref(false);
const exportLoaded = ref(0);
const exportTotal = ref(0);
const exportDone = ref(false);
const exportError = ref(null);
const exportCancelled = ref(false);
const exportTruncated = ref(false);

// Total we can actually fetch (offset paging is capped at EXPORT_MAX).
const exportTarget = computed(() => Math.min(exportTotal.value || 0, EXPORT_MAX));
const exportPct = computed(() => {
  if (exportDone.value) return 100;
  if (!exportTarget.value) return 0;
  return Math.min(100, Math.round((exportLoaded.value / exportTarget.value) * 100));
});
const exportTotalDisplay = computed(() =>
  exportTarget.value ? exportTarget.value.toLocaleString() : '—'
);

function getSourceName(work) {
  return work.primary_location?.source?.display_name || null;
}

function getWorkShortId(work) {
  if (!work.id) return null;
  return work.id.replace('https://openalex.org/', '');
}

function getLandingPageUrl(work) {
  return work.doi || work.primary_location?.landing_page_url || null;
}

function openLandingPage(work) {
  const url = getLandingPageUrl(work);
  if (url) {
    window.open(url, '_blank');
  }
}

function openApiPage(work) {
  const shortId = getWorkShortId(work);
  if (shortId) {
    window.open(`https://api.openalex.org/works/${shortId}`, '_blank');
  }
}

function openOpenAlexPage(work) {
  const shortId = getWorkShortId(work);
  if (shortId) {
    window.open(`https://openalex.org/works/${shortId}`, '_blank');
  }
}

async function copyToClipboard(work) {
  const shortId = getWorkShortId(work);
  const parts = [work.title || 'Untitled'];
  if (work.publication_year) parts.push(`(${work.publication_year})`);
  if (getSourceName(work)) parts.push(`- ${getSourceName(work)}`);
  if (shortId) parts.push(`\nhttps://openalex.org/works/${shortId}`);

  try {
    await navigator.clipboard.writeText(parts.join(' '));
    store.commit('snackbar', 'Copied to clipboard');
  } catch {
    store.commit('snackbar', 'Failed to copy');
  }
}

async function fetchWorks(pageNum) {
  if (!props.rasText || isLoading.value) return;

  isLoading.value = true;
  errorMsg.value = null;

  try {
    const encodedRas = encodeURIComponent(`"${props.rasText}"`);
    // include_xpac=true returns ALL works (core + expansion); replaces the
    // deprecated/unlisted `is_xpac:true|false` filter (#498) — same result set.
    const url = `${urlBase.api}/works?filter=raw_affiliation_strings:${encodedRas}&include_xpac=true&select=id,doi,title,publication_year,primary_location&per_page=25&page=${pageNum}&mailto=ui@openalex.org`;

    const response = await axios.get(url, axiosConfig());
    const results = response.data.results || [];
    totalWorks.value = response.data.meta?.count || 0;

    if (pageNum === 1) {
      works.value = results;
    } else {
      works.value = [...works.value, ...results];
    }

    hasMore.value = results.length === 25 && works.value.length < totalWorks.value;
    page.value = pageNum;
  } catch (err) {
    console.error('Error fetching works for RAS:', err);
    errorMsg.value = 'Failed to load works.';
  } finally {
    isLoading.value = false;
  }

  // Re-setup observer after each fetch to handle case where sentinel
  // is still visible (content doesn't fill the container yet)
  if (hasMore.value && props.modelValue) {
    await nextTick();
    setupObserver();
  }
}

async function exportCsv() {
  if (!props.rasText || isExporting.value) return;

  // Hand off from the works list to a dedicated progress dialog.
  isExporting.value = true;
  exportLoaded.value = 0;
  exportTotal.value = 0;
  exportDone.value = false;
  exportError.value = null;
  exportCancelled.value = false;
  exportTruncated.value = false;
  // Swap the dialog's content from the works list to the progress view. Using one
  // dialog (not a second stacked v-dialog) avoids Vuetify overlay-stack races.
  showExportProgress.value = true;

  try {
    const encodedRas = encodeURIComponent(`"${props.rasText}"`);
    const perPage = 200;
    const rows = [];
    let pageNum = 1;
    let count = Infinity;

    // Paginate the SAME query the preview uses (incl. include_xpac=true so the
    // export matches what a bulk link/unlink would touch). OpenAlex /works does
    // not return meta.total_pages, so we drive pagination off meta.count.
    while (rows.length < count && rows.length < EXPORT_MAX) {
      if (exportCancelled.value) return;
      const url = `${urlBase.api}/works?filter=raw_affiliation_strings:${encodedRas}&include_xpac=true&select=id,doi,title,publication_year,primary_location&per_page=${perPage}&page=${pageNum}&mailto=ui@openalex.org`;
      const response = await axios.get(url, axiosConfig());
      const results = response.data.results || [];
      count = response.data.meta?.count ?? results.length;
      exportTotal.value = count;
      rows.push(...results);
      exportLoaded.value = rows.length;
      if (results.length < perPage) break;
      pageNum += 1;
    }

    if (exportCancelled.value) return;

    exportTruncated.value = rows.length < count;
    const exportRows = rows.map((w) => ({
      id: w.id ? w.id.replace('https://openalex.org/', '') : '',
      title: w.title || '',
      publication_year: w.publication_year ?? '',
      doi: w.doi || '',
      source: getSourceName(w) || '',
      raw_affiliation_string: props.rasText,
    }));

    const columns = [
      { key: 'id', label: 'OpenAlex ID' },
      { key: 'title', label: 'Title' },
      { key: 'publication_year', label: 'Year' },
      { key: 'doi', label: 'DOI' },
      { key: 'source', label: 'Source' },
      { key: 'raw_affiliation_string', label: 'Raw affiliation string' },
    ];

    const safeName =
      props.rasText.replace(/[^a-z0-9]+/gi, '_').slice(0, 60).replace(/^_+|_+$/g, '') ||
      'affiliation';
    exportArrayToCsv(exportRows, columns, `works_${safeName}.csv`);

    exportDone.value = true;
  } catch (err) {
    console.error('Error exporting works for RAS:', err);
    exportError.value = 'Something went wrong. Please try again.';
  } finally {
    isExporting.value = false;
  }
}

function cancelExport() {
  exportCancelled.value = true;
  isExporting.value = false;
  emit('update:modelValue', false); // close the dialog; watch() resets export state
}

function finishExport() {
  emit('update:modelValue', false); // close the dialog; watch() resets export state
}

// User dismissed the dialog (backdrop / Esc) while showing the works list.
function onDialogModel(val) {
  if (!val) emit('update:modelValue', false);
}

function setupObserver() {
  if (observer) observer.disconnect();
  if (!sentinel.value) return;

  const root = scrollContainer.value?.$el || scrollContainer.value;
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !isLoading.value) {
        fetchWorks(page.value + 1);
      }
    },
    { root, threshold: 0 }
  );
  observer.observe(sentinel.value);
}

watch(() => props.modelValue, async (open) => {
  if (open && props.rasText) {
    document.documentElement.style.overflow = 'hidden';
    // Always open on the works list (reset any export state from a prior open).
    showExportProgress.value = false;
    exportDone.value = false;
    exportError.value = null;
    exportTruncated.value = false;
    isExporting.value = false;
    exportLoaded.value = 0;
    exportTotal.value = 0;
    works.value = [];
    page.value = 1;
    hasMore.value = true;
    errorMsg.value = null;
    totalWorks.value = 0;
    await fetchWorks(1);
    await nextTick();
    setupObserver();
  } else {
    document.documentElement.style.overflow = '';
    if (observer) observer.disconnect();
  }
});

onBeforeUnmount(() => {
  document.documentElement.style.overflow = '';
  if (observer) observer.disconnect();
});
</script>

<style scoped>
.dialog-title {
  word-break: break-word;
  white-space: normal;
  line-height: 1.4;
}

.works-scroll-container {
  max-height: 60vh;
  overflow-y: auto;
}

.work-item {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.work-item:hover {
  background-color: #F9FAFB;
}

.work-item:last-of-type {
  border-bottom: none;
}

.min-width-0 {
  min-width: 0;
}

.menu-btn {
  opacity: 0.4;
  flex-shrink: 0;
}

.work-item:hover .menu-btn {
  opacity: 1;
}

/* Export progress dialog — Linear-inspired: minimal, tight type, muted grays */
.export-card {
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.export-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.export-subtitle {
  font-size: 12.5px;
  color: #6b7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.export-count {
  font-size: 26px;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.export-total {
  font-size: 13px;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
}

.export-pct {
  font-size: 13px;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
}

.export-note {
  font-size: 12.5px;
  color: #6b7280;
  line-height: 1.45;
}

.export-note-error {
  font-size: 13px;
  color: #dc2626;
  line-height: 1.45;
}
</style>
