<template>
  <v-card variant="outlined" class="rounded-o bg-white">
    <v-toolbar flat color="white" class="entity-page-section-title">
      <template #prepend>
        <v-icon variant="text" color="grey-darken-2" start>mdi-file-document-outline</v-icon>
      </template>
      <v-toolbar-title class="font-weight-bold">
        Works
        <span v-if="totalCount" class="text-body-2 text-medium-emphasis ml-1">
          ({{ totalCount.toLocaleString() }})
        </span>
      </v-toolbar-title>
      <v-spacer />

      <!-- Remove selected works button (owner only) -->
      <v-btn
        v-if="isOwner && selectedForRemoval.size > 0"
        color="error"
        variant="text"
        rounded
        size="small"
        @click="isRemoveDialogOpen = true"
      >
        Remove {{ selectedForRemoval.size }} work{{ selectedForRemoval.size > 1 ? 's' : '' }}
      </v-btn>

      <!-- Add works button (owner only) -->
      <v-btn
        v-if="isOwner"
        variant="text"
        rounded
        size="small"
        color="primary"
        @click="$emit('add-works')"
      >
        <v-icon start size="16">mdi-plus</v-icon>
        Add
      </v-btn>
    </v-toolbar>

    <v-divider />

    <!-- Loading state -->
    <div v-if="isLoading && works.length === 0" class="pa-6 text-center">
      <v-progress-circular indeterminate size="24" width="2" />
    </div>

    <!-- Works list -->
    <v-list v-else class="py-0">
      <div
        v-for="work in works"
        :key="work.id"
        class="work-item"
      >
        <div class="work-item-content">
          <!-- Subtle checkbox for removal (owner only) -->
          <v-checkbox
            v-if="isOwner"
            :model-value="selectedForRemoval.has(work.id)"
            density="compact"
            hide-details
            class="work-checkbox"
            @update:model-value="toggleRemoval(work.id)"
          />

          <div class="work-item-text">
            <!-- Title -->
            <router-link
              :to="workLink(work)"
              class="work-title text-body-2 font-weight-medium text-decoration-none"
              v-html="work.display_name || 'Untitled'"
            />

            <!-- Authors and metadata -->
            <div class="work-meta">
              <span v-if="work.publication_year">{{ work.publication_year }}</span>
              <template v-if="work.authorships?.length">
                <span> · </span>
                <span class="work-authors">
                  {{ formatAuthors(work.authorships) }}
                </span>
              </template>
              <template v-if="work.primary_location?.source?.display_name">
                <span> · </span>
                <span class="font-italic">{{ work.primary_location.source.display_name }}</span>
              </template>
            </div>

            <!-- Cited by count -->
            <div v-if="work.cited_by_count" class="work-citations">
              <v-icon size="12" class="mr-1" style="opacity: 0.4">mdi-format-quote-close</v-icon>
              Cited by {{ work.cited_by_count.toLocaleString() }}
            </div>

            <!-- Pending removal notice -->
            <div v-if="pendingRemovals.has(work.id)" class="work-pending">
              <v-icon size="12" class="mr-1">mdi-clock-outline</v-icon>
              Removal pending
            </div>
          </div>
        </div>
      </div>
    </v-list>

    <!-- Load more -->
    <div v-if="hasMore" class="pa-4 text-center">
      <v-btn
        variant="text"
        rounded
        size="small"
        color="primary"
        :loading="isLoading"
        @click="loadMore"
      >
        Show more works
      </v-btn>
    </div>

    <!-- Removal confirmation dialog -->
    <v-dialog v-model="isRemoveDialogOpen" max-width="480">
      <v-card rounded>
        <v-card-title>Remove works from your profile?</v-card-title>
        <v-card-text>
          <p>
            You are about to remove {{ selectedForRemoval.size }}
            work{{ selectedForRemoval.size > 1 ? 's' : '' }} from your author profile.
            This will submit a curation request and may take a few days to take effect.
          </p>
          <p class="text-medium-emphasis mt-2">
            This will not delete the work from OpenAlex — it only removes the link between
            the work and your author profile.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="isRemoveDialogOpen = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="flat" rounded @click="confirmRemovals">
            Yes, remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { urlBase } from '@/apiConfig';
import filters from '@/filters';

defineOptions({ name: 'AuthorWorksList' });

const props = defineProps({
  authorId: {
    type: String,
    required: true,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['add-works', 'remove-works']);

const works = ref([]);
const totalCount = ref(0);
const isLoading = ref(false);
const currentPage = ref(1);
const perPage = 25;
const selectedForRemoval = ref(new Set());
const pendingRemovals = ref(new Set());
const isRemoveDialogOpen = ref(false);

const hasMore = computed(() => {
  return works.value.length < totalCount.value;
});

function workLink(work) {
  const shortId = work.id?.replace('https://openalex.org/', '');
  return shortId ? `/${shortId}` : '#';
}

function formatAuthors(authorships) {
  if (!authorships || authorships.length === 0) return '';
  const names = authorships.map(a => a.author?.display_name || a.raw_author_name || 'Unknown');
  if (names.length <= 3) return names.join(', ');
  return names.slice(0, 3).join(', ') + ` +${names.length - 3} more`;
}

function toggleRemoval(workId) {
  const newSet = new Set(selectedForRemoval.value);
  if (newSet.has(workId)) {
    newSet.delete(workId);
  } else {
    newSet.add(workId);
  }
  selectedForRemoval.value = newSet;
}

function confirmRemovals() {
  const workIds = Array.from(selectedForRemoval.value);
  // Mark as pending
  workIds.forEach(id => pendingRemovals.value.add(id));
  selectedForRemoval.value = new Set();
  isRemoveDialogOpen.value = false;
  emit('remove-works', workIds);
}

async function fetchWorks(page = 1) {
  isLoading.value = true;
  try {
    const shortId = props.authorId.replace('https://openalex.org/', '');
    const apiUrl = `${urlBase.api}/works?filter=authorships.author.id:${shortId}&sort=publication_year:desc&per_page=${perPage}&page=${page}`;
    const resp = await axios.get(apiUrl);
    if (page === 1) {
      works.value = resp.data.results || [];
    } else {
      works.value = [...works.value, ...(resp.data.results || [])];
    }
    totalCount.value = resp.data.meta?.count || 0;
    currentPage.value = page;
  } catch (err) {
    console.error('Failed to fetch author works:', err);
  } finally {
    isLoading.value = false;
  }
}

function loadMore() {
  fetchWorks(currentPage.value + 1);
}

onMounted(() => {
  fetchWorks(1);
});

watch(() => props.authorId, () => {
  works.value = [];
  currentPage.value = 1;
  fetchWorks(1);
});
</script>

<style scoped>
.work-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.work-item:last-child {
  border-bottom: none;
}

.work-item-content {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  gap: 4px;
}

.work-checkbox {
  flex-shrink: 0;
  margin-top: -2px;
  opacity: 0.4;
  transition: opacity 0.15s;
}

.work-item:hover .work-checkbox {
  opacity: 1;
}

.work-item-text {
  flex: 1;
  min-width: 0;
}

.work-title {
  display: block;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.87);
}

.work-title:hover {
  text-decoration: underline !important;
}

.work-meta {
  font-size: 13px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}

.work-authors {
  /* keep inline */
}

.work-citations {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
}

.work-pending {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #E65100;
  margin-top: 4px;
}
</style>
