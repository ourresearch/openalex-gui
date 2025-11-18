<template>
  <v-navigation-drawer
    v-model="isOpen"
    location="right"
    temporary
    disable-route-watcher
    :width="drawerWidth"
    class="full-height"
  >
    <v-card min-height="100" flat tile :loading="isLoading" >
      <template v-if="entityData">
        <div class="d-flex pa-4">
          <entity-header
            :entity-data="entityData"
            show-permalink-button
            class=" flex-grow-1"
          />
          <v-btn icon variant="plain" @click="isOpen = !isOpen">
            <v-icon>mdi-close</v-icon>
          </v-btn>

        </div>

        <v-divider class="ma-3"/>
        
        <entity-new
          :data="entityData"
        />

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
import { entityTypeFromId } from '@/util';
import EntityNew from '@/components/Entity/EntityNew.vue';
import EntityHeader from '@/components/Entity/EntityHeader.vue';

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
  
  // Determine entity type from ID and construct proper API path
  const entityType = entityTypeFromId(id.value);
  const apiPath = entityType ? `${entityType}/${id.value}` : id.value;
  
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
</style>