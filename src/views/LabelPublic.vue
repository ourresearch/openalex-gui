<template>
  <div class="label-view">
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
      <template v-else-if="label">
        <!-- Header card -->
        <v-card variant="outlined" class="rounded-o pa-6 mb-6 bg-white">
          <div class="d-flex align-start">
            <v-icon size="40" class="mr-4 mt-1" color="grey-darken-1">
              {{ entityIcon }}
            </v-icon>
            <div style="flex: 1; min-width: 0;">
              <div class="text-h4 mb-1">{{ label.display_name }}</div>
              <div class="text-body-2 text-grey">
                {{ entityLabelPlural }} ·
                {{ (label.entity_count ?? 0).toLocaleString() }} {{ label.entity_count === 1 ? "entity" : "entities" }} ·
                Created {{ formattedDate }}
              </div>

              <div
                v-if="label.description"
                class="label-description mt-4"
              >{{ label.description }}</div>
            </div>

            <div class="d-flex flex-column align-end" style="gap: 8px;">
              <v-btn
                variant="outlined"
                :to="`/${label.entity_type}?filter=label:${label.id}`"
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
            This label is empty.
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

const label = ref(null);
const loading = ref(true);
const errorMessage = ref("");

const results = ref([]);
const totalCount = ref(0);
const resultsLoading = ref(false);
const page = ref(1);
const perPage = 25;

const labelId = computed(() => route.params.label_id);

const entityIcon = computed(() => {
  if (!label.value) return "mdi-label-outline";
  return entityConfigs?.[label.value.entity_type]?.icon || "mdi-label-outline";
});

const entityLabelPlural = computed(() => {
  if (!label.value) return "";
  return entityConfigs?.[label.value.entity_type]?.displayName || label.value.entity_type;
});

const formattedDate = computed(() => {
  if (!label.value?.created_at) return "";
  try {
    return new Date(label.value.created_at).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return "";
  }
});

useHead(() => ({
  title: label.value
    ? `${label.value.display_name} — OpenAlex Labels`
    : "OpenAlex Labels",
  // Labels are private (v1.1, oxjob #228 QA-040). noindex is paranoia —
  // crawlers shouldn't be able to reach the route since it 401s — but it's
  // free defense-in-depth.
  meta: [
    { name: "robots", content: "noindex" },
  ],
}));

async function loadLabel() {
  loading.value = true;
  errorMessage.value = "";
  try {
    label.value = await store.dispatch("labels/fetchPublic", labelId.value);
    // Set entityType on the root store so SerpResultsListItem can read it.
    store.commit("setEntityType", label.value.entity_type);
    await loadResults();
  } catch (e) {
    const status = e.response?.status;
    if (status === 404) {
      errorMessage.value = "Label not found. It may have been deleted.";
    } else if (status === 401) {
      errorMessage.value = "Please log in to view this label.";
    } else if (status === 403) {
      errorMessage.value = "This label is private. Only the owner can view it.";
    } else {
      errorMessage.value =
        e.response?.data?.message || "Could not load this label.";
    }
  } finally {
    loading.value = false;
  }
}

async function loadResults() {
  if (!label.value) return;
  resultsLoading.value = true;
  try {
    const url = `${urlBase.api}/${label.value.entity_type}?filter=label:${label.value.id}&per_page=${perPage}&page=${page.value}`;
    const resp = await axios.get(url, axiosConfig());
    results.value = resp.data?.results || [];
    totalCount.value = resp.data?.meta?.count || 0;
  } catch (e) {
    console.error("Failed to load label results", e);
    results.value = [];
    totalCount.value = 0;
  } finally {
    resultsLoading.value = false;
  }
}

watch(page, loadResults);
watch(labelId, loadLabel);

onMounted(loadLabel);
</script>

<style lang="scss" scoped>
.label-description {
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
