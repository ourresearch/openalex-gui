<template>
  <v-dialog v-model="isOpen" max-width="600">
      <v-card :loading="isLoading" flat rounded>
        <v-card-title>Rename saved search</v-card-title>
        <div class="pa-4">
          <v-text-field
            autofocus
            rounded
            variant="solo-filled"
            flat
            clearable
            prepend-inner-icon="mdi-magnify"
            placeholder="New name"
            v-model="renameString"
            @keydown.enter="rename"
            counter="25"
          />
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="isOpen = false">Cancel</v-btn>
          <v-btn variant="flat" rounded color="primary" @click="rename">Rename</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'SavedSearchRenameDialog' });

defineProps({
  id: String,
});

const store = useStore();

const renameString = ref('');
const isLoading = ref(false);

const renameId = computed(() => store.getters['user/renameId']);

// Computed: is dialog open
const isOpen = computed({
  get() {
    return !!renameId.value;
  },
  set(val) {
    store.commit('user/setRenameId', val);
  },
});

const updateSearchName = (payload) => store.dispatch('user/updateSearchName', payload);

// Method: rename
async function rename() {
  console.log('rename search', renameId.value, renameString.value);
  isLoading.value = true;
  await updateSearchName({ id: renameId.value, name: renameString.value });
  renameString.value = '';
  isLoading.value = false;
  isOpen.value = false;
}
</script>