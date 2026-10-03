<template>
  <!-- One row in the unified entity/collection value picker. Purely
       presentational: selection + disabled state are owned by the parent
       (EntityValuePicker), which emits nothing back except a `toggle`. A
       collection row carries an "<entity> collection" subtitle so it reads
       as a saved set rather than a single entity (oxjob #367: singular entity,
       lowercase "collection"). -->
  <v-list-item
    :disabled="disabled"
    class="entity-value-row"
    :class="{ 'is-collection': isCollection, 'entity-row-highlighted': highlighted }"
    @click="onClick"
  >
    <template #prepend>
      <v-icon v-if="selected" color="primary">mdi-checkbox-marked</v-icon>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </template>

    <v-list-item-title>
      {{ displayValue }}
    </v-list-item-title>

    <v-list-item-subtitle v-if="isCollection" class="text-medium-emphasis collection-subtitle">
      {{ entityLabel }} collection
      <collection-access-tag :access="access" class="ml-1" />
    </v-list-item-subtitle>
    <v-list-item-subtitle v-else-if="hint" style="white-space: normal;">
      {{ filters.truncate(hint, 100) }}
    </v-list-item-subtitle>

    <template #append>
      <span v-if="count !== null && count !== undefined" class="text-body-2 text-medium-emphasis">
        {{ filters.toPrecision(count) }}
      </span>
    </template>
  </v-list-item>
</template>

<script setup>
import filters from '@/filters';
import CollectionAccessTag from '@/components/Collection/CollectionAccessTag.vue';

defineOptions({ name: 'EntityValueRow' });

const props = defineProps({
  displayValue: String,
  count: { type: [Number, null], default: null },
  hint: String,
  isCollection: { type: Boolean, default: false },
  // Singular entity name (e.g. "institution", "work"), shown as the
  // "<entity> collection" subtitle on collection rows (oxjob #367).
  entityLabel: { type: String, default: '' },
  // A collection row's access, shown as a small tag: Public, Private or Shared by
  // link (oxjob #1532), so a public collection reads differently from your own.
  access: { type: String, default: 'private' },
  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  // Keyboard-nav highlight (#353 B5).
  highlighted: { type: Boolean, default: false },
});

const emit = defineEmits(['toggle']);

function onClick() {
  if (!props.disabled) emit('toggle');
}
</script>

<style scoped lang="scss">
/* Collection rows are two lines (title + "<entity> collection"); pin the
   checkbox to the top so it lines up with the first line instead of floating
   mid-row. */
.entity-value-row.is-collection :deep(.v-list-item__prepend) {
  align-self: flex-start;
  padding-top: 6px;
}
.entity-value-row.entity-row-highlighted {
  background-color: rgba(0, 0, 0, 0.06);
}
</style>
