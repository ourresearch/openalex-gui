<template>
  <aside class="group-by-sidebar" :class="{ 'is-two-col': columns === 2 }">
    <div class="sidebar-head">
      <span class="sidebar-title">Stats</span>
      <v-spacer />

      <!-- Add/remove widgets. Reuses the stateful group_by SelectionMenu — the
           exact same machinery (and now the same mdi-plus activator) as the
           table-mode add/remove columns picker, AddColumn.vue (#440 round 5).
           group_by exists only for works/awards. -->
      <action-menu v-if="canAddWidget" action="group_by">
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
      </action-menu>

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
            <v-icon color="grey-darken-1">
              {{ columns === 2 ? 'mdi-view-column-outline' : 'mdi-view-agenda-outline' }}
            </v-icon>
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
import GroupByViews from '@/components/GroupByViews.vue';
import ActionMenu from '@/components/Action/ActionMenu.vue';

defineOptions({ name: 'GroupBySidebar' });

defineProps({
  resultsObject: Object,
});

const store = useStore();
const route = useRoute();
const entityType = computed(() => store.getters.entityType);
// group_by widgets exist only for works + awards (mirrors GroupByViews' toolbar gate).
const canAddWidget = computed(() => ['works', 'awards'].includes(entityType.value));

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
