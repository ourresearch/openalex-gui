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
        variant="outlined"
        label
        class="option mr-1 px-4 py-4 mb-1 mt-1 font-weight-regular hover-color-1 text-body-1 light-border"
        @click.stop="handleClick"
      >
        <template v-if="filterDisplayValue">
          {{ filters.truncate(filterDisplayValue) }}
        </template>
        <template v-else>
          loading...
        </template>
      </v-chip>
    </template>

    <v-card :loading="isLoading" v-if="myEntityConfig" class="rounded-sm elevation-2">
      <v-card-title>
        {{ filterDisplayValue }}
      </v-card-title>
      <v-card-subtitle class="mb-0 pb-0">
        {{ filterValue }}
      </v-card-subtitle>

      <v-divider class="my-2" />
      
      <v-card-text class="py-2">
        <div v-if="entityData?.works_count !== undefined" class="mb-1">
          <strong>Works count:</strong> {{ filters.toPrecision(entityData.works_count) }}
        </div>
        <div v-if="entityData?.cited_by_count !== undefined">
          <strong>Citations count:</strong> {{ filters.toPrecision(entityData.cited_by_count) }}
        </div>
      </v-card-text>
      
      <v-divider />
      
      <v-card-actions class="justify-end">
        <v-btn
          variant="plain"
          class="text-black"
          :to="filters.entityZoomLink(filterValue)"
        >
          Profile
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="handleRemove"
        >
          Remove
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
import { getFacetConfig } from '@/facetConfigUtils';

defineOptions({name: "FilterSelectOption"});

const emit = defineEmits(['delete']);

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

// Display value - use award-specific fallback for awards
const filterDisplayValue = computed(() => {
  if (!entityData.value) return null; // Still loading
  if (entityData.value.display_name) return entityData.value.display_name;
  // For awards, use funder_award_id fallback
  const valueEntityType = entityTypeFromId(props.filterValue);
  if (valueEntityType === 'awards') {
    return filters.getAwardDisplayTitle(entityData.value);
  }
  return 'Untitled';
});

function handleClick() {
  if (entityData.value?.hideMenu) {
    isMenuOpen.value = false;
  } else {
    // Let v-model handle toggling
  }
}

function handleRemove() {
  isMenuOpen.value = false;
  emit('delete');
}

// Lifecycle
onMounted(async () => {
  isLoading.value = true;

  if (isValueNull.value) {
    entityData.value = {
      display_name: nullDisplayValue.value,
      hideMenu: true
    };
  } else if (filterConfig.value.isStringOnly) {
    entityData.value = {
      display_name: props.filterValue,
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
.light-border {
  border-color: #ddd !important;
}
.text-black {
  color: #000 !important;
  opacity: 1 !important;
}
</style>