<template>
  <aside class="group-by-sidebar">
    <!-- No title label (r2: the "Stats" header read as clutter) — just the
         right-aligned controls. -->
    <div class="sidebar-head">
      <v-spacer />

      <!-- Add/remove facet widgets — mirrors AddColumn.vue's column menu
           (#601 r2/r3 + #626): stateful SelectionMenu with the selected-first
           browse list capped at 5 ("+n more ✓" overflow), "More facets" → the
           shared Edit dialog in group_by mode, and a saved facet-views footer
           (#602 UX). group_by exists only for works/awards. -->
      <selection-menu
        v-if="canAddWidget"
        v-model:open="isMenuOpen"
        :all-keys="allWidgetKeys"
        :popular-keys="popularWidgetKeys"
        :selected-keys="rawGroupByKeys"
        :get-display-name="getKeyDisplayName"
        :get-icon="getKeyIcon"
        is-stateful
        custom-more
        :max-options="5"
        button-style="icon"
        search-placeholder="Search facets"
        more-label="More facets"
        more-icon="mdi-dots-horizontal-circle-outline"
        location="bottom end"
        @select="toggleWidget"
        @toggle="toggleWidget"
        @more="isMoreOpen = true"
      >
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            icon
            variant="text"
            size="small"
            title="Edit facets"
            aria-label="Edit facets"
          >
            <v-icon color="grey-darken-1">mdi-view-dashboard-outline</v-icon>
          </v-btn>
        </template>

        <!-- Saved facet views (#626) — same footer UX as AddColumn's column
             views (#602): Load hover submenu with per-view delete, then Save. -->
        <template #footer="{ close }">
          <v-list>
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
                <v-list-item v-if="!entityFacetViews.length" disabled>
                  <v-list-item-title class="text-medium-emphasis">
                    No saved views yet
                  </v-list-item-title>
                </v-list-item>
                <v-list-item
                  v-for="view in entityFacetViews"
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

            <v-list-item @click="openSaveDialog(close)">
              <template #prepend>
                <v-icon>mdi-content-save-outline</v-icon>
              </template>
              <v-list-item-title>Save as view</v-list-item-title>
            </v-list-item>
          </v-list>
        </template>
      </selection-menu>

      <!-- Download a CSV summary of every showing widget (the facets export —
           repurposed from the old right toolbar / results kebab). -->
      <v-btn
        v-if="canDownload"
        icon
        variant="text"
        size="small"
        :href="csvUrl"
        title="Export a summary of all facets (CSV)"
        aria-label="Export facets summary"
      >
        <v-icon color="grey-darken-1">mdi-tray-arrow-down</v-icon>
      </v-btn>
    </div>

    <!-- "More" → the shared Edit dialog in group_by mode (#440 r6): same
         search/categories/draggable-chips editor as Edit columns; Apply writes
         the ordered key list to ?group_by=. -->
    <edit-columns-dialog
      v-model="isMoreOpen"
      :entity-type="entityType"
      :selected-keys="rawGroupByKeys"
      :exclude-keys="excludedWidgetKeys"
      mode="group_by"
      title="Edit facets"
      @apply="applyWidgets"
    />

    <column-view-save-dialog
      :is-open="isSaveDialogOpen"
      :entity-type="entityType"
      kind="facets"
      :column-keys="rawGroupByKeys"
      :sort-by="null"
      :get-key-label="getKeyDisplayName"
      @close="isSaveDialogOpen = false"
    />

    <group-by-views
      :results-object="resultsObject"
      :columns="1"
      hide-toolbar
      hide-results-count
      compact
    />
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { url } from '@/url';
import { filtersFromUrlStr } from '@/filterConfigs';
import { facetConfigs } from '@/facetConfigs';
import { getFacetConfig } from '@/facetConfigUtils';
import GroupByViews from '@/components/GroupByViews.vue';
import SelectionMenu from '@/components/Misc/SelectionMenu.vue';
import EditColumnsDialog from '@/components/Results/Table/EditColumnsDialog.vue';
import ColumnViewSaveDialog from '@/components/Results/Table/ColumnViewSaveDialog.vue';

defineOptions({ name: 'GroupBySidebar' });

defineProps({
  resultsObject: Object,
});

const store = useStore();
const route = useRoute();
const entityType = computed(() => store.getters.entityType);
// group_by widgets exist only for works + awards (mirrors GroupByViews' toolbar gate).
const canAddWidget = computed(() => ['works', 'awards'].includes(entityType.value));

// ---- widget picker (quick menu + Edit-facets dialog), #440 r6 / #626 --------
const isMenuOpen = ref(false);
const isMoreOpen = ref(false);
const isSaveDialogOpen = ref(false);
const isAdmin = computed(() => store.getters['user/isAdmin']);

// Same eligibility gates as the old ActionMenu group_by branch: actionable,
// admin-only keys hidden for non-admins, is_xpac only when xpac is enabled.
function widgetEligible(conf) {
  if (!conf.actions?.includes('group_by')) return false;
  if (conf.requiresApiKey && !isAdmin.value) return false;
  if (conf.key === 'is_xpac' && route.query.include_xpac !== 'true') return false;
  return true;
}
const allWidgetKeys = computed(() =>
  facetConfigs(entityType.value).filter(widgetEligible).map((c) => c.key)
);
// Keys that fail the gates — hidden from the Edit-facets dialog's Available side.
const excludedWidgetKeys = computed(() =>
  facetConfigs(entityType.value)
    .filter((c) => c.actions?.includes('group_by') && !widgetEligible(c))
    .map((c) => c.key)
);
// Browse list, selected-first (#601 r2 pattern): currently-showing widgets in
// URL order (each checkmarked), then popular not-yet-selected suggestions.
// SelectionMenu caps the rendered list at 5 and summarizes the rest as "+n
// more ✓".
const popularWidgetKeys = computed(() => {
  const popular = facetConfigs(entityType.value)
    .filter((c) => c.actionsPopular?.includes('group_by'))
    .filter(widgetEligible)
    .map((c) => c.key)
    .filter((key) => !rawGroupByKeys.value.includes(key));
  return [...rawGroupByKeys.value, ...popular];
});
// RAW (URL-ordered) widget keys — the order the rail renders in compact mode and
// the order the dialog's chips edit. (groupByKeys below is the CSV-export list.)
const rawGroupByKeys = computed(() => url.getGroupBy(route));

const getKeyDisplayName = (key) => getFacetConfig(entityType.value, key)?.displayName;
const getKeyIcon = (key) => getFacetConfig(entityType.value, key)?.icon;

function toggleWidget(key) {
  url.toggleGroupBy(key);
}
function applyWidgets(keys) {
  url.setGroupBy(keys);
}

// ---- saved facet views (#626, the #602 column-views UX) ---------------------

const userId = computed(() => store.getters['user/userId']);

const entityFacetViews = computed(() =>
  store.getters['user/userFacetViews'].filter((v) => v.entity_type === entityType.value),
);

// Refresh from the server each time the menu opens (views are cross-device;
// the list is tiny). Fire-and-forget: the submenu shows whatever is loaded.
watch(isMenuOpen, (open) => {
  if (open && userId.value) {
    store.dispatch('user/fetchSerpViews', 'facets').catch((e) => {
      console.warn('GroupBySidebar: failed to fetch facet views', e);
    });
  }
});

// Eligibility is user-dependent (admin/xpac gates), so a saved view can hold
// keys the loading user can't currently see — drop those and say so.
function applyView(view, close) {
  const eligible = view.columns.filter((k) => allWidgetKeys.value.includes(k));
  url.setGroupBy(eligible);
  const dropped = view.columns.length - eligible.length;
  store.commit('snackbar', dropped
    ? `Loaded view "${view.name}" (${dropped} unavailable facet${dropped === 1 ? '' : 's'} skipped)`
    : `Loaded view "${view.name}"`);
  close();
}

function deleteView(view) {
  store.dispatch('user/deleteSerpView', { id: view.id, kind: 'facets' }).catch((e) => {
    console.warn('GroupBySidebar: failed to delete facet view', e);
    store.commit('snackbar', 'Could not delete view');
  });
}

function openSaveDialog(close) {
  isSaveDialogOpen.value = true;
  close();
}

// Widgets currently showing → the facets CSV summary download.
const groupByKeys = computed(() => {
  const keys = url.getGroupBy(route);
  keys.sort((a) => (['apc_sum', 'cited_by_count_sum'].includes(a) ? -1 : 1));
  return keys;
});
const canDownload = computed(() => canAddWidget.value && groupByKeys.value.length > 0);
const csvUrl = computed(() =>
  url.makeGroupByUrl(entityType.value, groupByKeys.value.join(','), {
    filters: filtersFromUrlStr(entityType.value, route.query.filter),
    isMultipleGroups: true,
    formatCsv: true,
  })
);
</script>

<style scoped>
.group-by-sidebar {
  width: 450px;
  flex: 0 0 450px;
  box-sizing: border-box;
  padding: 14px 12px 40px;
}
.sidebar-head {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px 8px;
  min-height: 40px;
}

/* The group-by widgets carry their own min-widths (150–300px) + Vuetify
   container/row gutters tuned for the wide right-column layout; in the narrow
   rail that overflows. Zero the gutters and let each card shrink to the rail. */
.group-by-sidebar :deep(.v-container) {
  padding: 0;
}
.group-by-sidebar :deep(.v-row) {
  margin: 0;
}
.group-by-sidebar :deep(.v-col) {
  padding: 0;
  margin-bottom: 12px;
}
.group-by-sidebar :deep(.group-by) {
  min-width: 0 !important;
}
</style>
