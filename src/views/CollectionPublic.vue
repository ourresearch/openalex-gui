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
        <!-- Header: reuse the shared entity-page header so a collection page
             looks like a work/author/institution page. The type indicator reads
             "Collection of institutions" (oxjob #366), so the entity type is
             dropped from the subheader below. -->
        <entity-header
          :entity-data="collection"
          entity-type="collections"
          is-collection
          :type-label="`Collection of ${entityCollectionPlural.toLowerCase()}`"
          class="mb-4"
        >
          <template v-if="isOwner" #after-title>
            <collection-name-editor
              :current-name="collection.display_name"
              :is-owner="isOwner"
              :on-save="renameCollection"
            />
          </template>

          <template #after-header>
            <div class="text-body-2 text-grey mt-1">
              {{ (collection.entity_count ?? 0).toLocaleString() }} {{ collection.entity_count === 1 ? "entity" : "entities" }} ·
              Created {{ formattedDate }}
            </div>
            <div
              v-if="collection.description"
              class="collection-description mt-4"
            >{{ collection.description }}</div>
          </template>
        </entity-header>

        <!-- Search this collection (oxjob #366): always present, in all modes.
             Server-side — searches ALL members by name and pages through matches
             (like an entity SERP), not just the loaded page. -->
        <v-text-field
          v-model="searchInput"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          :placeholder="`Search this collection of ${entityCollectionPlural.toLowerCase()}`"
          class="mb-4"
          @keydown.enter="submitSearch"
          @click:clear="clearSearch"
        />

        <!-- Action bar: launch the derived works / member SERP. Discovery happens
             on the real SERP; this page manages the members. -->
        <div class="d-flex flex-wrap align-center ga-3 mb-6">
          <collection-derived-works-button :collection="collection" />
          <!-- Typed collections: open the MEMBERS themselves on their native SERP
               (full sort/facet/export). Redundant for a works-collection. -->
          <v-btn
            v-if="collection.entity_type !== 'works'"
            variant="outlined"
            :to="`/${collection.entity_type}?filter=collection:${collection.id}`"
          >
            View as {{ entityCollectionPlural.toLowerCase() }} search
            <v-icon end>mdi-arrow-right</v-icon>
          </v-btn>

          <v-spacer />

          <!-- Owner: add members. Opens the shared value-picker dialog (search,
               multi-select). Server enforces ownership on the mutation. -->
          <v-btn
            v-if="isOwner"
            color="primary"
            variant="flat"
            @click="addDialogOpen = true"
          >
            <v-icon start>mdi-plus</v-icon>
            Add {{ entityCollectionSingular.toLowerCase() }}
          </v-btn>
        </div>

        <!-- Members list -->
        <v-card variant="outlined" class="rounded-o bg-white">
          <!-- Owner: select-all master checkbox + bulk-remove. Follows the SERP /
               entity-page selection pattern (selection store). -->
          <selection-toolbar v-if="isOwner" :selectable="true">
            <template #trailing>
              <v-spacer />
              <v-btn
                v-if="selectedCount > 0"
                color="error"
                variant="text"
                size="small"
                class="mr-1"
                @click="askRemoveBulk"
              >
                <v-icon start>mdi-delete-outline</v-icon>
                Remove {{ selectedCount.toLocaleString() }}
              </v-btn>
            </template>
          </selection-toolbar>
          <v-divider v-if="isOwner" />

          <div v-if="resultsLoading" class="d-flex justify-center my-12">
            <v-progress-circular indeterminate />
          </div>
          <div v-else-if="!results.length && searchTerm" class="text-center text-grey my-12 pa-6">
            No {{ entityCollectionPlural.toLowerCase() }} match “{{ searchTerm }}”.
          </div>
          <div v-else-if="!results.length" class="text-center text-grey my-12 pa-6">
            This collection is empty.
          </div>
          <div v-else class="results-container">
            <div
              v-for="result in results"
              :key="result.id"
              class="member-row d-flex align-center"
            >
              <!-- SerpResultsListItem renders its own select checkbox (left) when
                   :selectable; the trashcan is the per-row remove (oxjob #366). -->
              <serp-results-list-item
                :result="result"
                :selectable="isOwner"
                class="flex-grow-1"
              />
              <v-tooltip v-if="isOwner" text="Remove from collection" location="top">
                <template #activator="{ props: removeTip }">
                  <v-btn
                    v-bind="removeTip"
                    icon="mdi-trash-can-outline"
                    size="small"
                    variant="text"
                    class="mr-2 flex-shrink-0"
                    :aria-label="`Remove ${result.display_name} from collection`"
                    @click="askRemoveSingle(result)"
                  />
                </template>
              </v-tooltip>
            </div>
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

    <!-- Add-members dialog (owner) -->
    <collection-add-entities-dialog
      v-if="collection && isOwner"
      v-model="addDialogOpen"
      :collection="collection"
    />

    <!-- Remove confirmation (single + bulk) -->
    <v-dialog v-model="removeDialog" max-width="440">
      <v-card class="rounded-o">
        <v-card-title class="text-h6">{{ removeTitle }}</v-card-title>
        <v-card-text>{{ removeBody }}</v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="removing" @click="removeDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="removing" @click="confirmRemove">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { useHead } from "@unhead/vue";
import axios from "axios";

import { urlBase, axiosConfig } from "@/apiConfig.js";
import { entityConfigs } from "@/entityConfigs";
import * as openalexId from "@/openalexId";
import SerpResultsListItem from "@/components/SerpResultsListItem.vue";
import EntityHeader from "@/components/Entity/EntityHeader.vue";
import CollectionNameEditor from "@/components/Collection/CollectionNameEditor.vue";
import CollectionDerivedWorksButton from "@/components/Collection/CollectionDerivedWorksButton.vue";
import CollectionAddEntitiesDialog from "@/components/Collection/CollectionAddEntitiesDialog.vue";
import SelectionToolbar from "@/components/SelectionToolbar.vue";

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

// Search this collection (server-side). `searchInput` is the box's live text;
// `searchTerm` is the applied query (set on Enter / clear), which the fetch uses.
const searchInput = ref("");
const searchTerm = ref("");

const addDialogOpen = ref(false);

// Remove confirmation. target = { type: 'single', result } | { type: 'bulk' }.
// removeTitle/removeBody are snapshotted at open-time (not computed off the
// target) so the text doesn't flash to a fallback during the close transition.
const removeDialog = ref(false);
const removeTarget = ref(null);
const removeTitle = ref("");
const removeBody = ref("");
const removing = ref(false);
// While a bulk remove fires several mutations, suppress the per-bump refetch and
// reload once at the end.
const suppressRefetch = ref(false);

const collectionId = computed(() => route.params.collection_id);

const isOwner = computed(() =>
  !!(collection.value && store.getters["collections/byId"](collection.value.id))
);

const entityCollectionPlural = computed(() => {
  if (!collection.value) return "";
  return entityConfigs?.[collection.value.entity_type]?.displayName || collection.value.entity_type;
});
const entityCollectionSingular = computed(() => {
  if (!collection.value) return "";
  const cfg = entityConfigs?.[collection.value.entity_type];
  if (cfg?.displayNameSingular) return cfg.displayNameSingular;
  const p = entityCollectionPlural.value;
  return p.endsWith("s") ? p.slice(0, -1) : p;
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

const entityMutationCounter = computed(
  () => store.state.collections?.entityMutationCounter || 0
);

// Selection (SERP pattern). selectedCount handles both explicit selection and
// "select all N" mode.
const selectedCount = computed(() => store.getters["selection/selectedCount"]);

useHead(() => ({
  title: collection.value
    ? `${collection.value.display_name} — OpenAlex Collections`
    : "OpenAlex Collections",
  meta: [{ name: "robots", content: "noindex" }],
}));

async function loadCollection() {
  loading.value = true;
  errorMessage.value = "";
  try {
    collection.value = await store.dispatch("collections/fetchPublic", collectionId.value);
    store.commit("setEntityType", collection.value.entity_type);
    if (!store.state.collections.loaded && !store.state.collections.loading) {
      store.dispatch("collections/fetchAll");
    }
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

function membersUrl(p, per) {
  // include_xpac=true so is_xpac works (silently dropped by ?filter= by default)
  // aren't hidden from a works-collection's member list (API gotcha).
  let u = `${urlBase.api}/${collection.value.entity_type}?filter=collection:${collection.value.id}`
    + `&include_xpac=true&per_page=${per}&page=${p}`;
  if (searchTerm.value) u += `&search=${encodeURIComponent(searchTerm.value)}`;
  return u;
}

async function loadResults() {
  if (!collection.value) return;
  resultsLoading.value = true;
  try {
    const resp = await axios.get(membersUrl(page.value, perPage), axiosConfig());
    results.value = resp.data?.results || [];
    totalCount.value = resp.data?.meta?.count || 0;
    // Publish into the selection store. contextKey includes the search term so
    // changing the search resets selection; paging keeps it (same key).
    store.commit("selection/setContext", {
      contextKey: `collection:${collection.value.id}:${searchTerm.value}`,
      totalCount: totalCount.value,
    });
    store.commit("selection/setLoadedIds", results.value.map(r => r.id).filter(Boolean));
  } catch (e) {
    console.error("Failed to load collection results", e);
    results.value = [];
    totalCount.value = 0;
  } finally {
    resultsLoading.value = false;
  }
}

function submitSearch() {
  const next = (searchInput.value || "").trim();
  if (next === searchTerm.value) return;
  searchTerm.value = next;
  page.value = 1;
  loadResults();
}
function clearSearch() {
  searchInput.value = "";
  if (searchTerm.value) {
    searchTerm.value = "";
    page.value = 1;
    loadResults();
  }
}

async function renameCollection(newName) {
  const updated = await store.dispatch("collections/update", {
    id: collection.value.id,
    display_name: newName,
  });
  collection.value = { ...collection.value, ...updated };
}

// --- remove (always-live, owner) ---
function askRemoveSingle(result) {
  removeTarget.value = { type: "single", result };
  removeTitle.value = "Remove from collection?";
  removeBody.value = `“${result.display_name || "This entity"}” will be removed from this collection.`;
  removeDialog.value = true;
}
function askRemoveBulk() {
  const n = selectedCount.value;
  removeTarget.value = { type: "bulk" };
  removeTitle.value = `Remove ${n.toLocaleString()} ${n === 1 ? entityCollectionSingular.value.toLowerCase() : entityCollectionPlural.value.toLowerCase()}?`;
  removeBody.value = "These will be removed from this collection. The entities themselves are not deleted.";
  removeDialog.value = true;
}

// Page through every member id (full OpenAlex URLs) for a "select all N" bulk
// remove. Capped to avoid runaway paging on a very large collection.
async function collectAllMemberIds() {
  const ids = [];
  const per = 200;
  const maxPages = 50;
  for (let p = 1; p <= maxPages; p++) {
    const resp = await axios.get(membersUrl(p, per), axiosConfig());
    const batch = (resp.data?.results || []).map(r => r.id).filter(Boolean);
    ids.push(...batch);
    if (batch.length < per) break;
    if (p === maxPages) console.warn("collectAllMemberIds: hit page cap; some members not enumerated");
  }
  return ids;
}

async function removeShortIds(shortIds) {
  // Chunk to keep request bodies sane on large bulk removes.
  const size = 200;
  for (let i = 0; i < shortIds.length; i += size) {
    await store.dispatch("collections/removeEntities", {
      id: collection.value.id,
      entity_ids: shortIds.slice(i, i + size),
    });
  }
}

async function confirmRemove() {
  if (!removeTarget.value || removing.value) return;
  removing.value = true;
  suppressRefetch.value = true;
  try {
    let fullIds;
    if (removeTarget.value.type === "single") {
      fullIds = [removeTarget.value.result.id];
    } else if (store.state.selection.selectAllMode) {
      const excluded = new Set(store.state.selection.excludedIds);
      fullIds = (await collectAllMemberIds()).filter(id => !excluded.has(id));
    } else {
      fullIds = [...store.state.selection.selectedIds];
    }
    const shortIds = fullIds.map(v => openalexId.toDisplayFormat(v, "short") || v).filter(Boolean);
    if (shortIds.length) {
      await removeShortIds(shortIds);
      store.commit(
        "snackbar",
        shortIds.length === 1 ? "Removed 1 member." : `Removed ${shortIds.length.toLocaleString()} members.`
      );
    }
    store.commit("selection/deselectAll");
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Could not remove.",
      color: "error",
    });
  } finally {
    removing.value = false;
    removeDialog.value = false;
    removeTarget.value = null;
    suppressRefetch.value = false;
    await refetchAfterMutation();
  }
}

// Reload members after a membership change + keep the header count and current
// page valid (step back if a removal emptied the page).
async function refetchAfterMutation() {
  if (!collection.value) return;
  await loadResults();
  collection.value = { ...collection.value, entity_count: totalCount.value };
  if (!results.value.length && page.value > 1) page.value -= 1;
}

watch(page, loadResults);
watch(collectionId, () => {
  store.commit("selection/deselectAll");
  searchInput.value = "";
  searchTerm.value = "";
  page.value = 1;
  loadCollection();
});

watch(entityMutationCounter, () => {
  if (suppressRefetch.value) return;
  refetchAfterMutation();
});

onMounted(loadCollection);
onUnmounted(() => store.commit("selection/deselectAll"));
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
.member-row {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.member-row:last-child {
  border-bottom: none;
}
// SerpResultsListItem draws its own bottom border; the wrapper owns it now.
.member-row :deep(.result-item) {
  border-bottom: none;
}
</style>
