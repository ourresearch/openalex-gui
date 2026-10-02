<!--
  Shown when you copy a search link (or its OQL, API URL or OQO) that uses one of
  your private collections (oxjob #646): the people you send it to would get
  "Collection not found or not shared". Offers to share the collections by link
  first, or to copy anyway.
-->
<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded class="pa-2">
      <v-card-title class="text-h6 text-wrap">{{ title }}</v-card-title>
      <v-card-text>
        <p>
          People you send this to can't see {{ namesText }}.
          {{ collections.length === 1 ? "Share it by link?" : "Share them by link?" }}
        </p>
        <p class="text-body-2 help mt-2">
          Anyone with the link can view a collection shared by link and filter by it,
          logged in or not. It isn't listed or searchable, and only you can change it.
        </p>
        <v-alert
          v-if="hasAuthors"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-4 people-warning"
        >
          Lists of people say something about them. Don't share lists drawn from HR records.
        </v-alert>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4">
          {{ error }}
        </v-alert>
      </v-card-text>
      <v-card-actions class="px-4 pb-3 flex-wrap ga-2">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="$emit('copy')">Copy without sharing</v-btn>
        <v-btn variant="flat" color="primary" :loading="saving" @click="shareAndCopy">
          Share by link and copy
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";

defineOptions({ name: "PrivateCollectionsSharePrompt" });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // The user's own private collections the copied text references.
  collections: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:modelValue", "copy"]);

const store = useStore();
const saving = ref(false);
const error = ref("");

watch(() => props.modelValue, (open) => { if (open) error.value = ""; });

const title = computed(() =>
  props.collections.length === 1 ? "This search uses a private collection" : "This search uses private collections"
);
const namesText = computed(() => {
  const names = props.collections.map(c => `“${c.display_name}”`);
  if (names.length <= 1) return names[0] || "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
});
const hasAuthors = computed(() => props.collections.some(c => c.entity_type === "authors"));

async function shareAndCopy() {
  saving.value = true;
  error.value = "";
  try {
    for (const c of props.collections) {
      await store.dispatch("collections/setAccess", { id: c.id, access: "shared_by_link" });
    }
    emit("copy");
  } catch (e) {
    error.value = e.response?.data?.message || "Couldn't share. Try again.";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
/* Vuetify's tonal warning text is ~2.3:1 on its tint; darken it to pass WCAG AA. */
.people-warning {
  color: #7a4100 !important;
}
.help {
  color: rgba(0, 0, 0, 0.7);
}
</style>
