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
             looks like a work/author/institution page. -->
        <entity-header
          :entity-data="collection"
          entity-type="collections"
          is-collection
          class="mb-6"
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
              {{ entityCollectionPlural }} ·
              {{ (collection.entity_count ?? 0).toLocaleString() }} {{ collection.entity_count === 1 ? "entity" : "entities" }} ·
              Created {{ formattedDate }}
            </div>
            <div
              v-if="collection.description"
              class="collection-description mt-4"
            >{{ collection.description }}</div>
          </template>
        </entity-header>

        <!-- Action bar (oxjob #366): the homepage's "discover with the set" hardware.
             The collection homepage manages MEMBERS; discovery happens on the real
             SERP, launched from here. The derived-works launcher + view-members are
             read-only (Phase A); the owner-only "Manage members" toggle reveals the
             management hardware (Phase B). -->
        <div class="d-flex flex-wrap align-center ga-3 mb-6">
          <collection-derived-works-button :collection="collection" />
          <!-- Typed collections: a secondary affordance to open the MEMBERS
               themselves on their native SERP (full sort/facet/export hardware).
               For a works-collection this would just duplicate "View as full
               search", so it's omitted. -->
          <v-btn
            v-if="collection.entity_type !== 'works'"
            variant="outlined"
            :to="`/${collection.entity_type}?filter=collection:${collection.id}`"
          >
            View all {{ entityCollectionPlural }}
            <v-icon end>mdi-arrow-right</v-icon>
          </v-btn>

          <v-spacer />

          <!-- Owner-only manage toggle. Server enforces ownership on every
               add/remove regardless; this just reveals the hardware. -->
          <v-btn
            v-if="isOwner"
            :variant="manageMode ? 'flat' : 'outlined'"
            :color="manageMode ? 'primary' : undefined"
            @click="toggleManageMode"
          >
            <v-icon start>{{ manageMode ? "mdi-check" : "mdi-cog-outline" }}</v-icon>
            {{ manageMode ? "Done" : "Manage members" }}
          </v-btn>
        </div>

        <!-- Management hardware (oxjob #366 Phase B, owner-only). MANAGE THE SET
             here — search-within narrows the *existing* members, add/remove edit
             the set. NO discovery filters/facets: discovery happens on the real
             SERP via the action bar above. -->
        <v-expand-transition>
          <v-card
            v-if="manageMode"
            variant="outlined"
            class="rounded-o bg-white mb-4 pa-4 manage-panel"
          >
            <label class="text-body-2 font-weight-medium d-block mb-1">
              Add {{ entityCollectionPlural.toLowerCase() }}
            </label>
            <entity-autocomplete
              :entity-type="collection.entity_type"
              show-work-counts
              :disabled="mutating"
              @entity-selected="onAddMember"
            />

            <div class="d-flex flex-wrap align-center ga-3 mt-4">
              <!-- Search-within: client-side narrow of the loaded page. NOT a
                   facet — it filters the members already shown, nothing more. -->
              <v-text-field
                v-model="searchWithin"
                density="compact"
                variant="outlined"
                hide-details
                clearable
                prepend-inner-icon="mdi-magnify"
                :placeholder="`Filter loaded ${entityCollectionPlural.toLowerCase()}…`"
                style="max-width: 340px;"
              />
              <v-spacer />
              <span v-if="selectedIds.size" class="text-body-2 text-grey">
                {{ selectedIds.size }} selected
              </span>
              <v-btn
                v-if="selectedIds.size"
                color="error"
                variant="tonal"
                :loading="mutating"
                @click="removeSelected"
              >
                <v-icon start>mdi-delete-outline</v-icon>
                Remove selected
              </v-btn>
            </div>
          </v-card>
        </v-expand-transition>

        <!-- Embedded results list -->
        <v-card variant="outlined" class="rounded-o bg-white">
          <div v-if="resultsLoading" class="d-flex justify-center my-12">
            <v-progress-circular indeterminate />
          </div>
          <div v-else-if="!results.length" class="text-center text-grey my-12 pa-6">
            This collection is empty.
          </div>
          <div
            v-else-if="manageMode && !displayedResults.length"
            class="text-center text-grey my-12 pa-6"
          >
            No loaded {{ entityCollectionPlural.toLowerCase() }} match “{{ searchWithin }}”.
          </div>
          <div v-else class="results-container">
            <template v-for="result in displayedResults" :key="result.id">
              <!-- Manage mode wraps each member row with a select checkbox +
                   per-row remove ×. Read mode renders the bare row (Phase A). -->
              <div v-if="manageMode" class="manage-row d-flex align-center">
                <v-checkbox-btn
                  density="compact"
                  class="flex-grow-0 ml-2 mr-1"
                  :model-value="selectedIds.has(shortIdOf(result))"
                  :disabled="mutating"
                  @update:model-value="toggleSelect(result)"
                />
                <serp-results-list-item :result="result" class="flex-grow-1" />
                <v-tooltip text="Remove from collection" location="top">
                  <template #activator="{ props: removeTip }">
                    <v-btn
                      v-bind="removeTip"
                      icon="mdi-close"
                      size="small"
                      variant="text"
                      class="mr-2"
                      :disabled="mutating"
                      :aria-label="`Remove ${result.display_name} from collection`"
                      @click="removeOne(result)"
                    />
                  </template>
                </v-tooltip>
              </div>
              <serp-results-list-item v-else :result="result" />
            </template>
          </div>

          <!-- Pagination. Hidden while a search-within term is active, since that
               filters only the loaded page (page counts would be misleading). -->
          <div
            v-if="!searchWithin && totalCount > perPage"
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
import * as openalexId from "@/openalexId";
import SerpResultsListItem from "@/components/SerpResultsListItem.vue";
import EntityHeader from "@/components/Entity/EntityHeader.vue";
import CollectionNameEditor from "@/components/Collection/CollectionNameEditor.vue";
import CollectionDerivedWorksButton from "@/components/Collection/CollectionDerivedWorksButton.vue";
import EntityAutocomplete from "@/components/EntityAutocomplete.vue";

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

// Phase B management state (owner-only). `manageMode` reveals the management
// hardware; `selectedIds` holds short ids of selected members on the loaded
// page; `searchWithin` is a client-side narrow of that page; `mutating` guards
// against concurrent add/remove calls.
const manageMode = ref(false);
const selectedIds = ref(new Set());
const searchWithin = ref("");
const mutating = ref(false);

// Members already mutate via add/remove here, but refetch on ANY collection
// membership change so a mutation from another surface (or another tab) keeps
// this list fresh.
const entityMutationCounter = computed(
  () => store.state.collections?.entityMutationCounter || 0
);

const collectionId = computed(() => route.params.collection_id);

// Owner == the collection is in the logged-in user's own /me/collections list
// (loaded into the store on mount). Only the owner sees the rename pencil; the
// PATCH /me/collections/:id endpoint enforces ownership server-side regardless.
const isOwner = computed(() =>
  !!(collection.value && store.getters["collections/byId"](collection.value.id))
);

const entityCollectionPlural = computed(() => {
  if (!collection.value) return "";
  return entityConfigs?.[collection.value.entity_type]?.displayName || collection.value.entity_type;
});

// Short id (e.g. "I123") — the format collections/{add,remove}Entities expect.
function shortIdOf(result) {
  return openalexId.toDisplayFormat(result.id, "short") || result.id;
}

// Search-within narrows the LOADED page client-side (not a server facet). With
// no term, this is just `results`.
const displayedResults = computed(() => {
  const term = (searchWithin.value || "").trim().toLowerCase();
  if (!term) return results.value;
  return results.value.filter((r) =>
    (r.display_name || "").toLowerCase().includes(term)
  );
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
    // Load the user's own collections so isOwner can tell whether the rename
    // pencil should show. No-op fast path if already loaded / no user.
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

// Persist a rename. collections/update PATCHes /me/collections/:id and updates
// the store; we also patch the local ref so the title + page <title> reflect it
// immediately. Errors propagate to CollectionNameEditor for inline display.
async function renameCollection(newName) {
  const updated = await store.dispatch("collections/update", {
    id: collection.value.id,
    display_name: newName,
  });
  collection.value = { ...collection.value, ...updated };
}

// --- Phase B: members management (owner-only) ---

function toggleManageMode() {
  manageMode.value = !manageMode.value;
  if (!manageMode.value) {
    // Leaving manage mode clears the transient narrow + selection so re-entering
    // starts clean.
    searchWithin.value = "";
    selectedIds.value = new Set();
  }
}

function toggleSelect(result) {
  const id = shortIdOf(result);
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

// Add a member. EntityAutocomplete emits the full entity; we send its short id.
// The server dedups, so `added === 0` means it was already a member.
async function onAddMember(entity) {
  if (!entity?.id || mutating.value) return;
  const shortId = openalexId.toDisplayFormat(entity.id, "short") || entity.id;
  mutating.value = true;
  try {
    const resp = await store.dispatch("collections/addEntities", {
      id: collection.value.id,
      entity_ids: [shortId],
    });
    store.commit(
      "snackbar",
      resp?.added
        ? `Added “${entity.display_name}”.`
        : `“${entity.display_name}” is already in this collection.`
    );
    // entityMutationCounter bump → watcher refetches the list.
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Could not add member.",
      color: "error",
    });
  } finally {
    mutating.value = false;
  }
}

async function removeMembers(ids) {
  if (!ids.length || mutating.value) return;
  mutating.value = true;
  try {
    await store.dispatch("collections/removeEntities", {
      id: collection.value.id,
      entity_ids: ids,
    });
    const next = new Set(selectedIds.value);
    ids.forEach((id) => next.delete(id));
    selectedIds.value = next;
    store.commit(
      "snackbar",
      ids.length === 1 ? "Removed 1 member." : `Removed ${ids.length} members.`
    );
    // entityMutationCounter bump → watcher refetches (+ steps back an emptied page).
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Could not remove member(s).",
      color: "error",
    });
  } finally {
    mutating.value = false;
  }
}

function removeOne(result) {
  removeMembers([shortIdOf(result)]);
}

function removeSelected() {
  removeMembers([...selectedIds.value]);
}

watch(page, loadResults);
watch(collectionId, loadCollection);

// Refetch members whenever membership changes (our own add/remove, or any other
// surface). If a removal emptied the current page, step back one page.
watch(entityMutationCounter, async () => {
  if (!collection.value) return;
  await loadResults();
  // Keep the header count in sync with the authoritative member count.
  collection.value = { ...collection.value, entity_count: totalCount.value };
  if (!results.value.length && page.value > 1) page.value -= 1;
});

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
