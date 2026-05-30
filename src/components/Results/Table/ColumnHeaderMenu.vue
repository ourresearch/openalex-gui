<template>
  <v-menu location="bottom start" :close-on-content-click="true">
    <template #activator="{ props: menuProps }">
      <!-- The WHOLE header is the menu trigger (label + sort indicator + caret),
           not just the caret icon — clicking anywhere on the header opens it. The
           header content is provided via the default slot by ResultsTable. -->
      <div
        v-bind="menuProps"
        class="column-header-trigger"
        role="button"
        tabindex="0"
        :aria-label="`Column options for ${column.label}`"
      >
        <slot />
        <v-icon size="18" color="grey-darken-1" class="column-header-caret">mdi-menu-down</v-icon>
      </div>
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

      <!-- Remove (disabled only on the last remaining column — ≥1-column floor) -->
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
// `actions` (sort/filter) and the column's position (move) / the ≥1-column floor
// (remove). The component is presentation-only: it emits semantic events;
// ResultsTable owns the state mutations (useColumnsState, url sort, pin, filter).
const props = defineProps({
  // Resolved column descriptor (columnConfig.resolveColumn): { key, baseKey,
  // label, isIdentityColumn, actions, facetType, ... }.
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
// Any column (incl. Title) is removable — the only floor is keeping ≥1 column,
// so Remove is disabled solely when this is the last remaining column.
const canRemove = computed(() => props.total > 1);
</script>

<style scoped>
/* The whole header is clickable. Show a pointer + subtle hover background so the
   interactivity is discoverable; the caret hints at the dropdown. */
.column-header-trigger {
  display: flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  border-radius: 4px;
  margin: -2px -4px;
  padding: 2px 4px;
  user-select: none;
}
.column-header-trigger:hover {
  background: rgba(0, 0, 0, 0.04);
}
/* Numeric/boolean header alignment is applied by ResultsTable (it has the
   .numeric-cell / .bool-cell class on the ancestor <th>). */
/* Caret stays subtle until the header is hovered (ResultsTable th:hover rule). */
.column-header-caret {
  flex: 0 0 auto;
}
</style>
