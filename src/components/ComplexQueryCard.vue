<template>
  <v-card variant="outlined" class="bg-white px-4 py-4">
    <div class="d-flex align-start">
      <v-icon size="20" class="mr-2 mt-1" color="medium-emphasis">mdi-code-braces</v-icon>
      <div class="flex-grow-1">
        <div class="text-body-2 font-weight-medium mb-1">
          This query is too complex to show as chips
        </div>
        <div class="text-body-2 text-medium-emphasis mb-3">
          It uses nested or cross-field logic that the chip view can't represent. View it as OQL instead.
        </div>
        <code
          v-if="oql"
          class="d-block text-caption text-medium-emphasis mb-3 px-2 py-1"
          style="background: rgba(0,0,0,0.04); border-radius: 4px; white-space: pre-wrap; word-break: break-word;"
        >{{ oql }}</code>
        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-open-in-app"
          @click="$emit('view-oql')"
        >
          View as OQL
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'ComplexQueryCard' });
defineEmits(['view-oql']);

const store = useStore();

// #378 C3: the server omits meta.x_query.url for queries with no flat oxurl form
// (nested booleans / cross-field OR). meta.x_query.oql is the bare-ID canonical
// OQL (decision 14); the name-annotated render lives in the OQL panel, which the
// "View as OQL" button reveals. This is only a lightweight preview + signpost.
const oql = computed(() => store.state.resultsObject?.meta?.x_query?.oql || '');
</script>
