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
        <!-- Corner controls are absolutely positioned so they don't push the
             title and linkouts out of the body's shared left margin. The expand
             button sits at the very left edge (the column under it is empty for
             the rest of the panel — there's no reason to give it more space). -->
        <v-tooltip location="bottom" text="Open as full page">
          <template v-slot:activator="{props: tipProps}">
            <v-btn
              v-bind="tipProps"
              v-if="fullPageRoute"
              class="drawer-expand-btn"
              icon
              variant="plain"
              size="small"
              :to="fullPageRoute"
              aria-label="Open as full page"
              @click="setZoomId(null)"
            >
              <v-icon>mdi-arrow-expand</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-btn
          class="drawer-close-btn"
          icon
          variant="plain"
          size="small"
          @click="isOpen = !isOpen"
          aria-label="Close"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <!-- Single padded body: title, type-label, linkouts, metrics, and
             metadata all share one left margin. pt-12 leaves room for the
             absolutely-positioned corner buttons above. -->
        <div class="drawer-body pt-12 px-8 pb-6">
          <entity-header :entity-data="entityData" />

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
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';

import { api } from '@/api';
import { url } from '@/url';
import * as openalexId from '@/openalexId';
import EntityNew from '@/components/Entity/EntityNew.vue';
import EntityHeader from '@/components/Entity/EntityHeader.vue';
import EntityMetrics from '@/components/Entity/EntityMetrics.vue';

defineOptions({ name: 'EntityDrawer' });

const store = useStore();
const route = useRoute();

const { smAndDown } = useDisplay();

const entityData = ref(null);
const isLoading = ref(false);
const windowWidth = ref(window.innerWidth);

const zoomId = computed(() => store.getters['zoomId']);
const setZoomId = (val) => store.commit('setZoomId', val);

const urlZoomId = computed(() => url.getZoom(route));
const storeZoomId = computed(() => zoomId.value);
const id = computed(() => storeZoomId.value || urlZoomId.value);

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
    if (!to) {
      if (storeZoomId.value) setZoomId(null);
      if (urlZoomId.value) url.setZoom(undefined);
    }
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
/* Make the inner v-card the positioning context for the corner buttons. */
.v-navigation-drawer .drawer-card {
  position: relative;
}
.v-navigation-drawer .drawer-expand-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
}
.v-navigation-drawer .drawer-close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}
/* All content rows share the drawer-body's px-8 (32px) left margin. The
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