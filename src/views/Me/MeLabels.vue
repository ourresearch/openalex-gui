<template>
  <div class="labels-page" style="min-height: 50vh;">
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">Labels</h1>
      <v-spacer />
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="showCreate = true"
      >
        New label
      </v-btn>
    </div>

    <div v-if="loading && !labels.length" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <label-list
      v-else
      :labels="labels"
      @edit="onEdit"
      @delete="onAskDelete"
    />

    <label-create-wizard
      v-model="showCreate"
      @created="onCreated"
    />

    <label-edit-dialog
      v-model="showEdit"
      :label="editingLabel"
      @saved="onSaved"
    />

    <v-dialog v-model="showDeleteConfirm" max-width="480">
      <v-card flat rounded>
        <v-card-title>Delete label?</v-card-title>
        <v-card-text>
          <p>
            This will permanently delete
            <strong>{{ deletingLabel?.display_name }}</strong>
            and all
            {{ deletingLabel?.entity_count ?? 0 }} entit{{ (deletingLabel?.entity_count ?? 0) === 1 ? "y" : "ies" }}
            in it. The label page will return 404 and any saved searches that filter on it will return zero results.
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

import LabelList from "@/components/Label/LabelList.vue";
import LabelCreateWizard from "@/components/Label/LabelCreateWizard.vue";
import LabelEditDialog from "@/components/Label/LabelEditDialog.vue";

defineOptions({ name: "MeLabels" });
useHead({ title: "Labels" });

const store = useStore();

const showCreate = ref(false);
const showEdit = ref(false);
const showDeleteConfirm = ref(false);
const editingLabel = ref(null);
const deletingLabel = ref(null);
const deleting = ref(false);

const labels = computed(() => store.state.labels.labels);
const loading = computed(() => store.state.labels.loading);

onMounted(async () => {
  try {
    await store.dispatch("labels/fetchAll");
  } catch (e) {
    store.commit("snackbar", { msg: "Could not load labels.", color: "error" });
  }
});

function onEdit(label) {
  editingLabel.value = label;
  showEdit.value = true;
}

function onAskDelete(label) {
  deletingLabel.value = label;
  showDeleteConfirm.value = true;
}

async function confirmDelete() {
  if (!deletingLabel.value) return;
  deleting.value = true;
  try {
    await store.dispatch("labels/remove", deletingLabel.value.id);
    store.commit("snackbar", "Label deleted.");
    showDeleteConfirm.value = false;
    deletingLabel.value = null;
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Could not delete label.",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

function onCreated() {
  // Refresh to pick up server-side fields (entity_count, timestamps).
  store.dispatch("labels/fetchAll");
}

function onSaved() {
  // The store already merged the PATCH response; nothing else to do.
}
</script>

<style lang="scss" scoped>
.labels-page {
  // Local styles only; sidebar/layout comes from SettingsBase.
}
</style>
