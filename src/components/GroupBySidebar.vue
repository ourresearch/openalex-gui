<template>
  <aside class="group-by-sidebar" :class="{ 'is-two-col': columns === 2 }">
    <div class="sidebar-head">
      <span class="sidebar-title">Stats</span>
      <v-spacer />

      <!-- Add/remove stats widgets — the exact AddColumn.vue pattern (#440 r5/r6):
           a stateful SelectionMenu quick-picker whose "More" opens the SAME
           Edit-columns dialog component in group_by mode ("Edit stats": search |
           categories | property list | draggable ordered chips, deferred-commit).
           group_by exists only for works/awards. -->
      <selection-menu
        v-if="canAddWidget"
        :all-keys="allWidgetKeys"
        :popular-keys="popularWidgetKeys"
        :selected-keys="rawGroupByKeys"
        :get-display-name="getKeyDisplayName"
        :get-icon="getKeyIcon"
        is-stateful
        custom-more
        button-style="icon"
        search-placeholder="Search stats"
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
            title="Add or remove stats"
            aria-label="Add or remove stats"
          >
            <v-icon color="grey-darken-1">mdi-plus</v-icon>
          </v-btn>
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
        title="Download a summary of all widgets (CSV)"
        aria-label="Download widgets summary"
      >
        <v-icon color="grey-darken-1">mdi-tray-arrow-down</v-icon>
      </v-btn>

      <!-- Column-count dropdown (1 or 2 for now; room for 0/3 later — #440 r5). -->
      <v-menu location="bottom end">
        <template #activator="{ props: colProps }">
          <v-btn
            v-bind="colProps"
            icon
            variant="text"
            size="small"
            title="Layout columns"
            aria-label="Layout columns"
          >
            <!-- Static columns icon (the state-dependent agenda icon read as "an
                 outline of an equals sign" — Jason, r6). -->
            <v-icon color="grey-darken-1">mdi-view-column-outline</v-icon>
          </v-btn>
        </template>
        <v-list density="compact" min-width="150">
          <v-list-item v-for="n in [1, 2]" :key="n" @click="setColumns(n)">
            <template #prepend>
              <v-icon
                size="18"
                :style="{ visibility: columns === n ? 'visible' : 'hidden' }"
              >mdi-check</v-icon>
            </template>
            <v-list-item-title>{{ n }} {{ n === 1 ? 'column' : 'columns' }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
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
      title="Edit stats"
      @apply="applyWidgets"
    />

    <group-by-views
      :results-object="resultsObject"
      :columns="columns"
      hide-toolbar
      hide-results-count
      compact
    />
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { url } from '@/url';
import { filtersFromUrlStr } from '@/filterConfigs';
import { facetConfigs } from '@/facetConfigs';
import { getFacetConfig } from '@/facetConfigUtils';
import GroupByViews from '@/components/GroupByViews.vue';
import SelectionMenu from '@/components/Misc/SelectionMenu.vue';
import EditColumnsDialog from '@/components/Results/Table/EditColumnsDialog.vue';

defineOptions({ name: 'GroupBySidebar' });

defineProps({
  resultsObject: Object,
});

const store = useStore();
const route = useRoute();
const entityType = computed(() => store.getters.entityType);
// group_by widgets exist only for works + awards (mirrors GroupByViews' toolbar gate).
const canAddWidget = computed(() => ['works', 'awards'].includes(entityType.value));

// ---- widget picker (quick menu + Edit-stats dialog), #440 r6 ----------------
const isMoreOpen = ref(false);
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
// Keys that fail the gates — hidden from the Edit-stats dialog's Available side.
const excludedWidgetKeys = computed(() =>
  facetConfigs(entityType.value)
    .filter((c) => c.actions?.includes('group_by') && !widgetEligible(c))
    .map((c) => c.key)
);
const popularWidgetKeys = computed(() => {
  const keys = facetConfigs(entityType.value)
    .filter((c) => c.actionsPopular?.includes('group_by'))
    .filter(widgetEligible)
    .map((c) => c.key);
  // Also surface currently-showing widgets so they can be unchecked.
  rawGroupByKeys.value.forEach((k) => {
    if (!keys.includes(k)) keys.push(k);
  });
  return keys;
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

// One (default) or two columns. A per-device view preference persisted in
// localStorage (not a URL param — it's chrome, not query state, so it shouldn't
// ride along in shareable result links). oxjob #440 round 4.
const COLUMNS_KEY = 'statsColumns';
function loadColumns() {
  try {
    return localStorage.getItem(COLUMNS_KEY) === '2' ? 2 : 1;
  } catch (e) {
    return 1;
  }
}
const columns = ref(loadColumns());
function setColumns(n) {
  columns.value = n;
  try {
    localStorage.setItem(COLUMNS_KEY, String(n));
  } catch (e) { /* private mode / quota — ignore */ }
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
/* Two-column mode needs more room than the single-column rail. */
.group-by-sidebar.is-two-col {
  width: 640px;
  flex: 0 0 640px;
}
.sidebar-head {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px 8px;
  min-height: 40px;
}
.sidebar-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(0, 0, 0, 0.6);
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
.group-by-sidebar.is-two-col :deep(.v-col) {
  padding: 0 6px;
}
.group-by-sidebar :deep(.group-by) {
  min-width: 0 !important;
}
</style>
