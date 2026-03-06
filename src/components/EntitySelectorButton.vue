<template>
  <div>
    <v-menu v-model="menuOpen" location="bottom start">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
          class="control-btn text-none text-capitalize"
          size="small"
        >
          <span class="control-label">{{ currentDisplayName }}</span>
          <v-icon size="12" class="ml-1">mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          v-for="entity in quickEntities"
          :key="entity.name"
          @click="selectEntity(entity.name)"
        >
          <v-list-item-title class="text-capitalize">{{ entity.displayName }}</v-list-item-title>
          <template #append>
            <v-icon v-if="entityType === entity.name">mdi-check</v-icon>
          </template>
        </v-list-item>
        <v-divider class="my-1" />
        <v-list-item @click="openBrowser">
          <v-list-item-title>More entity types...</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <entity-type-browser-dialog
      v-model="browserOpen"
      @select="selectEntity"
    />
  </div>
</template>

<script setup>
defineOptions({ name: 'EntitySelectorButton' });

import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { getEntityConfig } from '@/entityConfigs';
import EntityTypeBrowserDialog from '@/components/EntityTypeBrowserDialog.vue';

const route = useRoute();
const router = useRouter();
const store = useStore();

const menuOpen = ref(false);
const browserOpen = ref(false);
const pendingBrowserOpen = ref(false);

const entityType = computed(() => {
  if (route.name === 'Serp' && route.params.entityType) {
    return route.params.entityType;
  }
  return store.state.entityType;
});

const currentDisplayName = computed(() => {
  const config = getEntityConfig(entityType.value);
  return config ? config.displayName : 'works';
});

const quickEntities = [
  { name: 'works', displayName: 'works' },
  { name: 'authors', displayName: 'authors' },
  { name: 'institutions', displayName: 'institutions' },
  { name: 'sources', displayName: 'sources' },
];

function selectEntity(name) {
  router.push({ name: 'Serp', params: { entityType: name } });
}

// Open browser after menu finishes closing
watch(menuOpen, (open) => {
  if (!open && pendingBrowserOpen.value) {
    pendingBrowserOpen.value = false;
    // Wait for Vuetify menu close animation to complete
    setTimeout(() => {
      browserOpen.value = true;
    }, 300);
  }
});

function openBrowser() {
  pendingBrowserOpen.value = true;
  menuOpen.value = false;
}

</script>

<style lang="scss" scoped>
.control-btn {
  color: #6B7280 !important;

  &:hover {
    color: #374151 !important;
  }
}

.control-label {
  font-size: 13px;
  font-weight: 500;
}
</style>
