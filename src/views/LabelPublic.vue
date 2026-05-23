<template>
  <div class="label-public">
    <v-container class="py-6" style="max-width: 1100px;">
      <!-- Loading -->
      <div v-if="loading" class="d-flex justify-center my-12">
        <v-progress-circular indeterminate />
      </div>

      <!-- Not found / error -->
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
              <div class="text-body-2 text-grey mt-1">
                Owner: <code>{{ label.user_id }}</code>
              </div>

              <div
                v-if="label.description"
                class="label-description mt-4"
              >{{ label.description }}</div>
            </div>

            <div class="d-flex flex-column align-end" style="gap: 8px;">
              <v-btn
                v-if="showCopyButton"
                color="primary"
                variant="flat"
                :loading="copying"
                @click="onCopyClick"
              >
                <v-icon start>mdi-content-copy</v-icon>
                Copy to my labels
              </v-btn>
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
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { useHead } from "@unhead/vue";
import axios from "axios";

import { urlBase, axiosConfig } from "@/apiConfig.js";
import { entityConfigs } from "@/entityConfigs";
import SerpResultsListItem from "@/components/SerpResultsListItem.vue";

const route = useRoute();
const router = useRouter();
const store = useStore();

const label = ref(null);
const loading = ref(true);
const errorMessage = ref("");

const results = ref([]);
const totalCount = ref(0);
const resultsLoading = ref(false);
const page = ref(1);
const perPage = 25;

const copying = ref(false);

const labelId = computed(() => route.params.label_id);
const myUserId = computed(() => store.getters["user/userId"]);

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

const showCopyButton = computed(() => {
  if (!label.value) return false;
  // Hide for own labels; show for everyone else (anon + other users).
  return !myUserId.value || myUserId.value !== label.value.user_id;
});

useHead(() => ({
  title: label.value
    ? `${label.value.display_name} — OpenAlex Labels`
    : "OpenAlex Labels",
  meta: [
    { name: "robots", content: "noindex" },
    {
      property: "og:title",
      content: label.value
        ? `${label.value.display_name} — OpenAlex Labels`
        : "OpenAlex Labels",
    },
    { property: "og:type", content: "website" },
    {
      property: "og:image",
      content: "https://openalex.org/img/openalex-logo-icon-black-and-white.png",
    },
    {
      property: "og:description",
      content: label.value?.description
        ? label.value.description.slice(0, 200)
        : "A shared label on OpenAlex.",
    },
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
    if (e.response?.status === 404) {
      errorMessage.value = "Label not found. It may have been deleted.";
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

async function onCopyClick() {
  if (!label.value) return;
  // Anonymous: send to login with redirect=/labels/:id?action=copy.
  // The page re-mounts after login completes and the action=copy branch
  // below auto-fires the POST.
  if (!myUserId.value) {
    router.push({
      name: "Login",
      query: { redirect: `/labels/${label.value.id}?action=copy` },
    });
    return;
  }
  await doCopy();
}

async function doCopy() {
  copying.value = true;
  try {
    const created = await store.dispatch("labels/create", {
      source_label_id: label.value.id,
    });
    store.commit("snackbar", `Copied to "${created.display_name}".`);
    router.push("/settings/labels");
  } catch (e) {
    const msg =
      e.response?.data?.message ||
      (e.response?.status === 403
        ? "Label limit reached (100 per user)."
        : "Could not copy this label.");
    store.commit("snackbar", msg);
  } finally {
    copying.value = false;
  }
}

onMounted(async () => {
  await loadLabel();
  // Post-login nudge: if the user arrived via the anon→login→back flow with
  // ?action=copy, surface a snackbar pointing them at the Copy button. We do
  // NOT auto-fire the POST — that would let any link with ?action=copy
  // silently write a label into a logged-in victim's account.
  if (
    route.query.action === "copy" &&
    label.value &&
    myUserId.value &&
    myUserId.value !== label.value.user_id
  ) {
    store.commit(
      "snackbar",
      `Click "Copy to my labels" to add "${label.value.display_name}" to your account.`
    );
  }
});
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
