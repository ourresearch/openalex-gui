<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="560"
    :z-index="zIndex ?? undefined"
  >
    <v-card flat rounded>
      <v-card-title>{{ importSource ? "Save results as a collection" : "Create collection" }}</v-card-title>
      <!-- Saving results (oxjob #1527): once created, the search's results are added
           on the server and this shows their progress. -->
      <div v-if="runningImport" class="px-4 pb-2">
        <div class="text-body-2 mb-3">
          <strong>{{ createdCollection.display_name }}</strong> is created. Its results are
          being added on our servers, so you can close this and keep working.
        </div>
        <collection-import-progress
          :collection-id="createdCollection.id"
          :initial="runningImport"
          :noun="entityType"
        />
      </div>
      <div v-else class="px-4 pb-2">
        <!-- A collection of people: warn before it's made (oxjob #646). -->
        <v-alert
          v-if="isPeopleCollectionType(entityType)"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4 people-warning"
        >
          {{ PEOPLE_COLLECTION_WARNING }}
        </v-alert>
        <v-text-field
          v-model="displayName"
          autofocus
          variant="outlined"
          density="compact"
          label="Name"
          :maxlength="MAX_DISPLAY_NAME_LENGTH"
          :counter="MAX_DISPLAY_NAME_LENGTH"
          :error-messages="apiError"
          @keyup.enter="onCreate"
        />
        <v-textarea
          v-model="description"
          variant="outlined"
          density="compact"
          label="Description (optional)"
          maxlength="500"
          rows="6"
        />
        <div v-if="entityIds.length" class="text-caption text-grey">
          Will be applied to {{ entityIds.length }} {{ noun }}.
        </div>
        <div v-if="importSource" class="text-caption text-grey">
          {{ importSummary }}
        </div>
      </div>
      <v-card-actions v-if="runningImport" class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="onCancel">Close</v-btn>
        <v-btn variant="flat" color="primary" @click="openCollection">Open collection</v-btn>
      </v-card-actions>
      <v-card-actions v-else class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="onCancel">Cancel</v-btn>
        <v-btn
          variant="flat"
          color="primary"
          :loading="saving"
          :disabled="!displayName.trim()"
          @click="onCreate"
        >{{ createButtonText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import CollectionImportProgress from "@/components/Collection/CollectionImportProgress.vue";
import { MAX_DISPLAY_NAME_LENGTH, MAX_MEMBERS_PER_COLLECTION } from "@/collectionLimits";
import { PEOPLE_COLLECTION_WARNING, isPeopleCollectionType } from "@/components/Collection/peopleCollectionWarning";

defineOptions({ name: "CollectionQuickCreateDialog" });

const props = defineProps({
  modelValue: Boolean,
  entityType: { type: String, required: true },
  entityIds: { type: Array, default: () => [] },
  // Only the entity fly-in sets this, to lift the dialog above the drawer.
  zIndex: { type: Number, default: null },
  // "Save results as a collection" (oxjob #1527): the search to add, as {query} or
  // {oql} (collectionImportSource.js), its result count, and rows to leave out.
  importSource: { type: Object, default: null },
  resultCount: { type: Number, default: null },
  excludeIds: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:modelValue", "created"]);

const store = useStore();
const router = useRouter();
const createdCollection = ref(null);
const runningImport = ref(null);
const displayName = ref("");
const description = ref("");
const apiError = ref("");
const saving = ref(false);

const noun = computed(() => {
  const plural = props.entityType || "";
  if (props.entityIds.length === 1 && plural.endsWith("s")) return plural.slice(0, -1);
  return plural;
});

const createButtonText = computed(() => {
  if (props.importSource) return "Create and add results";
  return props.entityIds.length ? "Create and assign" : "Create";
});

const importSummary = computed(() => {
  const n = Math.max(0, (props.resultCount ?? 0) - props.excludeIds.length);
  if (n > MAX_MEMBERS_PER_COLLECTION) {
    return `Adds the first ${MAX_MEMBERS_PER_COLLECTION.toLocaleString()} of ${n.toLocaleString()} results, `
      + "in the search's order: a collection holds at most that many.";
  }
  return `Adds all ${n.toLocaleString()} results.`;
});

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      displayName.value = "";
      description.value = "";
      apiError.value = "";
      createdCollection.value = null;
      runningImport.value = null;
    }
  }
);

async function onCreate() {
  const name = displayName.value.trim();
  if (!name) return;
  apiError.value = "";
  saving.value = true;
  try {
    const newCollection = await store.dispatch("collections/create", {
      display_name: name,
      description: description.value,
      entity_type: props.entityType,
      member_ids: props.importSource ? [] : props.entityIds,
    });
    emit("created", newCollection);
    if (props.importSource) {
      createdCollection.value = newCollection;
      try {
        runningImport.value = await store.dispatch("collections/startImport", {
          id: newCollection.id, source: props.importSource, exclude_ids: props.excludeIds,
        });
      } catch (e) {
        apiError.value = e.response?.data?.message || "The collection was created, but its results couldn't be added.";
        createdCollection.value = null;
      }
      return;
    }
    emit("update:modelValue", false);
    const n = props.entityIds.length;
    store.commit(
      "snackbar",
      n
        ? `Created "${newCollection.display_name}" and assigned to ${n} ${noun.value}.`
        : `Created "${newCollection.display_name}".`
    );
  } catch (e) {
    apiError.value = e.response?.data?.message || e.message || "Failed to create collection.";
  } finally {
    saving.value = false;
  }
}

function onCancel() {
  emit("update:modelValue", false);
}

function openCollection() {
  const id = createdCollection.value?.id;
  emit("update:modelValue", false);
  if (id) router.push({ name: "CollectionPublic", params: { collection_id: id } });
}
</script>

<style scoped>
/* Vuetify's tonal warning text is ~2.3:1 on its tint; darken it to pass WCAG AA. */
.people-warning {
  color: #7a4100 !important;
}
</style>
