<template>
  <v-dialog v-model="dialogOpen" max-width="720" scrollable persistent>
    <v-card rounded>
      <v-card-title class="d-flex align-center justify-space-between">
        {{ mode === 'cv' ? 'Add works from your CV' : 'Add works from search' }}
        <v-btn icon variant="text" size="small" @click="dialogOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4" style="min-height: 400px; max-height: 70vh; overflow-y: auto;">
        <AddWorksSearch
          v-if="mode === 'search'"
          :author-name="authorName"
          :author-id="authorId"
          @add-work="(p) => $emit('add-work', p)"
        />
        <AddWorksCVUpload
          v-else
          :author-name="authorName"
          :author-id="authorId"
          @add-work="(p) => $emit('add-work', p)"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import AddWorksSearch from './AddWorksSearch.vue';
import AddWorksCVUpload from './AddWorksCVUpload.vue';

defineOptions({ name: 'AddWorksModal' });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'search' }, // 'search' | 'cv'
  authorName: { type: String, default: '' },
  authorId: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'add-work']);

const dialogOpen = ref(props.modelValue);
watch(() => props.modelValue, (v) => { dialogOpen.value = v; });
watch(dialogOpen, (v) => { emit('update:modelValue', v); });
</script>
