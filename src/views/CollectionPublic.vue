<!--
  Route `/collections/:id`: a collection's one home.

  The owner manages it here (rename, share, add, remove). Anyone else sees it only
  when the owner has shared it by link (oxjob #646): read-only, logged in or not,
  with Make a copy. A private collection, or one that doesn't exist, shows the same
  "Collection not found" (the server answers both the same way). The
  page is `noindex`; shared collections are never listed or indexed.
-->
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
        <!-- Helps a recipient without confirming the collection exists (oxjob #646). -->
        <div v-if="errorMessage === 'Collection not found.'" class="mt-1">
          If someone sent you this link, ask them to share the collection by link.
        </div>
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
          <!-- One hierarchy (#1508, on #1507's entity header): status on the
               left; on the right the page's one filled button (owner: Share;
               anyone else: Make a copy) and one More menu (export, API, delete).
               Searching and adding members belong to the member list below;
               opening searches over the members sits under the title. -->
          <template #meta-status>
            <span class="access-status ml-3">
              <v-icon size="x-small" aria-hidden="true">{{ isShared ? 'mdi-link-variant' : 'mdi-lock-outline' }}</v-icon>
              {{ isShared ? 'Shared by link' : 'Private' }}
            </span>
          </template>

          <template #header-actions>
            <v-btn
              v-if="isOwner"
              color="primary"
              variant="flat"
              rounded
              :prepend-icon="isShared ? 'mdi-link-variant' : 'mdi-lock-outline'"
              @click="shareDialogOpen = true"
            >
              Share
            </v-btn>
            <v-btn
              v-else
              color="primary"
              variant="flat"
              rounded
              prepend-icon="mdi-content-copy"
              :loading="copying"
              @click="makeCopy"
            >
              Make a copy
            </v-btn>
            <entity-more-menu
              class="ml-1"
              :api-url="apiUrl"
              show-export
              :export-label="`Export ${entityCollectionPlural.toLowerCase()} as CSV`"
              @export="onExport"
            >
              <template v-if="isOwner" #append-items>
                <v-divider class="my-1" />
                <v-list-item
                  prepend-icon="mdi-delete-outline"
                  base-color="error"
                  title="Delete collection"
                  @click="deleteDialogOpen = true"
                />
              </template>
            </entity-more-menu>
          </template>

          <template v-if="isOwner" #after-title>
            <collection-name-editor
              :current-name="collection.display_name"
              :is-owner="isOwner"
              :on-save="renameCollection"
            />
          </template>

          <template #after-header>
            <div class="text-body-2 meta-line mt-1">
              {{ memberCountLabel }} · Created {{ formattedDate }}
            </div>
            <!-- Over its type's live filter limit (oxjob #1527): it holds and exports
                 its members, and lists them here, but searches by it won't run. -->
            <div v-if="overLiveLimit" class="text-body-2 meta-line mt-1">
              Too big to filter live: searches by this collection take at most
              {{ liveLimit.toLocaleString() }} {{ entityCollectionPlural.toLowerCase() }}.
              It still lists and exports all of them.
            </div>
            <!-- Results being added on the server (Save results, Select all, a big copy). -->
            <collection-import-progress
              v-if="runningImport"
              :collection-id="collection.id"
              :initial="runningImport"
              :noun="entityCollectionPlural.toLowerCase()"
              class="mt-3 import-progress"
              @finished="onImportFinished"
            />
            <div v-if="!isOwner && isShared" class="text-body-2 meta-line mt-1">
              Shared with you by link. Only its owner can change it; make a copy to edit your own.
            </div>
            <div
              v-if="collection.description"
              class="collection-description mt-4"
            >{{ collection.description }}</div>

            <!-- Use the collection: open searches over its members. These leave
                 the page, so they sit with the collection, not the member list
                 (#366: discover on the real search page, manage here). -->
            <div class="d-flex flex-wrap align-center ga-2 mt-4">
              <collection-derived-works-button :collection="collection" variant="outlined" />
              <v-btn
                v-if="collection.entity_type !== 'works'"
                variant="text"
                :to="`/${guiEntityType}?filter=collection:${collection.id}`"
              >
                View as {{ entityCollectionPlural.toLowerCase() }} search
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </div>
          </template>
        </entity-header>

        <!-- Export as CSV: the search page's export dialog, scoped to the members.
             Its own activator stays hidden; the More menu opens it. -->
        <serp-results-export-button
          v-if="exportMode === 'async'"
          ref="exportButtonRef"
          :scope="exportScope"
          class="d-none"
        />

        <!-- Members list. Its toolbar holds what acts on the list: search the
             members (server-side, all of them, oxjob #366) and, for the owner,
             add more. -->
        <v-card variant="outlined" class="rounded-o bg-white">
          <!-- One toolbar row: the owner's select-all checkbox (SERP selection
               pattern), search, then Remove N when rows are ticked, and Add. -->
          <selection-toolbar :selectable="isOwner">
            <template #trailing>
              <div class="members-toolbar d-flex flex-wrap align-center ga-3 py-2" :class="{ 'ml-2': isOwner }">
                <v-text-field
                  v-if="!overLiveLimit"
                  v-model="searchInput"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  prepend-inner-icon="mdi-magnify"
                  :placeholder="`Search these ${memberCountLabel}`"
                  :aria-label="`Search the ${entityCollectionPlural.toLowerCase()} in this collection`"
                  class="members-search"
                  @keydown.enter="submitSearch"
                  @click:clear="clearSearch"
                />
                <v-btn
                  v-if="isOwner && selectedCount > 0"
                  color="error"
                  variant="text"
                  @click="askRemoveBulk"
                >
                  <v-icon start>mdi-delete-outline</v-icon>
                  Remove {{ selectedCount.toLocaleString() }}
                </v-btn>
                <!-- Opens the shared value-picker dialog; the server enforces ownership. -->
                <v-btn
                  v-if="isOwner"
                  variant="outlined"
                  rounded
                  prepend-icon="mdi-plus"
                  @click="addDialogOpen = true"
                >
                  Add {{ entityCollectionPlural.toLowerCase() }}
                </v-btn>
              </div>
            </template>
          </selection-toolbar>
          <v-divider />

          <div v-if="resultsLoading" class="d-flex justify-center my-12">
            <v-progress-circular indeterminate />
          </div>
          <!-- A failed member fetch used to read "This collection is empty" while the
               header said "4 entities". Say what happened instead. -->
          <v-alert
            v-else-if="resultsError"
            type="error"
            variant="tonal"
            class="ma-4"
          >
            {{ resultsError }}
          </v-alert>
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

    <collection-share-dialog
      v-if="collection && isOwner"
      v-model="shareDialogOpen"
      :collection="collection"
      @updated="onShareUpdated"
    />

    <people-collection-warning-dialog v-model="peopleWarningOpen" @continue="doCopy" />

    <!-- Make a copy while logged out: log in first, then come back and click again.
         Never copy automatically after the login redirect (labels-v1 security
         review H1: a link must not be able to write to someone's account). -->
    <v-dialog v-model="loginToCopyOpen" max-width="440">
      <v-card rounded class="pa-2">
        <v-card-title class="text-h6">Log in to make a copy</v-card-title>
        <v-card-text>
          A copy is a new private collection in your account, with the same members.
          Log in or sign up, then click Make a copy again.
        </v-card-text>
        <v-card-actions class="px-4 pb-3">
          <v-spacer />
          <v-btn variant="text" @click="goLogin">Log in</v-btn>
          <v-btn variant="flat" color="primary" @click="goSignup">Sign up</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add-members dialog (owner) -->
    <collection-add-entities-dialog
      v-if="collection && isOwner"
      v-model="addDialogOpen"
      :collection="collection"
    />

    <!-- Delete the collection (owner, from the More menu). Same words as the
         Settings list's delete. -->
    <v-dialog v-model="deleteDialogOpen" max-width="480">
      <v-card flat rounded>
        <v-card-title>Delete collection?</v-card-title>
        <v-card-text>
          <p>
            This will permanently delete
            <strong>{{ collection?.display_name }}</strong>
            and all {{ memberCountLabel }} in it. Its page and any search that uses it,
            yours or anyone's you shared it with, will say "Collection not found".
          </p>
          <p class="text-body-2 text-grey mt-2">This cannot be undone.</p>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="deleting" @click="deleteDialogOpen = false">Cancel</v-btn>
          <v-btn variant="flat" color="error" :loading="deleting" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { useRoute, useRouter } from "vue-router";
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
import CollectionShareDialog from "@/components/Collection/CollectionShareDialog.vue";
import PeopleCollectionWarningDialog from "@/components/Collection/PeopleCollectionWarningDialog.vue";
import { isPeopleCollectionType } from "@/components/Collection/peopleCollectionWarning";
import SelectionToolbar from "@/components/SelectionToolbar.vue";
import EntityMoreMenu from "@/components/Entity/EntityMoreMenu.vue";
import SerpResultsExportButton from "@/components/SerpResultsExportButton.vue";
import { exportToCsv } from "@/utils/csvExport";
import CollectionImportProgress from "@/components/Collection/CollectionImportProgress.vue";
import { liveFilterLimit } from "@/collectionLimits";

const route = useRoute();
const router = useRouter();
const store = useStore();

const collection = ref(null);
const loading = ref(true);
const errorMessage = ref("");

const results = ref([]);
const totalCount = ref(0);
const resultsLoading = ref(false);
const resultsError = ref("");
const page = ref(1);
const perPage = 25;

// Search this collection (server-side). `searchInput` is the box's live text;
// `searchTerm` is the applied query (set on Enter / clear), which the fetch uses.
const searchInput = ref("");
const searchTerm = ref("");

const addDialogOpen = ref(false);
const shareDialogOpen = ref(false);
const loginToCopyOpen = ref(false);
const copying = ref(false);
const peopleWarningOpen = ref(false);
const deleteDialogOpen = ref(false);
const deleting = ref(false);
const exportButtonRef = ref(null);

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

// Over its type's live filter limit, the members can't be listed through a filter
// by the collection: page them from the collection itself (oxjob #1527).
const liveLimit = computed(() => liveFilterLimit(collection.value?.entity_type));
const overLiveLimit = computed(() => (collection.value?.member_count ?? 0) > liveLimit.value);
// Types whose records can be fetched by `ids.openalex:` for a page of member IDs.
const ID_FILTER_TYPES = new Set(["works", "authors", "sources", "institutions", "topics", "funders", "publishers"]);
const runningImport = ref(null);

// The server says whether this caller may edit (only the owner can; oxjob #646).
const isOwner = computed(() => !!collection.value?.can_edit);
const isShared = computed(() => collection.value?.access === "shared_by_link");

// GUI type name for routes + entityConfigs lookups — identical to the
// collection entity_type except `work-types` → `types` (oxjob #396).
const guiEntityType = computed(() =>
  openalexId.fromCollectionEntityType(collection.value?.entity_type)
);

const entityCollectionPlural = computed(() => {
  if (!collection.value) return "";
  return entityConfigs?.[guiEntityType.value]?.displayName || collection.value.entity_type;
});
const entityCollectionSingular = computed(() => {
  if (!collection.value) return "";
  const cfg = entityConfigs?.[guiEntityType.value];
  if (cfg?.displayNameSingular) return cfg.displayNameSingular;
  const p = entityCollectionPlural.value;
  return p.endsWith("s") ? p.slice(0, -1) : p;
});

// "42 institutions", "1 institution".
const memberCountLabel = computed(() => {
  const n = collection.value?.member_count ?? 0;
  const noun = n === 1 ? entityCollectionSingular.value : entityCollectionPlural.value;
  return `${n.toLocaleString()} ${noun.toLowerCase()}`;
});

// The members as an API query. Only offered once the collection is shared by
// link: a private one reads as "not found" in a new tab without the owner's key.
const apiUrl = computed(() => (isShared.value && collection.value)
  ? `https://api.openalex.org/${guiEntityType.value}?filter=collection:${collection.value.id}`
  : "");

// Export the members as CSV (#1508). Big types go through the search page's
// export dialog (columns, emailed when ready); small ones (countries, SDGs...)
// download in the browser, as their search pages do.
const exportMode = computed(() => entityConfigs?.[guiEntityType.value]?.exportMode || "async");
const exportScope = computed(() => ({
  filter: `collection:${collection.value?.id}`,
  count: collection.value?.member_count ?? 0,
  entityType: guiEntityType.value,
  title: `Export ${entityCollectionPlural.value.toLowerCase()}`,
  // Expansion works stay in a works collection's members (see membersUrl).
  includeXpac: collection.value?.entity_type === "works",
}));

async function onExport() {
  if (overLiveLimit.value) {
    // Too big for the filter the export dialog runs: the member IDs themselves.
    store.commit("snackbar", "Preparing the members CSV…");
    try {
      await store.dispatch("collections/downloadMembersCsv", collection.value.id);
    } catch (e) {
      store.commit("snackbar", { msg: "Export failed. Try again.", color: "error" });
    }
    return;
  }
  if (exportMode.value === "async") {
    exportButtonRef.value?.openExportDialog();
    return;
  }
  const columns = entityConfigs?.[guiEntityType.value]?.exportColumns;
  if (!columns) return;
  store.commit("snackbar", "Exporting...");
  try {
    const count = await exportToCsv({
      url: `${urlBase.api}/${guiEntityType.value}`,
      params: { filter: `collection:${collection.value.id}` },
      columns,
      filename: `openalex_${collection.value.id}.csv`,
      perPage: 200,
      maxPages: 50,
    });
    store.commit("snackbar", `Exported ${count.toLocaleString()} ${entityCollectionPlural.value.toLowerCase()}.`);
  } catch (e) {
    console.error("Member export failed", e);
    store.commit("snackbar", { msg: "Export failed. Try again.", color: "error" });
  }
}

async function confirmDelete() {
  deleting.value = true;
  try {
    await store.dispatch("collections/remove", collection.value.id);
    store.commit("snackbar", "Collection deleted.");
    deleteDialogOpen.value = false;
    router.push({ name: "settings-collections" });
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Could not delete collection.",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

const formattedDate = computed(() => {
  if (!collection.value?.created_date) return "";
  try {
    // created_date is a bare date (2026-10-03): format it in UTC so it isn't
    // shifted a day by the viewer's zone.
    return new Date(collection.value.created_date).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
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
    // Public routes don't wait for /users/me, but the member list goes through
    // elastic-api with the user's API key: without it a private collection reads
    // as "not found" to its own owner on a first load.
    await store.dispatch("user/ensureUser");
    collection.value = await store.dispatch("collections/fetchPublic", collectionId.value);
    store.commit("setEntityType", openalexId.fromCollectionEntityType(collection.value.entity_type));
    if (!store.state.collections.loaded && !store.state.collections.loading) {
      store.dispatch("collections/fetchAll");
    }
    await Promise.all([loadResults(), loadImports()]);
  } catch (e) {
    errorMessage.value = collectionErrorMessage(e);
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

// One wording for "can't read it", whatever the cause (oxjob #646).
function collectionErrorMessage(e) {
  const status = e.response?.status;
  if (status === 404) return "Collection not found.";
  if (status === 429) return "Too many requests. Try again in a minute.";
  return e.response?.data?.message || "Could not load this collection. Try again.";
}

async function loadResults() {
  if (!collection.value) return;
  resultsLoading.value = true;
  resultsError.value = "";
  try {
    if (overLiveLimit.value) {
      await loadResultsFromMembers();
    } else {
      const resp = await axios.get(membersUrl(page.value, perPage), axiosConfig());
      results.value = resp.data?.results || [];
      totalCount.value = resp.data?.meta?.count || 0;
    }
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
    resultsError.value = e.response?.status === 404
      ? "Collection not found."
      : "Couldn't load the members. Try again in a moment.";
  } finally {
    resultsLoading.value = false;
  }
}

// A page of members from the collection itself, then their records by ID where the
// type has an ID filter (else the rows show the IDs).
async function loadResultsFromMembers() {
  const resp = await store.dispatch("collections/fetchEntities", {
    id: collection.value.id, page: page.value, per_page: perPage,
  });
  const ids = (resp?.results || []).map((m) => m.id);
  totalCount.value = resp?.meta?.count || 0;
  let records = [];
  if (ids.length && ID_FILTER_TYPES.has(collection.value.entity_type)) {
    const r = await axios.get(
      `${urlBase.api}/${guiEntityType.value}?filter=ids.openalex:${ids.join("|")}&include_xpac=true&per_page=${perPage}`,
      axiosConfig(),
    );
    records = r.data?.results || [];
  }
  const byId = new Map(records.map((rec) => [openalexId.toCollectionEntityId(rec.id) || rec.id, rec]));
  results.value = ids.map((id) => byId.get(id) || { id: `https://openalex.org/${id}`, display_name: id });
}

async function loadImports() {
  if (!isOwner.value) return;
  try {
    const imports = await store.dispatch("collections/fetchImports", collection.value.id);
    const active = imports.find((i) => i.status === "queued" || i.status === "running");
    runningImport.value = active || null;
  } catch {
    runningImport.value = null;
  }
}

async function onImportFinished(imp) {
  await store.dispatch("collections/importFinished", collection.value.id);
  collection.value = await store.dispatch("collections/fetchPublic", collection.value.id);
  await loadResults();
  if (imp.status === "failed") {
    store.commit("snackbar", { msg: imp.error?.message || "The results couldn't be added.", color: "error" });
  }
  runningImport.value = null;
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

function onShareUpdated(updated) {
  collection.value = { ...collection.value, access: updated.access };
}

async function makeCopy() {
  if (!store.state.user?.id) {
    loginToCopyOpen.value = true;
    return;
  }
  // A copy of a collection of people is a new collection of people (oxjob #646).
  if (isPeopleCollectionType(collection.value.entity_type)) {
    peopleWarningOpen.value = true;
    return;
  }
  await doCopy();
}

async function doCopy() {
  copying.value = true;
  try {
    const copy = await store.dispatch("collections/copy", collection.value.id);
    store.commit("snackbar", `Copied to your collections as “${copy.display_name}”.`);
    router.push(`/collections/${copy.id}`);
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Couldn't make a copy. Try again.",
      color: "error",
    });
  } finally {
    copying.value = false;
  }
}

function goLogin() {
  loginToCopyOpen.value = false;
  router.push({ name: "Login", query: { redirect: route.fullPath } });
}
function goSignup() {
  loginToCopyOpen.value = false;
  router.push({ name: "Signup", query: { redirect: route.fullPath } });
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
  removeBody.value = `These will be removed from this collection. The ${entityCollectionPlural.value.toLowerCase()} themselves are not deleted.`;
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
      member_ids: shortIds.slice(i, i + size),
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
    // Stored collection id form: bare code, canonical case (oxjob #396).
    const shortIds = fullIds.map(v => openalexId.toCollectionEntityId(v) || v).filter(Boolean);
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
  collection.value = { ...collection.value, member_count: totalCount.value };
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
.meta-line {
  color: rgba(0, 0, 0, 0.7);
}
.access-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.members-toolbar {
  flex: 1 1 auto;
  min-width: 0;
}
.members-search {
  flex: 1 1 240px;
}
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
