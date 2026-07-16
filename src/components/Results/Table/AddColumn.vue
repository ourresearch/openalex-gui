<template>
  <selection-menu
    v-model:open="isMenuOpen"
    :all-keys="allKeys"
    :popular-keys="popularKeys"
    :selected-keys="columnKeys"
    :get-display-name="getDisplayName"
    :get-icon="getIcon"
    is-stateful
    custom-more
    :max-options="5"
    button-style="icon"
    search-placeholder="Search columns"
    more-label="More columns"
    more-icon="mdi-dots-horizontal-circle-outline"
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

    <!-- Saved column views (#602) — moved here from the results kebab so they
         live with the rest of the column controls. Footer = divider + section
         after the "More columns" row. -->
    <template #footer="{ close }">
      <v-list>
        <!-- Load: hover submenu of this entity type's saved views. -->
        <v-menu v-if="userId" submenu open-on-hover location="end" :offset="2">
          <template #activator="{ props: subProps }">
            <v-list-item v-bind="{ ...subProps, onClick: undefined }" @click.stop>
              <template #prepend>
                <v-icon>mdi-folder-open-outline</v-icon>
              </template>
              <v-list-item-title>Load view</v-list-item-title>
              <template #append>
                <v-icon size="20">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </template>
          <v-list density="compact" min-width="200">
            <v-list-item v-if="!entityColumnViews.length" disabled>
              <v-list-item-title class="text-medium-emphasis">
                No saved views yet
              </v-list-item-title>
            </v-list-item>
            <v-list-item
              v-for="view in entityColumnViews"
              :key="view.id"
              @click="applyView(view, close)"
            >
              <v-list-item-title>{{ view.name }}</v-list-item-title>
              <template #append>
                <v-btn
                  icon
                  variant="text"
                  size="x-small"
                  :aria-label="`Delete view ${view.name}`"
                  @click.stop="deleteView(view)"
                >
                  <v-icon size="16">mdi-delete-outline</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Save: opens the naming dialog (login-gated inside the dialog). -->
        <v-list-item @click="openSaveDialog(close)">
          <template #prepend>
            <v-icon>mdi-content-save-outline</v-icon>
          </template>
          <v-list-item-title>Save as view</v-list-item-title>
        </v-list-item>
      </v-list>
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

  <column-view-save-dialog
    :is-open="isSaveDialogOpen"
    :entity-type="entityType"
    :column-keys="columnKeys"
    :sort-by="currentSortBy"
    @close="isSaveDialogOpen = false"
  />
</template>

<script setup>
import { ref, computed, toRef, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import filters from '@/filters';
import { url } from '@/url';
import { facetConfigs } from '@/facetConfigs';
import { getFacetConfig } from '@/facetConfigUtils';
import { resolveColumn, parseColumnKey, isColumnEligible, hasIdsSibling } from '@/components/Results/Table/columnConfig';
import { useColumnsState } from '@/composables/useColumnsState';
import SelectionMenu from '@/components/Misc/SelectionMenu.vue';
import EditColumnsDialog from '@/components/Results/Table/EditColumnsDialog.vue';
import ColumnViewSaveDialog from '@/components/Results/Table/ColumnViewSaveDialog.vue';

defineOptions({ name: 'AddColumn' });

const props = defineProps({
  entityType: { type: String, required: true },
});

const store = useStore();
const route = useRoute();

const isMenuOpen = ref(false);
const isMoreOpen = ref(false);
const isSaveDialogOpen = ref(false);

const { columnKeys, addColumn, removeColumn, setColumns } = useColumnsState(toRef(props, 'entityType'));

// Column-eligible properties — render kind + extractFn derived from the
// property's `type` (Phase 6), so every non-search property is a column with no
// per-entry editing. `isColumnEligible` centralizes the gate (columnConfig.js).
const eligibleConfigs = computed(() =>
  facetConfigs(props.entityType)
    .filter((c) => c.entityToFilter === props.entityType)
    .filter(isColumnEligible),
);

// Quick-menu entries: one per eligible property, plus a ":ids" sibling for each
// entity-typed column whose items carry a parseable OpenAlex id (hasIdsSibling).
// (The full add-only list + chip rail live in the "More columns" EditColumnsDialog,
// which computes its own categorized set.)
const allKeys = computed(() => {
  const names = eligibleConfigs.value.map((c) => c.key);
  const ids = eligibleConfigs.value.filter(hasIdsSibling).map((c) => `${c.key}:ids`);
  return [...names, ...ids];
});

// Browse list, selected-first (#601 r2): the columns currently showing (in
// table order, each checkmarked) followed by popular not-yet-selected
// suggestions. SelectionMenu caps the rendered list at 5 (`max-options`) and
// summarizes any selected columns beyond the cap as a "+n more ✓" row.
const popularKeys = computed(() => {
  const popular = eligibleConfigs.value
    .filter((c) => c.actionsPopular?.includes('column'))
    .map((c) => c.key)
    .filter((key) => !columnKeys.value.includes(key));
  return [...columnKeys.value, ...popular];
});

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

// ---- saved column views (#602) ---------------------------------------------

const userId = computed(() => store.getters['user/userId']);

const entityColumnViews = computed(() =>
  store.getters['user/userColumnViews'].filter((v) => v.entity_type === props.entityType),
);

// OQL mode: sort lives in the canonical query store, not ?sort= (#601's split).
const inOqlMode = computed(
  () => !!store.getters.featureFlags['oql'] && !!route.query.oql
);

// The active sort, mode-appropriately (store in OQL mode, ?sort= otherwise) —
// captured into the view on save.
const currentSortBy = computed(() => {
  if (inOqlMode.value) {
    const sortBy = store.state.query?.queryOqo?.sort_by || [];
    return sortBy.length ? sortBy : null;
  }
  const field = url.getSortField(route);
  return field ? [{ column_id: field, direction: url.getSortDirection(route) }] : null;
});

// Refresh from the server each time the menu opens (views are cross-device;
// the list is tiny). Fire-and-forget: the submenu shows whatever is loaded.
watch(isMenuOpen, (open) => {
  if (open && userId.value) {
    store.dispatch('user/fetchColumnViews').catch((e) => {
      console.warn('AddColumn: failed to fetch column views', e);
    });
  }
});

function applyView(view, close) {
  setColumns([...view.columns]);
  const s = view.sort_by?.[0];
  if (inOqlMode.value) {
    // Full restore: a view saved without a sort clears back to the engine default.
    store.dispatch('query/setSort', s ? { field: s.column_id, direction: s.direction } : { field: null });
  } else if (s) {
    url.setSortDirection(s.column_id, s.direction);
  }
  store.commit('snackbar', `Loaded view "${view.name}"`);
  close();
}

function deleteView(view) {
  store.dispatch('user/deleteColumnView', view.id).catch((e) => {
    console.warn('AddColumn: failed to delete column view', e);
    store.commit('snackbar', 'Could not delete view');
  });
}

function openSaveDialog(close) {
  isSaveDialogOpen.value = true;
  close();
}
</script>
