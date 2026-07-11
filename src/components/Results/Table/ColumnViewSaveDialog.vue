<template>
  <v-dialog v-model="myIsOpen" max-width="500">
    <v-card :loading="isLoading" :disabled="isLoading" v-if="userId" flat rounded>
      <v-card-title>Save columns as view</v-card-title>
      <v-card-subtitle>
        Save the current columns and sort as a named view you can reload later.
      </v-card-subtitle>
      <div class="pa-4 pb-0">
        <v-text-field
          autofocus
          rounded
          variant="solo-filled"
          flat
          clearable
          placeholder="Name (required)"
          v-model="nameString"
          :error-messages="errorMessage"
          counter="100"
          @keydown.enter="save"
          @update:model-value="errorMessage = ''"
        />
      </div>
      <div class="px-6 pb-2">
        <div class="text-caption text-medium-emphasis mb-1">Columns in this view</div>
        <v-chip
          v-for="col in columnChips"
          :key="col.key"
          size="small"
          variant="tonal"
          class="mr-1 mb-1"
        >{{ col.label }}</v-chip>
        <div v-if="sortLabel" class="text-caption text-medium-emphasis mt-2">
          Sorted by {{ sortLabel }}
        </div>
      </div>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" rounded @click="myIsOpen = false">Cancel</v-btn>
        <v-btn variant="flat" rounded color="primary" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>

    <v-card v-else flat rounded>
      <v-card-title>Login required</v-card-title>
      <v-card-text>
        To save column views, you must be signed up and logged in.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" rounded @click="clickLogin">Log in</v-btn>
        <v-btn rounded color="primary" @click="clickSignup">Sign up</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import filters from '@/filters';
import { resolveColumns } from '@/components/Results/Table/columnConfig';

defineOptions({ name: 'ColumnViewSaveDialog' });

// Gmail-canned-responses "save" dialog (oxjob #602): shows the CURRENT column
// set (read-only) + a required name, unique per (user, entity type). The server
// enforces uniqueness too (409); we pre-check against the fetched list so the
// common case errors inline without a round trip.
const props = defineProps({
  isOpen: Boolean,
  entityType: { type: String, required: true },
  // Ordered column keys + sort spec captured by the kebab at open time.
  columnKeys: { type: Array, required: true },
  sortBy: { type: Array, default: null },
});

const emit = defineEmits(['close']);

const store = useStore();
const route = useRoute();
const router = useRouter();

const nameString = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const userId = computed(() => store.getters['user/userId']);

const myIsOpen = computed({
  get() {
    return props.isOpen;
  },
  set() {
    emit('close');
  },
});

const columnChips = computed(() =>
  resolveColumns(props.entityType, props.columnKeys).map((col) => ({
    key: col.key,
    label: filters.capitalize(col.label),
  })),
);

const sortLabel = computed(() => {
  const s = props.sortBy?.[0];
  if (!s) return null;
  const col = resolveColumns(props.entityType, [s.column_id])[0];
  const name = col ? filters.capitalize(col.label) : s.column_id;
  return `${name} (${s.direction === 'asc' ? 'ascending' : 'descending'})`;
});

async function save() {
  const name = nameString.value?.trim();
  if (!name) {
    errorMessage.value = 'A name is required';
    return;
  }
  const clash = store.getters['user/userColumnViews'].find(
    (v) => v.entity_type === props.entityType && v.name.toLowerCase() === name.toLowerCase(),
  );
  if (clash) {
    errorMessage.value = `You already have a view named "${clash.name}"`;
    return;
  }
  isLoading.value = true;
  try {
    await store.dispatch('user/createColumnView', {
      entity_type: props.entityType,
      name,
      columns: [...props.columnKeys],
      sort_by: props.sortBy ?? null,
    });
    store.commit('snackbar', 'View saved.');
    myIsOpen.value = false;
  } catch (e) {
    // Server-side uniqueness (409) or validation (400) — surface inline.
    errorMessage.value = e?.response?.data?.message || 'Could not save view';
  } finally {
    isLoading.value = false;
  }
}

function clickSignup() {
  myIsOpen.value = false;
  router.push({ name: 'Signup', query: { redirect: route.fullPath } });
}

function clickLogin() {
  myIsOpen.value = false;
  router.push({ name: 'Login', query: { redirect: route.fullPath } });
}

watch(
  () => props.isOpen,
  () => {
    nameString.value = '';
    errorMessage.value = '';
  },
);
</script>
