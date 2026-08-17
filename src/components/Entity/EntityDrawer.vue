<template>
  <v-navigation-drawer
    v-model="isOpen"
    location="right"
    temporary
    disable-route-watcher
    :width="drawerWidth"
    class="full-height"
  >
    <v-card min-height="100" flat tile :loading="isLoading" class="drawer-card">
      <template v-if="entityData">
        <!-- Notion-style layout: the control bar (rendered first, inside
             EntityHeader) breaks out via negative margins to hug the drawer's
             top corners like a real toolbar, while the work content — title,
             linkouts, metrics, metadata — sits in from a generous left margin.
             Padding lives in CSS (.drawer-body / .drawer-controlbar) rather than
             utility classes so the breakout math stays in one place. #641 -->
        <div class="drawer-body">
          <entity-header
            :entity-data="entityData"
            :show-back-button="false"
            layout="drawer"
            @close="isOpen = false"
          >
            <!-- Left side of the control bar: close (double-chevron, replaces
                 the old top-right X) + expand (→ full entity page). -->
            <template #leading-controls>
              <v-btn
                icon
                variant="plain"
                size="small"
                aria-label="Close"
                @click="isOpen = false"
              >
                <v-icon>mdi-chevron-double-right</v-icon>
                <!-- The drawer forces z-index 10000 (below), so overlays must be
                     lifted above it or they paint behind the panel — same class of
                     bug as the kebab menu (menuZIndex). -->
                <v-tooltip activator="parent" location="bottom" :z-index="10001">Close</v-tooltip>
              </v-btn>
              <v-btn
                v-if="fullPageRoute"
                icon
                variant="plain"
                size="small"
                :to="fullPageRoute"
                aria-label="Open as full page"
                @click="setZoomId(null)"
              >
                <v-icon>mdi-arrow-expand</v-icon>
                <v-tooltip activator="parent" location="bottom" :z-index="10001">Open as full page</v-tooltip>
              </v-btn>
            </template>
          </entity-header>

          <v-divider class="my-3"/>

          <!-- Stats block (FWCI, cites, cited-by, …) is rendered inside
               EntityNew at the first null-divider position so it sits between
               the metadata chunk (year..language) and the aboutness chunk
               (topic..). EntityNew handles the divider above; the metrics
               block's own border-bottom provides the separator below. -->
          <entity-new
            :data="entityData"
            :type="entityType"
          >
            <template #after-first-divider>
              <entity-metrics
                v-if="entityType"
                :data="entityData"
                :type="entityType"
                class="drawer-metrics-block mb-3 pb-3"
              />
            </template>
          </entity-new>
        </div>

      </template>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';

import { api } from '@/api';
import * as openalexId from '@/openalexId';
import EntityNew from '@/components/Entity/EntityNew.vue';
import EntityHeader from '@/components/Entity/EntityHeader.vue';
import EntityMetrics from '@/components/Entity/EntityMetrics.vue';

defineOptions({ name: 'EntityDrawer' });

const store = useStore();
const route = useRoute();
const router = useRouter();

const { smAndDown } = useDisplay();

const entityData = ref(null);
const isLoading = ref(false);
const windowWidth = ref(window.innerWidth);

const zoomId = computed(() => store.getters['zoomId']);
const setZoomId = (val) => store.commit('setZoomId', val);

// The drawer is driven entirely by internal store state — `?zoom=` is no longer
// written to the URL (filters.zoomDrawerClick commits setZoomId instead). The id
// is the store's zoomId.
const id = computed(() => zoomId.value);

// Back-compat: someone may have bookmarked/shared an old `?zoom=W123` URL (a
// single id, or a legacy comma-list). Seed the store from the first id, then
// strip the param so it leaves the URL without adding a history entry.
const seedFromLegacyZoomParam = () => {
  const legacy = route.query.zoom;
  if (!legacy) return;
  const firstId = String(legacy).split(',')[0];
  if (firstId) setZoomId(firstId);
  const query = { ...route.query };
  delete query.zoom;
  router.replace({ query });
};

// Derive entity type from the loaded data's id (e.g. "W…" → "works"). Used by
// EntityMetrics/EntityNew to pick the right config; falsy until data arrives.
const entityType = computed(() => entityData.value?.id ? openalexId.getEntityType(entityData.value.id) : null);

// Canonical entity-page route for the "Open as full page" affordance — bypasses
// the works-SERP zoom shortcut in filters.entityZoomLink so we always land on
// the dedicated /<entityType>/<shortId> page, not back in a ?zoom= half-state.
const fullPageRoute = computed(() => {
  const parsed = entityData.value?.id ? openalexId.parseId(entityData.value.id) : null;
  if (!parsed) return null;
  return {
    name: 'EntityPage',
    params: { entityType: parsed.entityType, entityId: parsed.shortId },
  };
});

const drawerWidth = computed(() => {
  const isMobile = smAndDown.value;
  return isMobile
    ? Math.round(windowWidth.value * 0.9)
    : Math.round(windowWidth.value * 0.5);
});

const isOpen = computed({
  get: () => !!id.value,
  set: (to) => {
    if (!to) setZoomId(null);
  }
});

const getEntityData = async () => {
  if (!id.value) {
    entityData.value = null;
    return;
  }
  isLoading.value = true;

  // Normalize the ID to get the proper API path (e.g., "w123" -> "works/w123", "countries/jp" stays as-is)
  const normalized = openalexId.normalizeId(id.value);
  const apiPath = normalized || id.value;

  entityData.value = await api.get(apiPath);
  isLoading.value = false;
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

watch(id, getEntityData, { immediate: true });

// Convert any inbound legacy `?zoom=` (initial load or an SPA nav to a bookmarked
// link) into store state + strip it from the URL.
watch(() => route.query.zoom, seedFromLegacyZoomParam, { immediate: true });

// The drawer no longer rides on the URL, so a real navigation (Back button,
// clicking through to a different page/entity) would otherwise leave it open
// over the new page. Close it on any genuine route transition — keyed off
// name+params so query-only changes (paging, search, or our own `?zoom=` strip
// above) DON'T close it. Non-immediate so it never clears the initial seed.
watch(
  () => `${String(route.name)}|${JSON.stringify(route.params)}`,
  () => { if (zoomId.value) setZoomId(null); },
);

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>


<style>
/* Using non-scoped styles to properly override Vuetify's drawer styles */
.v-navigation-drawer.full-height {
  height: 100vh !important;
  max-height: 100vh !important;
  top: 0 !important;
  z-index: 10000 !important;
}
/* Notion-style padding. No top padding — the control bar hugs the top edge.
   A generous 48px left margin (vs 24px right) gives the work content room to
   breathe and sets it clearly apart from the drawer chrome above. */
.v-navigation-drawer .drawer-body {
  padding: 0 24px 24px 48px;
}
/* The control bar breaks out of the body's padding to reach the drawer's top
   corners (negative margins cancel the body's L/R padding), then its own tight
   padding tucks the icons into those corners like a real toolbar. The 20px
   bottom margin is the whitespace that separates chrome from work info. */
.v-navigation-drawer .drawer-controlbar {
  margin: 0 -24px 20px -48px;
  padding: 6px 12px;
}

/* All content rows share the drawer-body's 48px left margin. The
   utility-class horizontal padding/margin that EntityNew + EntityMetrics
   bake into rows and dividers is neutralized inside the drawer so the
   wrapper governs alignment; the body remains shared-and-flush from
   title down through the last metadata row. */
.v-navigation-drawer .drawer-body .px-4 {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.v-navigation-drawer .drawer-body .ma-3 {
  margin-left: 0 !important;
  margin-right: 0 !important;
}
/* Mirror .entity-metrics-block on the full entity page, scoped to the drawer. */
.v-navigation-drawer .drawer-metrics-block {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>