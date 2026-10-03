<!--
  Share a collection (oxjob #646): one control, two levels (three for OpenAlex: Public, #1532). Private (only you), or
  Shared by link (anyone with the link or col_ ID can view it and filter by it,
  logged in or not; never listed or indexed; only the owner edits). The choice
  applies as soon as it's picked, like Google Docs' "General access" box.

  Opened from the collection page header and from the hub row menu.
-->
<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card v-if="collection" rounded class="pa-2 share-dialog">
      <v-card-title class="text-h6 text-wrap">
        Share “{{ collection.display_name }}”
      </v-card-title>

      <v-card-text>
        <v-radio-group
          :model-value="access"
          :disabled="saving"
          hide-details
          @update:model-value="setAccess"
        >
          <template #label>
            <span class="text-body-1 font-weight-medium">Who can see it</span>
          </template>
          <v-radio value="private" class="access-option">
            <template #label>
              <div class="d-flex flex-column py-1">
                <span class="text-body-1">
                  <v-icon size="small" start aria-hidden="true">mdi-lock-outline</v-icon>Private
                </span>
                <span class="text-body-2 option-help">Only you can see it.</span>
              </div>
            </template>
          </v-radio>
          <v-radio value="shared_by_link" class="access-option">
            <template #label>
              <div class="d-flex flex-column py-1">
                <span class="text-body-1">
                  <v-icon size="small" start aria-hidden="true">mdi-link-variant</v-icon>Shared by link
                </span>
                <span class="text-body-2 option-help">
                  Anyone with the link can view it and filter by it, logged in or not.
                  It isn't listed or searchable anywhere, and only you can change it.
                </span>
              </div>
            </template>
          </v-radio>
          <!-- Public (oxjob #1532): only OpenAlex makes a collection public, so the
               option shows only to admins, or on a collection that already is. -->
          <v-radio v-if="showPublicOption" value="public" class="access-option">
            <template #label>
              <div class="d-flex flex-column py-1">
                <span class="text-body-1">
                  <v-icon size="small" start aria-hidden="true">mdi-earth</v-icon>Public
                </span>
                <span class="text-body-2 option-help">
                  Listed in public collections: anyone can find it, view it and filter by it.
                  Only OpenAlex can make a collection public.
                </span>
              </div>
            </template>
          </v-radio>
        </v-radio-group>

        <v-alert
          v-if="collection.entity_type === 'authors'"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-4 people-warning"
        >
          {{ PEOPLE_COLLECTION_WARNING }}
        </v-alert>

        <div v-if="access === 'shared_by_link' || access === 'public'" class="mt-5">
          <div class="d-flex align-center ga-2">
            <v-text-field
              :model-value="link"
              label="Link"
              variant="outlined"
              density="compact"
              readonly
              hide-details
              class="flex-grow-1"
              @focus="$event.target.select()"
            />
            <v-btn color="primary" variant="flat" @click="copyLink">
              <v-icon start aria-hidden="true">mdi-content-copy</v-icon>
              Copy link
            </v-btn>
          </div>
          <div class="text-body-2 option-help mt-2">
            In filters and the API, use its ID: <code>{{ collection.id }}</code>
          </div>
        </div>

        <!-- Announces saves and copies to screen readers (WCAG 4.1.3). -->
        <div class="d-sr-only" aria-live="polite">{{ status }}</div>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="px-4 pb-3">
        <v-progress-circular v-if="saving" indeterminate size="20" width="2" aria-label="Saving" />
        <v-spacer />
        <v-btn variant="flat" color="primary" @click="$emit('update:modelValue', false)">Done</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { PEOPLE_COLLECTION_WARNING } from "@/components/Collection/peopleCollectionWarning";

defineOptions({ name: "CollectionShareDialog" });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  collection: { type: Object, default: null },
});
const emit = defineEmits(["update:modelValue", "updated"]);

const store = useStore();
const saving = ref(false);
const error = ref("");
const status = ref("");
const access = ref("private");

watch(
  () => [props.modelValue, props.collection?.access],
  () => {
    access.value = props.collection?.access || "private";
    if (props.modelValue) { error.value = ""; status.value = ""; }
  },
  { immediate: true },
);

const showPublicOption = computed(() =>
  props.collection?.access === "public" || store.getters["user/isAdmin"]
);

const link = computed(() =>
  props.collection ? `${window.location.origin}/collections/${props.collection.id}` : ""
);

async function setAccess(next) {
  if (!props.collection || next === access.value) return;
  const previous = access.value;
  access.value = next;
  saving.value = true;
  error.value = "";
  try {
    const updated = await store.dispatch("collections/setAccess", { id: props.collection.id, access: next });
    emit("updated", updated);
    status.value = {
      public: "Public. Anyone can find it in public collections.",
      shared_by_link: "Shared by link. Anyone with the link can view it.",
    }[next] || "Private. Only you can see it.";
  } catch (e) {
    access.value = previous;
    error.value = e.response?.data?.message || "Couldn't change who can see it. Try again.";
  } finally {
    saving.value = false;
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(link.value);
    status.value = "Link copied.";
    store.commit("snackbar", "Link copied.");
  } catch {
    error.value = "Couldn't copy. Select the link and copy it yourself.";
  }
}
</script>

<style scoped>
/* Vuetify fades labels to 60% (4.3:1 here); WCAG AA needs 4.5:1. */
.share-dialog :deep(.v-label) {
  opacity: 1;
  color: rgba(0, 0, 0, 0.75);
}
/* Vuetify's tonal warning text is ~2.3:1 on its tint; darken it to pass WCAG AA. */
.people-warning {
  color: #7a4100 !important;
}
.option-help {
  color: rgba(0, 0, 0, 0.7);
}
.access-option :deep(.v-label) {
  opacity: 1;
  align-items: flex-start;
}
.access-option + .access-option {
  margin-top: 8px;
}
</style>
