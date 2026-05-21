<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">Labels</h1>

    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-text-field
        v-model="localSearchQuery"
        variant="outlined"
        density="compact"
        placeholder="Search name, description, id"
        hide-details
        class="search-field"
        @update:model-value="debouncedSearch"
        @keydown.escape="clearSearch"
      >
        <template #prepend-inner>
          <v-icon size="small" color="grey">mdi-magnify</v-icon>
        </template>
        <template v-if="localSearchQuery" #append-inner>
          <v-btn icon variant="text" size="x-small" @click="clearSearch">
            <v-icon size="small">mdi-close</v-icon>
          </v-btn>
        </template>
      </v-text-field>

      <v-select
        v-model="entityFilter"
        :items="entityOptions"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        label="Entity type"
        class="filter-select"
      >
        <template #item="{ item, props: itemProps }">
          <v-list-item v-bind="itemProps" :prepend-icon="item.raw.icon" />
        </template>
        <template #selection="{ item }">
          <v-icon :icon="item.raw.icon" size="small" class="mr-1" />
          {{ item.title }}
        </template>
      </v-select>

      <v-text-field
        v-model="ownerFilter"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        label="Owner id"
        placeholder="user-XXX"
        class="filter-select owner-field"
        @keydown.enter="applyOwnerFilter"
        @click:clear="applyOwnerFilter"
      />
    </div>

    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <div v-if="labels.length || loading">
      <div class="mb-2">
        <span class="text-body-2 text-medium-emphasis">
          Showing {{ showingStart }}-{{ showingEnd }} of {{ totalCount }} labels
        </span>
      </div>

      <v-table density="comfortable" class="labels-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th class="text-right">Entities</th>
            <th>Owner</th>
            <th class="col-created">Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="label in labels" :key="label.id">
            <td>
              <div class="d-flex flex-column">
                <span class="font-weight-medium">
                  <v-icon color="grey" start size="small">{{ entityIcon(label.entity_type) }}</v-icon>
                  {{ label.display_name }}
                </span>
                <span v-if="label.description" class="label-description text-grey">
                  {{ label.description }}
                </span>
                <span class="label-id text-grey">{{ label.id }}</span>
              </div>
            </td>
            <td class="text-grey">{{ label.entity_type }}</td>
            <td class="text-right">{{ label.entity_count ?? 0 }}</td>
            <td>
              <router-link
                :to="`/admin/users/${label.user_id}`"
                class="owner-link"
              >{{ label.user_id }}</router-link>
            </td>
            <td class="col-created text-grey">{{ formatDate(label.created_at) }}</td>
            <td class="text-right">
              <v-menu location="bottom end">
                <template #activator="{ props }">
                  <v-btn icon variant="plain" v-bind="props">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item :to="`/labels/${label.id}`" target="_blank">
                    <template #prepend>
                      <v-icon size="small">mdi-share-variant-outline</v-icon>
                    </template>
                    <v-list-item-title>View public page</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="openEdit(label)">
                    <template #prepend>
                      <v-icon size="small">mdi-pencil-outline</v-icon>
                    </template>
                    <v-list-item-title>Edit name / description</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="openDelete(label)" base-color="error">
                    <template #prepend>
                      <v-icon size="small" color="error">mdi-delete-outline</v-icon>
                    </template>
                    <v-list-item-title>Delete</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </v-table>

      <div class="d-flex justify-end align-center mt-4">
        <v-btn icon variant="text" size="small" :disabled="page <= 1" @click="prevPage">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <span class="text-body-2 mx-2">Page {{ page }} of {{ totalPages }}</span>
        <v-btn icon variant="text" size="small" :disabled="page >= totalPages" @click="nextPage">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </div>

    <div v-else-if="!loading" class="text-center text-medium-emphasis py-8">
      No labels found.
    </div>

    <!-- Edit dialog -->
    <v-dialog v-model="editOpen" max-width="600">
      <v-card flat rounded>
        <v-card-title>Edit label</v-card-title>
        <div class="pa-4">
          <div class="text-caption text-grey mb-3">
            <code>{{ editing?.id }}</code> · owner
            <code>{{ editing?.user_id }}</code>
          </div>
          <v-text-field
            v-model="editDisplayName"
            autofocus
            variant="outlined"
            density="compact"
            label="Name"
            maxlength="100"
            counter="100"
            :error-messages="editApiError"
          />
          <v-textarea
            v-model="editDescription"
            variant="outlined"
            density="compact"
            label="Description"
            maxlength="500"
            counter="500"
            rows="3"
            class="mt-2"
          />
        </div>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="editOpen = false" :disabled="editSaving">Cancel</v-btn>
          <v-btn variant="flat" color="primary" :loading="editSaving" @click="saveEdit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation -->
    <v-dialog v-model="deleteOpen" max-width="500">
      <v-card flat rounded>
        <v-card-title>Delete label</v-card-title>
        <div class="px-4 pb-2">
          Delete <strong>{{ deleting?.display_name }}</strong>
          ({{ deleting?.entity_count ?? 0 }} entities, owner
          <code>{{ deleting?.user_id }}</code>)?
          This cannot be undone.
        </div>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteOpen = false" :disabled="deleteSaving">Cancel</v-btn>
          <v-btn variant="flat" color="error" :loading="deleteSaving" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useStore } from "vuex";
import axios from "axios";
import { urlBase, axiosConfig } from "@/apiConfig";
import { entityConfigs } from "@/entityConfigs";

defineOptions({ name: "AdminLabels" });

const store = useStore();

const SUPPORTED_TYPES = [
  "works", "authors", "sources", "institutions", "topics",
  "sdgs", "funders", "publishers", "keywords", "concepts",
];

const entityOptions = SUPPORTED_TYPES.map((value) => ({
  title: value,
  value,
  icon: entityConfigs?.[value]?.icon || "mdi-label-outline",
}));

const labels = ref([]);
const loading = ref(false);
const error = ref("");

const localSearchQuery = ref("");
const entityFilter = ref(null);
const ownerFilter = ref("");

const page = ref(1);
const perPage = ref(25);
const totalCount = ref(0);
const totalPages = ref(1);

const showingStart = computed(() =>
  totalCount.value === 0 ? 0 : (page.value - 1) * perPage.value + 1
);
const showingEnd = computed(() =>
  Math.min(page.value * perPage.value, totalCount.value)
);

let debounceTimer = null;

async function fetchLabels() {
  loading.value = true;
  error.value = "";
  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      per_page: perPage.value.toString(),
    });
    const q = localSearchQuery.value.trim();
    if (q) params.set("q", q);
    if (entityFilter.value) params.set("entity_type", entityFilter.value);
    const oid = ownerFilter.value.trim();
    if (oid) params.set("owner_id", oid);

    const resp = await axios.get(
      `${urlBase.userApi}/admin/labels?${params.toString()}`,
      axiosConfig({ userAuth: true })
    );
    labels.value = resp.data.results || [];
    totalCount.value = resp.data.meta?.total_count || 0;
    totalPages.value = resp.data.meta?.total_pages || 1;
  } catch (e) {
    error.value = e?.response?.data?.message || "Failed to load labels.";
    labels.value = [];
    totalCount.value = 0;
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
}

function debouncedSearch() {
  loading.value = true;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    fetchLabels();
  }, 250);
}

function clearSearch() {
  localSearchQuery.value = "";
  page.value = 1;
  fetchLabels();
}

function applyOwnerFilter() {
  page.value = 1;
  fetchLabels();
}

watch(entityFilter, () => {
  page.value = 1;
  fetchLabels();
});

function prevPage() {
  if (page.value > 1) {
    page.value--;
    fetchLabels();
  }
}
function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
    fetchLabels();
  }
}

function entityIcon(type) {
  return entityConfigs?.[type]?.icon || "mdi-label-outline";
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return iso;
  }
}

// Edit dialog
const editOpen = ref(false);
const editing = ref(null);
const editDisplayName = ref("");
const editDescription = ref("");
const editApiError = ref("");
const editSaving = ref(false);

function openEdit(label) {
  editing.value = label;
  editDisplayName.value = label.display_name || "";
  editDescription.value = label.description || "";
  editApiError.value = "";
  editOpen.value = true;
}

async function saveEdit() {
  editApiError.value = "";
  editSaving.value = true;
  try {
    const resp = await axios.patch(
      `${urlBase.userApi}/admin/labels/${editing.value.id}`,
      {
        display_name: editDisplayName.value.trim(),
        description: editDescription.value,
      },
      axiosConfig({ userAuth: true })
    );
    // patch the in-memory row
    const idx = labels.value.findIndex(l => l.id === editing.value.id);
    if (idx >= 0) labels.value[idx] = { ...labels.value[idx], ...resp.data };
    editOpen.value = false;
    store.commit("snackbar", "Label updated.");
  } catch (e) {
    editApiError.value = e.response?.data?.message || e.message || "Failed to save.";
  } finally {
    editSaving.value = false;
  }
}

// Delete dialog
const deleteOpen = ref(false);
const deleting = ref(null);
const deleteSaving = ref(false);

function openDelete(label) {
  deleting.value = label;
  deleteOpen.value = true;
}

async function confirmDelete() {
  deleteSaving.value = true;
  try {
    await axios.delete(
      `${urlBase.userApi}/admin/labels/${deleting.value.id}`,
      axiosConfig({ userAuth: true })
    );
    labels.value = labels.value.filter(l => l.id !== deleting.value.id);
    totalCount.value = Math.max(0, totalCount.value - 1);
    deleteOpen.value = false;
    store.commit("snackbar", "Label deleted.");
  } catch (e) {
    store.commit("snackbar", e.response?.data?.message || "Failed to delete.");
  } finally {
    deleteSaving.value = false;
  }
}

onMounted(fetchLabels);
</script>

<style scoped lang="scss">
.labels-table {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;

  :deep(thead th) {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(0, 0, 0, 0.55);
  }
  :deep(td) {
    font-size: 14px;
    vertical-align: top;
  }
  .col-created {
    white-space: nowrap;
  }
}

.search-field {
  max-width: 320px;
  flex-shrink: 0;
  :deep(.v-field) {
    border-radius: 6px;
  }
}

.filter-select {
  max-width: 200px;
}

.owner-field {
  max-width: 220px;
  :deep(.v-field) {
    border-radius: 6px;
  }
}

.label-description {
  font-size: 12px;
  margin-top: 2px;
  max-width: 480px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.label-id {
  font-size: 11px;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
}

.owner-link {
  color: inherit;
  text-decoration: none;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  font-size: 12px;
  &:hover { text-decoration: underline; }
}
</style>
