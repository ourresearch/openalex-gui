<template>
  <selection-menu
    :all-keys="allKeys"
    :popular-keys="popularKeys"
    :selected-keys="columnKeys"
    :disabled-keys="disabledKeys"
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

  <!-- Full categorized property browser, reused from the filter picker. Same
       widget filters / sorts / groups / columns — reinforcing that properties
       are independent of the action. Checkboxes show which are in the table;
       the dialog persists so the user edits the whole set in one go. -->
  <novice-filter-dialog
    v-model="isMoreOpen"
    action="column"
    title="Columns"
    search-placeholder="Search columns…"
    :include-types="[]"
    :item-keys="propertyKeys"
    :selected-keys="columnKeys"
    :disabled-keys="disabledKeys"
    show-checkboxes
    apply-mode
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
import NoviceFilterDialog from '@/components/NoviceFilterDialog.vue';

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

// Base property keys (no ":ids" siblings) for the categorized "More" dialog —
// that browser is about properties, one row each. The bare-ID variant stays a
// column-specific affordance in the quick menu's search.
const propertyKeys = computed(() => eligibleConfigs.value.map((c) => c.key));

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

// The "More" dialog is deferred-commit: it edits its own draft and emits the
// final ordered key list on Apply. We commit it in one shot.
function onApplyColumns(keys) {
  setColumns(keys);
}
</script>
