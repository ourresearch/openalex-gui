<template>
  <v-dialog v-model="dialogOpen" max-width="720" scrollable>
    <v-card rounded :key="instanceKey">
      <v-card-title class="d-flex align-center justify-space-between">
        {{ mode === 'cv' ? 'Add works from your CV' : 'Add works from search' }}
        <v-btn icon variant="text" size="small" @click="dialogOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text v-if="mode === 'search'" class="pa-0">
        <AddWorksSearch
          :author-name="authorName"
          :author-id="authorId"
          @add-work="(p) => $emit('add-work', p)"
          @done="dialogOpen = false"
        />
      </v-card-text>
      <v-card-text
        v-else
        class="pt-4"
        style="min-height: 400px; max-height: 70vh; overflow-y: auto;"
      >
        <AddWorksCVUpload
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
// Bumped on every open so the inner component remounts with fresh state —
// a closed-then-reopened dialog never shows the previous search/results.
const instanceKey = ref(0);
watch(() => props.modelValue, (v) => { dialogOpen.value = v; });
watch(dialogOpen, (v) => {
  emit('update:modelValue', v);
  if (v) instanceKey.value++;
});
</script>
