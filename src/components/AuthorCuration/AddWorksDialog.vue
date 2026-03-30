<template>
  <v-dialog v-model="dialogOpen" max-width="720" scrollable persistent>
    <v-card rounded>
      <v-card-title class="d-flex align-center justify-space-between">
        Add works to your profile
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-tabs v-model="activeTab" bg-color="transparent">
        <v-tab value="search">Search OpenAlex</v-tab>
        <v-tab value="upload">Upload CV</v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text class="pt-4" style="min-height: 400px; max-height: 70vh; overflow-y: auto;">
        <v-window v-model="activeTab">
          <v-window-item value="search">
            <AddWorksSearch
              :author-name="authorName"
              :author-id="authorId"
              @add-work="handleAddWork"
            />
          </v-window-item>

          <v-window-item value="upload">
            <AddWorksCVUpload
              :author-name="authorName"
              :author-id="authorId"
            />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import AddWorksSearch from './AddWorksSearch.vue';
import AddWorksCVUpload from './AddWorksCVUpload.vue';

defineOptions({ name: 'AddWorksDialog' });

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  authorName: {
    type: String,
    default: '',
  },
  authorId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'add-work']);

const dialogOpen = ref(props.modelValue);
const activeTab = ref('search');

watch(() => props.modelValue, (val) => {
  dialogOpen.value = val;
});

watch(dialogOpen, (val) => {
  emit('update:modelValue', val);
});

function close() {
  dialogOpen.value = false;
  activeTab.value = 'search';
}

function handleAddWork(workData) {
  emit('add-work', workData);
}
</script>
