<template>
  <selection-menu
    :all-keys="allKeys"
    :popular-keys="popularKeys"
    :selected-keys="columnKeys"
    :get-display-name="getDisplayName"
    :get-icon="getIcon"
    is-stateful
    custom-more
    button-style="icon"
    search-placeholder="Search columns"
    location="bottom end"
    @select="onSelect"
    @toggle="onToggle"
    @more="isMoreOpen = true"
  >
    <template #activator="{ props: menuProps }">
      <slot name="activator" :props="menuProps">
        <v-btn
          v-bind="menuProps"
          icon
          variant="text"
          size="small"
          title="Add column"
          aria-label="Add column"
        >
          <v-icon color="grey-darken-1">mdi-plus</v-icon>
        </v-btn>
      </slot>
    </template>
  </selection-menu>

  <!-- "More" opens the dedicated 3-column "Edit columns" dialog (categories |
       add-only property list | draggable selected-column chips). This is the
       column-mode property editor; the filter picker keeps its own 2-column
       NoviceFilterDialog. Deferred-commit: nothing reaches the table until Apply. -->
  <edit-columns-dialog
    v-model="isMoreOpen"
    :entity-type="entityType"
    :selected-keys="columnKeys"
    @apply="onApplyColumns"
  />
</template>

<script setup>
import { ref, computed, toRef } from 'vue';
import filters from '@/filters';
import { facetConfigs } from '@/facetConfigs';
import { getFacetConfig } from '@/facetConfigUtils';
import { resolveColumn, parseColumnKey } from '@/components/Results/Table/columnConfig';
import { useColumnsState } from '@/composables/useColumnsState';
import SelectionMenu from '@/components/Misc/SelectionMenu.vue';
import EditColumnsDialog from '@/components/Results/Table/EditColumnsDialog.vue';

defineOptions({ name: 'AddColumn' });

const props = defineProps({
  entityType: { type: String, required: true },
});

const isMoreOpen = ref(false);

const { columnKeys, addColumn, removeColumn, setColumns } = useColumnsState(toRef(props, 'entityType'));

// Render kinds whose values are entities — these get an auto-derived ":ids"
// sibling picker entry (the bare-ID column alongside the linked-names column).
const ENTITY_KINDS = new Set(['entityLink', 'entityList']);

// Column-eligible AND actually renderable: declares the "column" action and
// either carries a column block or is the identity column. (Some configs flag
// the "column" action but lack a render block yet — Phase 6 sweep; offering them
// would add a column that silently drops.)
const eligibleConfigs = computed(() =>
  facetConfigs(props.entityType)
    .filter((c) => c.entityToFilter === props.entityType)
    .filter((c) => c.actions?.includes('column'))
    .filter((c) => c.column?.render || c.isIdentityColumn),
);

// Quick-menu entries: one per eligible property, plus a ":ids" sibling for each
// entity-typed column. (The full add-only list + chip rail live in the "More"
// EditColumnsDialog, which computes its own categorized set.)
const allKeys = computed(() => {
  const names = eligibleConfigs.value.map((c) => c.key);
  const ids = eligibleConfigs.value
    .filter((c) => ENTITY_KINDS.has(c.column?.render?.kind))
    .map((c) => `${c.key}:ids`);
  return [...names, ...ids];
});

const popularKeys = computed(() =>
  eligibleConfigs.value
    .filter((c) => c.actionsPopular?.includes('column'))
    .map((c) => c.key),
);

function getDisplayName(key) {
  const col = resolveColumn(props.entityType, key);
  return filters.capitalize(col?.label ?? key);
}

function getIcon(key) {
  const { baseKey } = parseColumnKey(key);
  return getFacetConfig(props.entityType, baseKey)?.icon ?? 'mdi-table-column';
}

function onSelect(key) {
  addColumn(key);
}

function onToggle(key) {
  removeColumn(key);
}

// The "More" dialog is deferred-commit: it edits its own draft and emits the
// final ordered key list on Apply. We commit it in one shot.
function onApplyColumns(keys) {
  setColumns(keys);
}
</script>
