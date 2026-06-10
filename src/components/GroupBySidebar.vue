<template>
  <aside class="group-by-sidebar">
    <div class="sidebar-head">
      <span class="sidebar-title">Stats</span>
      <v-spacer />
      <!-- Relocated group_by "widgets" picker (from SerpRightToolbar). group_by is
           only supported for works/awards, same gate as the old toolbar. -->
      <action-menu v-if="canAddWidget" action="group_by">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            size="small"
            variant="tonal"
            prepend-icon="mdi-plus"
            class="add-widget-btn"
          >Add widget</v-btn>
        </template>
      </action-menu>
    </div>

    <group-by-views
      :results-object="resultsObject"
      single-column
      hide-toolbar
      hide-results-count
    />
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import GroupByViews from '@/components/GroupByViews.vue';
import ActionMenu from '@/components/Action/ActionMenu.vue';

defineOptions({ name: 'GroupBySidebar' });

defineProps({
  resultsObject: Object,
});

const store = useStore();
const entityType = computed(() => store.getters.entityType);
// group_by widgets exist only for works + awards (mirrors GroupByViews' toolbar gate).
const canAddWidget = computed(() => ['works', 'awards'].includes(entityType.value));
</script>

<style scoped>
.group-by-sidebar {
  width: 300px;
  flex: 0 0 300px;
  box-sizing: border-box;
  padding: 14px 12px 40px;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}
.sidebar-head {
  display: flex;
  align-items: center;
  gap: 8px;
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
.add-widget-btn {
  text-transform: none;
  letter-spacing: 0;
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
