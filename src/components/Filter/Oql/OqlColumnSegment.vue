<template>
  <v-menu
    max-width="300"
    location="bottom"
    :close-on-content-click="false"
    v-model="isMenuOpen"
  >
    <template v-slot:activator="{ props }">
      <span
        v-bind="props"
        class="oql-column oql-interactive"
      >{{ segment.text }}</span>
    </template>

    <v-card class="rounded-sm elevation-2">
      <v-card-title class="text-body-1">{{ displayName }}</v-card-title>

      <v-divider />

      <v-card-text class="py-2">
        <div v-if="columnDescription" class="text-body-2 text-grey-darken-1">
          {{ columnDescription }}
        </div>
        <div v-else class="text-body-2 text-grey">
          Column: {{ columnId }}
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { getFacetConfig } from '@/facetConfigUtils';

defineOptions({ name: 'OqlColumnSegment' });

const props = defineProps({
  segment: {
    type: Object,
    required: true
  },
  clauseMeta: {
    type: Object,
    default: null
  }
});

const store = useStore();
const entityType = computed(() => store.getters.entityType);

const isMenuOpen = ref(false);

const columnId = computed(() => {
  return props.segment.meta?.column_id || props.clauseMeta?.column_id;
});

const displayName = computed(() => {
  return props.clauseMeta?.column_display_name || props.segment.text;
});

const facetConfig = computed(() => {
  if (!columnId.value) return null;
  return getFacetConfig(entityType.value, columnId.value);
});

const columnDescription = computed(() => {
  return facetConfig.value?.description || null;
});
</script>

<style lang="scss" scoped>
.oql-column {
  color: #333;
  font-weight: 500;
}

.oql-interactive {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 6px;
  margin: 0 -2px;
  border: 1px solid transparent;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    border-color: #ccc;
  }
}
</style>
