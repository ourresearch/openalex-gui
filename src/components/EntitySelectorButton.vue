<template>
  <div>
    <v-menu v-model="menuOpen" location="bottom start">
      <template v-slot:activator="{ props }">
        <v-chip
          v-bind="props"
          class="entity-chip"
          label
          size="small"
          variant="flat"
          append-icon="mdi-menu-down"
        >{{ currentDisplayName }}</v-chip>
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

// Optional controlled mode (oxjob #428): pass `v-model` to drive the selection
// locally and receive `update:modelValue` instead of the component navigating the
// SERP route / writing Vuex. When modelValue is null (the SERP default) the
// original route/store-driven behavior is unchanged.
const props = defineProps({
  modelValue: { type: String, default: null },
});
const emit = defineEmits(['entitySelected', 'update:modelValue']);

const route = useRoute();
const router = useRouter();
const store = useStore();

const menuOpen = ref(false);
const browserOpen = ref(false);
const pendingBrowserOpen = ref(false);

const controlled = computed(() => props.modelValue !== null);

const entityType = computed(() => {
  if (controlled.value) return props.modelValue;
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
  // Controlled mode: hand the choice to the parent, navigate/commit nothing.
  if (controlled.value) {
    emit('update:modelValue', name);
    emit('entitySelected');
    return;
  }
  // On a results page, switching entity re-runs the search immediately.
  // Off it (e.g. the landing page), just update the selection and let the
  // user finish entering their query — navigation happens on submit.
  if (route.name === 'Serp') {
    router.push({ name: 'Serp', params: { entityType: name } });
  } else {
    store.commit('setEntityType', name);
  }
  emit('entitySelected');
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
/* Rendered as a property-style chip. Inside the OQL builder the colour comes from
   the --prop-bg/--prop-fg vars (matching the field chips); elsewhere (e.g. the SERP
   search box) those vars are unset, so it falls back to a neutral grey chip. */
.entity-chip {
  cursor: pointer;
  text-transform: none;
  background: var(--prop-bg, rgba(0, 0, 0, 0.07)) !important;
  color: var(--prop-fg, rgba(0, 0, 0, 0.87)) !important;
}
</style>
