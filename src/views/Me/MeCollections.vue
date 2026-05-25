<template>
  <div class="collections-page" style="min-height: 50vh;">
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">Collections</h1>
      <v-spacer />
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="showCreate = true"
      >
        New collection
      </v-btn>
    </div>

    <div v-if="loading && !collections.length" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <collection-list
      v-else
      :collections="collections"
      @edit="onEdit"
      @delete="onAskDelete"
    />

    <collection-create-wizard
      v-model="showCreate"
      @created="onCreated"
    />

    <collection-edit-dialog
      v-model="showEdit"
      :label="editingCollection"
      @saved="onSaved"
    />

    <v-dialog v-model="showDeleteConfirm" max-width="480">
      <v-card flat rounded>
        <v-card-title>Delete collection?</v-card-title>
        <v-card-text>
          <p>
            This will permanently delete
            <strong>{{ deletingCollection?.display_name }}</strong>
            and all
            {{ deletingCollection?.entity_count ?? 0 }} entit{{ (deletingCollection?.entity_count ?? 0) === 1 ? "y" : "ies" }}
            in it. The collection page will return 404 and any saved searches that filter on it will return zero results.
          </p>
          <p class="text-body-2 text-grey mt-2">This cannot be undone.</p>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showDeleteConfirm = false" :disabled="deleting">Cancel</v-btn>
          <v-btn variant="flat" color="error" :loading="deleting" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useHead } from "@unhead/vue";

import CollectionList from "@/components/Collection/CollectionList.vue";
import CollectionCreateWizard from "@/components/Collection/CollectionCreateWizard.vue";
import CollectionEditDialog from "@/components/Collection/CollectionEditDialog.vue";

defineOptions({ name: "MeCollections" });
useHead({ title: "Collections" });

const store = useStore();

const showCreate = ref(false);
const showEdit = ref(false);
const showDeleteConfirm = ref(false);
const editingCollection = ref(null);
const deletingCollection = ref(null);
const deleting = ref(false);

const collections = computed(() => store.state.collections.collections);
const loading = computed(() => store.state.collections.loading);

onMounted(async () => {
  try {
    await store.dispatch("collections/fetchAll");
  } catch (e) {
    store.commit("snackbar", { msg: "Could not load collections.", color: "error" });
  }
});

function onEdit(collection) {
  editingCollection.value = collection;
  showEdit.value = true;
}

function onAskDelete(collection) {
  deletingCollection.value = collection;
  showDeleteConfirm.value = true;
}

async function confirmDelete() {
  if (!deletingCollection.value) return;
  deleting.value = true;
  try {
    await store.dispatch("collections/remove", deletingCollection.value.id);
    store.commit("snackbar", "Collection deleted.");
    showDeleteConfirm.value = false;
    deletingCollection.value = null;
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Could not delete collection.",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

function onCreated() {
  // Refresh to pick up server-side fields (entity_count, timestamps).
  store.dispatch("collections/fetchAll");
}

function onSaved() {
  // The store already merged the PATCH response; nothing else to do.
}
</script>

<style lang="scss" scoped>
.collections-page {
  // Local styles only; sidebar/layout comes from SettingsBase.
}
</style>
