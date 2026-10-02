<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="560"
    :z-index="zIndex ?? undefined"
  >
    <v-card flat rounded>
      <v-card-title>Create collection</v-card-title>
      <div class="px-4 pb-2">
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
          maxlength="30"
          counter="30"
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
      </div>
      <v-card-actions class="px-4 pb-4">
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
import { PEOPLE_COLLECTION_WARNING, isPeopleCollectionType } from "@/components/Collection/peopleCollectionWarning";

defineOptions({ name: "CollectionQuickCreateDialog" });

const props = defineProps({
  modelValue: Boolean,
  entityType: { type: String, required: true },
  entityIds: { type: Array, default: () => [] },
  // Only the entity fly-in sets this, to lift the dialog above the drawer.
  zIndex: { type: Number, default: null },
});
const emit = defineEmits(["update:modelValue", "created"]);

const store = useStore();
const displayName = ref("");
const description = ref("");
const apiError = ref("");
const saving = ref(false);

const noun = computed(() => {
  const plural = props.entityType || "";
  if (props.entityIds.length === 1 && plural.endsWith("s")) return plural.slice(0, -1);
  return plural;
});

const createButtonText = computed(() =>
  props.entityIds.length ? "Create and assign" : "Create"
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      displayName.value = "";
      description.value = "";
      apiError.value = "";
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
      entity_ids: props.entityIds,
    });
    emit("created", newCollection);
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
</script>

<style scoped>
/* Vuetify's tonal warning text is ~2.3:1 on its tint; darken it to pass WCAG AA. */
.people-warning {
  color: #7a4100 !important;
}
</style>
