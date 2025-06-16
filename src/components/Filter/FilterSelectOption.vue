<template>
  <v-menu
    max-width="800"
    class="rounded-lg"
    location="bottom"
    :close-on-content-click="false"
    v-model="isMenuOpen"
  >
    <template v-slot:activator="{ props }">
      <v-chip
        v-bind="props"
        variant="text"
        class="option mr-1 px-4 py-4 mb-1 mt-1 font-weight-regular hover-color-1 text-body-1"
        closable
        close-icon="mdi-close"
        @click.stop="handleClick"
        @click:close="$emit('delete')"
      >
        <template v-if="filterDisplayValue">
          {{ filters.truncate(filterDisplayValue) }}
        </template>
        <template v-else>
          loading...
        </template>
      </v-chip>
    </template>

    <v-card :loading="isLoading" v-if="myEntityConfig" class="rounded-o">
      <v-card-title>
        {{ filterDisplayValue }}
      </v-card-title>
      <v-card-subtitle class="mb-0 pb-0">
        {{ filterValue }}
      </v-card-subtitle>

      <v-divider class="my-2" />
      
      <entity-new :data="entityData" :type="myEntityConfig.name" />
      
      <v-divider />
      
      <v-card-actions>
        <v-spacer />
        <v-btn
          class="ml-4"
          color="primary"
          rounded
          variant="flat"
          :to="filters.entityZoomLink(filterValue)"
        >
          {{ filters.pluralize(filters.capitalize(myEntityConfig.displayName), 1) }} profile
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

import { api } from '@/api';
import filters from '@/filters';
import { entityTypeFromId } from '@/util';
import { getEntityConfig } from '@/entityConfigs';
import { getFacetConfig } from '@/facetConfigs';

import EntityNew from '@/components/Entity/EntityNew.vue';

defineOptions({name: "FilterSelectOption"});

const props = defineProps({
  disabled: Boolean,
  filterValue: String,
  filterKey: String,
  close: Boolean,
  openMenu: Boolean,
  position: Number
});

// Store
const store = useStore();
const entityType = computed(() => store.getters.entityType);

// State
const isLoading = ref(false);
const isMenuOpen = ref(false);
const entityData = ref(null);
const myEntityConfig = ref(null);

// Configs
const filterConfig = computed(() =>
  getFacetConfig(entityType.value, props.filterKey)
);

const isValueNull = computed(() =>
  props.filterValue.split('/').slice(-1)[0] === 'null'
);

const nullDisplayValue = computed(() =>
  filterConfig.value.displayNullAs ?? 'Unknown'
);

const filterDisplayValue = computed(() =>
  entityData.value?.display_name
);

function handleClick() {
  if (entityData.value?.hideMenu) {
    isMenuOpen.value = false;
  } else {
    // Let v-model handle toggling
  }
}

// Lifecycle
onMounted(async () => {
  isLoading.value = true;

  if (isValueNull.value) {
    entityData.value = {
      display_name: nullDisplayValue.value,
      hideMenu: true
    };
  } else {
    try {
      entityData.value = await api.getEntity(props.filterValue);
      const myEntityType = entityTypeFromId(props.filterValue);
      myEntityConfig.value = getEntityConfig(myEntityType);
    } catch (e) {
      entityData.value = {
        display_name: props.filterValue,
        hideMenu: true
      };
    }
  }

  isLoading.value = false;
});
</script>


<style scoped lang="scss">
.option {
  font-weight: bold;
  cursor: pointer;
}
</style>