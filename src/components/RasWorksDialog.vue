<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="900"
  >
    <v-card>
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
        <v-btn variant="text" size="small" @click="$emit('update:modelValue', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'RasWorksDialog' });

const props = defineProps({
  modelValue: Boolean,
  rasText: { type: String, default: '' },
});

defineEmits(['update:modelValue']);

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
    const url = `${urlBase.api}/works?filter=raw_affiliation_strings:${encodedRas},is_xpac:true|false&select=id,doi,title,publication_year,primary_location&per_page=25&page=${pageNum}&mailto=ui@openalex.org`;

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
</style>
