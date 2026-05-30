<template>
  <selection-menu
    :all-keys="allKeys"
    :popular-keys="popularKeys"
    :selected-keys="columnKeys"
    :disabled-keys="disabledKeys"
    :get-display-name="getDisplayName"
    :get-icon="getIcon"
    is-stateful
    button-style="icon"
    search-placeholder="Search columns"
    more-dialog-title="All columns"
    location="bottom end"
    @select="onSelect"
    @toggle="onToggle"
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
</template>

<script setup>
import { computed, toRef } from 'vue';
import filters from '@/filters';
import { facetConfigs } from '@/facetConfigs';
import { getFacetConfig } from '@/facetConfigUtils';
import { resolveColumn, parseColumnKey } from '@/components/Results/Table/columnConfig';
import { useColumnsState } from '@/composables/useColumnsState';
import SelectionMenu from '@/components/Misc/SelectionMenu.vue';

defineOptions({ name: 'AddColumn' });

const props = defineProps({
  entityType: { type: String, required: true },
});

const { columnKeys, addColumn, removeColumn } = useColumnsState(toRef(props, 'entityType'));

// Render kinds whose values are entities — these get an auto-derived ":ids"
// sibling picker entry (the bare-ID column alongside the linked-names column).
const ENTITY_KINDS = new Set(['entityLink', 'entityList']);

// Column-eligible AND actually renderable: declares the "column" action and
// either carries a column block or is the mandatory identity column. (Some
// configs flag the "column" action but lack a render block yet — Phase 6 sweep;
// offering them would add a column that silently drops.)
const eligibleConfigs = computed(() =>
  facetConfigs(props.entityType)
    .filter((c) => c.entityToFilter === props.entityType)
    .filter((c) => c.actions?.includes('column'))
    .filter((c) => c.column?.render || c.isColumnMandatory),
);

// Picker entries: one per eligible property, plus a ":ids" sibling for each
// non-mandatory entity-typed column.
const allKeys = computed(() => {
  const names = eligibleConfigs.value.map((c) => c.key);
  const ids = eligibleConfigs.value
    .filter((c) => !c.isColumnMandatory && ENTITY_KINDS.has(c.column?.render?.kind))
    .map((c) => `${c.key}:ids`);
  return [...names, ...ids];
});

const popularKeys = computed(() =>
  eligibleConfigs.value
    .filter((c) => c.actionsPopular?.includes('column'))
    .map((c) => c.key),
);

// The mandatory identity column can't be removed — render it disabled so its
// checkmark can't be toggled off (the table must always keep an identity col).
const disabledKeys = computed(() =>
  eligibleConfigs.value.filter((c) => c.isColumnMandatory).map((c) => c.key),
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
</script>
