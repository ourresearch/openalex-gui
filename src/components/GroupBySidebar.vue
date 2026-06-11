<template>
  <aside class="group-by-sidebar" :class="{ 'is-two-col': columns === 2 }">
    <div class="sidebar-head">
      <span class="sidebar-title">Stats</span>
      <v-spacer />

      <!-- Settings: add AND remove widgets. Reuses the stateful group_by
           SelectionMenu (same machinery as the table-mode add/remove columns
           picker, AddColumn.vue). group_by exists only for works/awards. -->
      <action-menu v-if="canAddWidget" action="group_by">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            icon
            variant="text"
            size="small"
            title="Add or remove widgets"
            aria-label="Widget settings"
          >
            <v-icon color="grey-darken-1">mdi-cog-outline</v-icon>
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

      <!-- One/two column toggle. Standalone for now (may fold into a kebab later). -->
      <v-btn
        icon
        variant="text"
        size="small"
        :title="columns === 2 ? 'Show in one column' : 'Show in two columns'"
        :aria-label="columns === 2 ? 'Show in one column' : 'Show in two columns'"
        @click="toggleColumns"
      >
        <v-icon color="grey-darken-1">
          {{ columns === 2 ? 'mdi-view-agenda-outline' : 'mdi-view-column-outline' }}
        </v-icon>
      </v-btn>
    </div>

    <group-by-views
      :results-object="resultsObject"
      :columns="columns"
      hide-toolbar
      hide-results-count
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

// One (default) or two columns. Local UI state — not persisted/shareable for now.
const columns = ref(1);
function toggleColumns() {
  columns.value = columns.value === 2 ? 1 : 2;
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
