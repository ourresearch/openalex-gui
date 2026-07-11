<template>
  <div class="d-inline-flex align-center">
    <!-- The results-header ⋮ for the flag-on (OqlSerp) layout. After the #440 r5
         shuffle this holds ONLY results-display options — page size, and (in
         table mode) saved column views (#602, Gmail canned-responses UX).
         Search-level actions (save/alert/copy-API/QR) moved up to the page-top
         SerpHeaderKebab; the works download graduated to a standalone icon
         (SerpDownloadButton); the facets download lives in the stats sidebar
         head; view-as-table/list died (view is coupled to the Basic/Advanced
         mode). -->
    <v-menu location="bottom end" v-model="isMenuOpen">
      <template #activator="{ props }">
        <v-btn icon variant="text" v-bind="props" aria-label="More options">
          <v-icon color="grey-darken-1">mdi-dots-vertical</v-icon>
          <v-tooltip activator="parent" location="bottom" content-class="linear-tooltip">
            More options
          </v-tooltip>
        </v-btn>
      </template>
      <v-list min-width="280">
        <!-- Page size: hover submenu. -->
        <v-menu submenu open-on-hover location="end" :offset="2">
          <template #activator="{ props: subProps }">
            <v-list-item v-bind="{ ...subProps, onClick: undefined }" @click.stop>
              <template #prepend>
                <v-icon>mdi-counter</v-icon>
              </template>
              <v-list-item-title>Page size</v-list-item-title>
              <template #append>
                <span class="text-medium-emphasis mr-2">{{ url.getPerPage() }}</span>
                <v-icon size="20">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </template>
          <v-list density="compact" min-width="120">
            <v-list-item
              v-for="size in url.pageSizeOptions"
              :key="size"
              @click="setPageSize(size)"
            >
              <template #prepend>
                <v-icon
                  size="18"
                  :style="{ visibility: size === url.getPerPage() ? 'visible' : 'hidden' }"
                >mdi-check</v-icon>
              </template>
              <v-list-item-title>{{ size }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Saved column views (#602) — table mode only. -->
        <template v-if="showColumnViews">
          <v-divider class="my-1" />

          <!-- Load: hover submenu of this entity type's saved views. -->
          <v-menu v-if="userId" submenu open-on-hover location="end" :offset="2">
            <template #activator="{ props: subProps }">
              <v-list-item v-bind="{ ...subProps, onClick: undefined }" @click.stop>
                <template #prepend>
                  <v-icon>mdi-view-column-outline</v-icon>
                </template>
                <v-list-item-title>Load columns view</v-list-item-title>
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
                @click="applyView(view)"
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
          <v-list-item @click="openSaveDialog">
            <template #prepend>
              <v-icon>mdi-content-save-outline</v-icon>
            </template>
            <v-list-item-title>Save columns as view</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>

    <column-view-save-dialog
      :is-open="isSaveDialogOpen"
      :entity-type="entityType"
      :column-keys="columnKeys"
      :sort-by="currentSortBy"
      @close="isSaveDialogOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { url } from '@/url';
import { useColumnsState } from '@/composables/useColumnsState';
import ColumnViewSaveDialog from '@/components/Results/Table/ColumnViewSaveDialog.vue';

defineOptions({ name: 'SerpResultsKebab' });

const props = defineProps({
  // The column-view items only make sense when the results table is showing
  // (Advanced mode); the host passes isTableView down.
  showColumnViews: { type: Boolean, default: false },
});

const store = useStore();
const route = useRoute();
const isMenuOpen = ref(false);
const isSaveDialogOpen = ref(false);

// OQL mode (#464 Phase 2b): page size is owned by the canonical query store's
// viewState (carried inline in the OQO), not the legacy serpPageSize store — the
// inbound executeOql channel ignores URL per_page, so the URL path was dead in OQL
// mode. Drive the store; basic/chip + flag-off keep url.setPerPage. Replace intent.
const inOqlMode = computed(
  () => !!store.getters.featureFlags['oql'] && !!route.query.oql
);
function setPageSize(size) {
  if (inOqlMode.value) {
    store.dispatch('query/setPerPage', { perPage: size });
    return;
  }
  url.setPerPage(size);
}

// ---- saved column views (#602) ---------------------------------------------

const userId = computed(() => store.getters['user/userId']);
const entityType = computed(() => store.getters.entityType);
const { columnKeys, setColumns } = useColumnsState(entityType);

const entityColumnViews = computed(() =>
  store.getters['user/userColumnViews'].filter((v) => v.entity_type === entityType.value),
);

// The active sort, mode-appropriately (store in OQL mode, ?sort= otherwise) —
// captured into the view on save. Same split as ResultsTable's sort fix (#601).
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
  if (open && userId.value && props.showColumnViews) {
    store.dispatch('user/fetchColumnViews').catch((e) => {
      console.warn('SerpResultsKebab: failed to fetch column views', e);
    });
  }
});

function applyView(view) {
  setColumns([...view.columns]);
  const s = view.sort_by?.[0];
  if (inOqlMode.value) {
    // Full restore: a view saved without a sort clears back to the engine default.
    store.dispatch('query/setSort', s ? { field: s.column_id, direction: s.direction } : { field: null });
  } else if (s) {
    url.setSortDirection(s.column_id, s.direction);
  }
  store.commit('snackbar', `Loaded view "${view.name}"`);
}

function deleteView(view) {
  store.dispatch('user/deleteColumnView', view.id).catch((e) => {
    console.warn('SerpResultsKebab: failed to delete column view', e);
    store.commit('snackbar', 'Could not delete view');
  });
}

function openSaveDialog() {
  isSaveDialogOpen.value = true;
}
</script>
