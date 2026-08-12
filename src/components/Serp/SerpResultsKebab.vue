<template>
  <div class="d-inline-flex align-center">
    <!-- The results-header ⋮ for the flag-on (OqlSerp) layout. After the #440 r5
         shuffle this holds ONLY results-display options — currently just page
         size. Search-level actions (save/alert/copy-API/QR) moved up to the
         page-top SerpHeaderKebab; the works download graduated to a standalone
         icon (SerpDownloadButton); the facets download lives in the stats
         sidebar head; view-as-table/list died (view is coupled to the
         Basic/Advanced mode). Saved column views (#602) moved to the table's
         add-column menu (AddColumn.vue), with the rest of the column controls. -->
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

        <!-- OQL LAUNCH (oxjob #464 Phase 3): per-device opt-out back to the
             legacy interface. If we're on an `?oql=` URL the legacy SERP can't
             run it, so hop to the query's flat OXURL form (or /works). -->
        <v-divider class="my-1" />
        <v-list-item @click="switchToLegacyUi">
          <template #prepend>
            <v-icon>mdi-arrow-u-left-top</v-icon>
          </template>
          <v-list-item-title>Use legacy interface</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import { url } from '@/url';

defineOptions({ name: 'SerpResultsKebab' });

const store = useStore();
const route = useRoute();
const router = useRouter();
const isMenuOpen = ref(false);

// OQL LAUNCH (oxjob #464 Phase 3): opt this device out to the legacy interface.
// The legacy SERP can't execute `?oql=` URLs, so when we're on one, navigate to
// the query's flat OXURL form (server-echoed in meta.x_query.url); a query with
// no flat form falls back to the bare /works SERP.
function switchToLegacyUi() {
  const oxurl = store.state.resultsObject?.meta?.x_query?.url;
  store.commit('setLegacyUi', true);
  if (route.query.oql) {
    router.push(oxurl || '/works');
  }
  store.commit('snackbar', 'Switched to the legacy interface');
}

// OQL mode (#464 Phase 2b; #661): page size is owned by the canonical query
// store's client-side paging slice (POSTed as a sibling param beside the OQO),
// not the legacy serpPageSize store — the inbound executeOql channel ignores URL
// per_page, so the URL path was dead in OQL mode. Drive the store; basic/chip + flag-off keep url.setPerPage. Replace intent.
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
</script>
