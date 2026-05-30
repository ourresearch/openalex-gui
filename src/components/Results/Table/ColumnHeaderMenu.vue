<template>
  <v-menu location="bottom start" :close-on-content-click="true">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        class="column-header-caret"
        icon
        variant="text"
        size="x-small"
        density="compact"
        :aria-label="`Column options for ${column.label}`"
        @click.stop
      >
        <v-icon size="18" color="grey-darken-1">mdi-menu-down</v-icon>
      </v-btn>
    </template>

    <v-list density="compact" min-width="200">
      <!-- Sort -->
      <template v-if="canSort">
        <v-list-item @click="emit('sort', 'asc')">
          <template #prepend>
            <v-icon size="18">mdi-arrow-up</v-icon>
          </template>
          <v-list-item-title>Sort ascending</v-list-item-title>
          <template #append>
            <v-icon v-if="isSortedAsc" size="18">mdi-check</v-icon>
          </template>
        </v-list-item>
        <v-list-item @click="emit('sort', 'desc')">
          <template #prepend>
            <v-icon size="18">mdi-arrow-down</v-icon>
          </template>
          <v-list-item-title>Sort descending</v-list-item-title>
          <template #append>
            <v-icon v-if="isSortedDesc" size="18">mdi-check</v-icon>
          </template>
        </v-list-item>
      </template>

      <!-- Filter by this property -->
      <v-list-item v-if="canFilter" @click="emit('filter')">
        <template #prepend>
          <v-icon size="18">mdi-filter-variant</v-icon>
        </template>
        <v-list-item-title>Filter by this…</v-list-item-title>
      </v-list-item>

      <v-divider v-if="canSort || canFilter" />

      <!-- Move -->
      <v-list-item :disabled="!canMoveLeft" @click="canMoveLeft && emit('move', 'left')">
        <template #prepend>
          <v-icon size="18">mdi-arrow-left</v-icon>
        </template>
        <v-list-item-title>Move left</v-list-item-title>
      </v-list-item>
      <v-list-item :disabled="!canMoveRight" @click="canMoveRight && emit('move', 'right')">
        <template #prepend>
          <v-icon size="18">mdi-arrow-right</v-icon>
        </template>
        <v-list-item-title>Move right</v-list-item-title>
      </v-list-item>

      <!-- Pin (leftmost-sticky) -->
      <v-list-item @click="emit('pin')">
        <template #prepend>
          <v-icon size="18">{{ pinned ? 'mdi-pin-off' : 'mdi-pin' }}</v-icon>
        </template>
        <v-list-item-title>{{ pinned ? 'Unpin column' : 'Pin column' }}</v-list-item-title>
      </v-list-item>

      <!-- Remove (mandatory identity column can't be removed) -->
      <v-list-item :disabled="!canRemove" @click="canRemove && emit('remove')">
        <template #prepend>
          <v-icon size="18">mdi-close</v-icon>
        </template>
        <v-list-item-title>Remove column</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({ name: 'ColumnHeaderMenu' });

// Notion-style per-column-header dropdown. Items are gated by the property's
// `actions` (sort/filter) and the column's position/mandatory-ness (move/remove).
// The component is presentation-only: it emits semantic events; ResultsTable
// owns the state mutations (useColumnsState, url sort, pin, filter routing).
const props = defineProps({
  // Resolved column descriptor (columnConfig.resolveColumn): { key, baseKey,
  // label, isColumnMandatory, actions, facetType, ... }.
  column: { type: Object, required: true },
  // Position of this column among the visible columns + the total count, for
  // edge-disabling Move left/right.
  index: { type: Number, required: true },
  total: { type: Number, required: true },
  // Active sort state (url.getSortField / getSortDirection), so the menu can
  // show a check next to the active direction.
  sortField: { type: String, default: '' },
  sortDirection: { type: String, default: 'desc' },
  // Whether this column is currently pinned (leftmost-sticky).
  pinned: { type: Boolean, default: false },
});

const emit = defineEmits(['sort', 'filter', 'move', 'pin', 'remove']);

// Sort/filter operate on the base property; an :ids variant has no independent
// sort/filter behaviour, so both gate on the base config's actions.
const canSort = computed(() => props.column.actions?.includes('sort'));
const canFilter = computed(() => props.column.actions?.includes('filter'));

const isSortedAsc = computed(
  () => props.sortField === props.column.baseKey && props.sortDirection === 'asc',
);
const isSortedDesc = computed(
  () => props.sortField === props.column.baseKey && props.sortDirection === 'desc',
);

const canMoveLeft = computed(() => props.index > 0);
const canMoveRight = computed(() => props.index < props.total - 1);
// The mandatory identity column can't be removed (keep ≥1 identity column).
const canRemove = computed(() => !props.column.isColumnMandatory);
</script>

<style scoped>
/* The caret stays subtle until the header is hovered (handled in ResultsTable's
   th hover rule); keep it tight so it doesn't widen the header. */
.column-header-caret {
  margin-left: 2px;
  vertical-align: middle;
}
</style>
