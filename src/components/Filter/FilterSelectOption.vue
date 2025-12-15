<template>
  <Popover v-model:open="isMenuOpen">
    <PopoverTrigger>
      <Badge
        variant="secondary"
        class="mr-1 px-3 py-1.5 my-0.5 font-normal cursor-pointer hover:bg-accent group"
        @click.stop="handleClick"
      >
        <template v-if="filterDisplayValue">
          {{ filters.truncate(filterDisplayValue) }}
        </template>
        <template v-else>
          loading...
        </template>
        <button
          class="ml-1.5 hover:text-destructive"
          @click.stop="$emit('delete')"
        >
          <X class="h-3 w-3" />
        </button>
      </Badge>
    </PopoverTrigger>

    <PopoverContent class="w-80 p-0" v-if="myEntityConfig">
      <div v-if="isLoading" class="flex items-center justify-center p-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
      <template v-else>
        <div class="p-4">
          <h4 class="font-semibold">{{ filterDisplayValue }}</h4>
          <p class="text-xs text-muted-foreground">{{ filterValue }}</p>
        </div>

        <Separator />
        
        <entity-new :data="entityData" :type="myEntityConfig.name" />
        
        <Separator />
        
        <div class="p-3 flex justify-end">
          <Button
            as="router-link"
            :to="filters.entityZoomLink(filterValue)"
          >
            {{ filters.pluralize(filters.capitalize(myEntityConfig.displayName), 1) }} profile
          </Button>
        </div>
      </template>
    </PopoverContent>
  </Popover>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

import { X } from 'lucide-vue-next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

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


<style scoped>
/* Minimal scoped styles */
</style>