<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600">
    <v-card flat rounded>
      <v-card-title>Edit collection</v-card-title>
      <div class="pa-4">
        <v-text-field
          v-model="displayName"
          autofocus
          variant="outlined"
          density="compact"
          label="Name"
          maxlength="30"
          counter="30"
          :error-messages="apiError"
        />
        <v-textarea
          v-model="description"
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
        <v-btn variant="text" @click="$emit('update:modelValue', false)" :disabled="saving">Cancel</v-btn>
        <v-btn variant="flat" color="primary" :loading="saving" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { useStore } from "vuex";

const props = defineProps({
  modelValue: Boolean,
  collection: { type: Object, default: null },
});
const emit = defineEmits(["update:modelValue", "saved"]);

const store = useStore();
const displayName = ref("");
const description = ref("");
const apiError = ref("");
const saving = ref(false);

watch(
  () => [props.modelValue, props.collection],
  ([open, collection]) => {
    if (open && collection) {
      displayName.value = collection.display_name || "";
      description.value = collection.description || "";
      apiError.value = "";
    }
  },
  { immediate: true }
);

async function save() {
  apiError.value = "";
  saving.value = true;
  try {
    const updated = await store.dispatch("collections/update", {
      id: props.collection.id,
      display_name: displayName.value.trim(),
      description: description.value,
    });
    emit("saved", updated);
    emit("update:modelValue", false);
    store.commit("snackbar", "Collection updated.");
  } catch (e) {
    apiError.value = e.response?.data?.message || e.message || "Failed to save.";
  } finally {
    saving.value = false;
  }
}
</script>
