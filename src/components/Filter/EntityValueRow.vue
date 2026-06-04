<template>
  <!-- One row in the unified entity/collection value picker. Purely
       presentational: selection + disabled state are owned by the parent
       (EntityValuePicker), which emits nothing back except a `toggle`. A
       collection row carries a folder icon + "Collection" subtitle so it reads
       as a saved set rather than a single entity. -->
  <v-list-item
    :disabled="disabled"
    class="entity-value-row"
    :class="{ 'is-collection': isCollection }"
    @click="onClick"
  >
    <template #prepend>
      <v-icon v-if="selected" color="primary">mdi-checkbox-marked</v-icon>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </template>

    <v-list-item-title>
      <v-icon v-if="isCollection" size="18" class="folder-icon">mdi-folder-outline</v-icon>
      {{ displayValue }}
    </v-list-item-title>

    <v-list-item-subtitle v-if="isCollection" class="text-medium-emphasis">
      inCollection
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

defineOptions({ name: 'EntityValueRow' });

const props = defineProps({
  displayValue: String,
  count: { type: [Number, null], default: null },
  hint: String,
  isCollection: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['toggle']);

function onClick() {
  if (!props.disabled) emit('toggle');
}
</script>

<style scoped lang="scss">
.folder-icon {
  vertical-align: -3px;
  margin-right: 2px;
}

/* Collection rows are two lines (title + "inCollection"); pin the checkbox to
   the top so it lines up with the first line instead of floating mid-row. */
.entity-value-row.is-collection :deep(.v-list-item__prepend) {
  align-self: flex-start;
  padding-top: 6px;
}
</style>
