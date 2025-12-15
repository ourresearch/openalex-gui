<template>
  <Sheet :open="isOpen" @update:open="isOpen = $event">
    <SheetContent 
      side="right" 
      :class="smAndDown ? 'w-[90vw]' : 'w-[50vw]'"
      class="overflow-y-auto"
    >
      <div v-if="isLoading" class="flex items-center justify-center h-24">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      <template v-if="entityData">
        <div class="flex p-4">
          <entity-header
            :entity-data="entityData"
            show-permalink-button
            class="flex-1"
          />
          <Button variant="ghost" size="icon" @click="isOpen = false">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <Separator class="mx-3" />
        
        <entity-new
          :data="entityData"
        />
      </template>
    </SheetContent>
  </Sheet>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useBreakpoints } from '@/composables/useBreakpoints';

import { X } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

import { api } from '@/api';
import { url } from '@/url';
import { entityTypeFromId } from '@/util';
import EntityNew from '@/components/Entity/EntityNew.vue';
import EntityHeader from '@/components/Entity/EntityHeader.vue';

defineOptions({ name: 'EntityDrawer' });

const store = useStore();
const route = useRoute();

const { smAndDown } = useBreakpoints();

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


<style scoped>
/* Minimal scoped styles */
</style>