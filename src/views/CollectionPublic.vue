<template>
  <div class="collection-view">
    <v-container class="py-6" style="max-width: 1100px;">
      <!-- Loading -->
      <div v-if="loading" class="d-flex justify-center my-12">
        <v-progress-circular indeterminate />
      </div>

      <!-- Not found / unauthorized -->
      <v-alert
        v-else-if="errorMessage"
        type="info"
        variant="tonal"
        class="my-6"
      >
        {{ errorMessage }}
      </v-alert>

      <!-- Main content -->
      <template v-else-if="collection">
        <!-- Header card -->
        <v-card variant="outlined" class="rounded-o pa-6 mb-6 bg-white">
          <div class="d-flex align-start">
            <v-icon size="40" class="mr-4 mt-1" color="grey-darken-1">
              {{ entityIcon }}
            </v-icon>
            <div style="flex: 1; min-width: 0;">
              <div class="text-h4 mb-1">{{ collection.display_name }}</div>
              <div class="text-body-2 text-grey">
                {{ entityCollectionPlural }} ·
                {{ (collection.entity_count ?? 0).toLocaleString() }} {{ collection.entity_count === 1 ? "entity" : "entities" }} ·
                Created {{ formattedDate }}
              </div>

              <div
                v-if="collection.description"
                class="collection-description mt-4"
              >{{ collection.description }}</div>
            </div>

            <div class="d-flex flex-column align-end" style="gap: 8px;">
              <v-btn
                variant="outlined"
                :to="`/${collection.entity_type}?filter=collection:${collection.id}`"
              >
                Open in search
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card>

        <!-- Embedded results list -->
        <v-card variant="outlined" class="rounded-o bg-white">
          <div v-if="resultsLoading" class="d-flex justify-center my-12">
            <v-progress-circular indeterminate />
          </div>
          <div v-else-if="!results.length" class="text-center text-grey my-12 pa-6">
            This collection is empty.
          </div>
          <div v-else class="results-container">
            <serp-results-list-item
              v-for="result in results"
              :key="result.id"
              :result="result"
            />
          </div>

          <!-- Pagination -->
          <div
            v-if="totalCount > perPage"
            class="d-flex justify-center align-center py-4 border-t"
          >
            <v-pagination
              v-model="page"
              :length="Math.min(Math.ceil(totalCount / perPage), 200)"
              :total-visible="7"
              density="compact"
            />
          </div>
        </v-card>
      </template>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { useHead } from "@unhead/vue";
import axios from "axios";

import { urlBase, axiosConfig } from "@/apiConfig.js";
import { entityConfigs } from "@/entityConfigs";
import SerpResultsListItem from "@/components/SerpResultsListItem.vue";

const route = useRoute();
const store = useStore();

const collection = ref(null);
const loading = ref(true);
const errorMessage = ref("");

const results = ref([]);
const totalCount = ref(0);
const resultsLoading = ref(false);
const page = ref(1);
const perPage = 25;

const collectionId = computed(() => route.params.collection_id);

const entityIcon = computed(() => {
  if (!collection.value) return "mdi-folder-outline";
  return entityConfigs?.[collection.value.entity_type]?.icon || "mdi-folder-outline";
});

const entityCollectionPlural = computed(() => {
  if (!collection.value) return "";
  return entityConfigs?.[collection.value.entity_type]?.displayName || collection.value.entity_type;
});

const formattedDate = computed(() => {
  if (!collection.value?.created_at) return "";
  try {
    return new Date(collection.value.created_at).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return "";
  }
});

useHead(() => ({
  title: collection.value
    ? `${collection.value.display_name} — OpenAlex Collections`
    : "OpenAlex Collections",
  // Collections are private (v1.1, oxjob #228 QA-040). noindex is paranoia —
  // crawlers shouldn't be able to reach the route since it 401s — but it's
  // free defense-in-depth.
  meta: [
    { name: "robots", content: "noindex" },
  ],
}));

async function loadCollection() {
  loading.value = true;
  errorMessage.value = "";
  try {
    collection.value = await store.dispatch("collections/fetchPublic", collectionId.value);
    // Set entityType on the root store so SerpResultsListItem can read it.
    store.commit("setEntityType", collection.value.entity_type);
    await loadResults();
  } catch (e) {
    const status = e.response?.status;
    if (status === 404) {
      errorMessage.value = "Collection not found. It may have been deleted.";
    } else if (status === 401) {
      errorMessage.value = "Please log in to view this collection.";
    } else if (status === 403) {
      errorMessage.value = "This collection is private. Only the owner can view it.";
    } else {
      errorMessage.value =
        e.response?.data?.message || "Could not load this collection.";
    }
  } finally {
    loading.value = false;
  }
}

async function loadResults() {
  if (!collection.value) return;
  resultsLoading.value = true;
  try {
    const url = `${urlBase.api}/${collection.value.entity_type}?filter=collection:${collection.value.id}&per_page=${perPage}&page=${page.value}`;
    const resp = await axios.get(url, axiosConfig());
    results.value = resp.data?.results || [];
    totalCount.value = resp.data?.meta?.count || 0;
  } catch (e) {
    console.error("Failed to load collection results", e);
    results.value = [];
    totalCount.value = 0;
  } finally {
    resultsLoading.value = false;
  }
}

watch(page, loadResults);
watch(collectionId, loadCollection);

onMounted(loadCollection);
</script>

<style lang="scss" scoped>
.collection-description {
  white-space: pre-wrap;
  word-break: break-word;
  color: rgba(0, 0, 0, 0.75);
}
.border-t {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.results-container {
  // Match SerpResultsListItem's expectation that it's stacked vertically.
}
</style>
