<template>
  <v-menu
    max-width="400"
    class="rounded-lg"
    location="bottom"
    :close-on-content-click="false"
    v-model="isMenuOpen"
  >
    <template v-slot:activator="{ props }">
      <span
        v-bind="props"
        class="oql-value oql-interactive"
        :class="{ 'oql-value--entity': isEntityValue }"
        :title="fullDisplayName"
      >{{ truncatedDisplayName }}</span>
    </template>

    <v-card class="rounded-sm elevation-2">
      <!-- Entity value popup -->
      <template v-if="isEntityValue">
        <v-card-title>{{ displayName }}</v-card-title>
        <v-card-subtitle class="mb-0 pb-0">{{ entityDisplayId }}</v-card-subtitle>

        <v-divider />

        <v-card-actions class="justify-end">
          <v-btn
            variant="plain"
            class="text-black"
            :to="profileLink"
          >Profile</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="handleRemove"
          >Remove</v-btn>
        </v-card-actions>
      </template>

      <!-- Simple value popup (non-entity) -->
      <template v-else>
        <v-card-title>{{ segment.text }}</v-card-title>

        <v-divider />

        <v-card-actions class="justify-end">
          <v-btn
            color="primary"
            variant="flat"
            @click="handleRemove"
          >Remove</v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref, computed } from 'vue';
import filters from '@/filters';

defineOptions({ name: 'OqlValueSegment' });

const emit = defineEmits(['remove']);

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

// State
const isMenuOpen = ref(false);

// Computed
const isEntityValue = computed(() => {
  // Check if this is an entity value based on segment metadata
  return !!(props.segment.meta?.entity_id || props.clauseMeta?.value_entity);
});

const entityId = computed(() => {
  return props.segment.meta?.entity_id ||
         props.clauseMeta?.value_entity?.id ||
         props.clauseMeta?.value;
});

// Bracketed ID for display, e.g., "[i19820366]"
const entityDisplayId = computed(() => {
  return props.segment.meta?.entity_display_id ||
         (props.segment.meta?.entity_short_id ? `[${props.segment.meta.entity_short_id}]` : null);
});

// Display name comes from API's oql_render tree
const displayName = computed(() => {
  return props.segment.meta?.entity_display_name ||
         props.clauseMeta?.value_entity?.display_name ||
         props.segment.text;
});

// For inline display - use segment text (which should be the display name from API)
const fullDisplayName = computed(() => {
  return props.segment.meta?.entity_display_name ||
         props.clauseMeta?.value_entity?.display_name ||
         props.segment.text;
});

const MAX_DISPLAY_LENGTH = 40;

const truncatedDisplayName = computed(() => {
  const name = fullDisplayName.value;
  if (!name || name.length <= MAX_DISPLAY_LENGTH) return name;
  return name.substring(0, MAX_DISPLAY_LENGTH - 1) + '…';
});

const profileLink = computed(() => {
  if (!entityId.value) return null;
  return filters.entityZoomLink(entityId.value);
});

function handleRemove() {
  isMenuOpen.value = false;
  emit('remove', {
    columnId: props.clauseMeta?.column_id,
    value: props.clauseMeta?.value,
    sourcePointer: props.clauseMeta?.source_pointer
  });
}
</script>

<style lang="scss" scoped>
.oql-value {
  color: #1976d2;
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

.oql-value--entity {
  // Entity values can have distinct styling if needed
}

.text-black {
  color: #000 !important;
  opacity: 1 !important;
}
</style>
