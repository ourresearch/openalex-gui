<template>
  <Popover v-model:open="isMenuOpen">
    <PopoverTrigger asChild>
      <div class="relative w-full">
        <Input
          v-model="search"
          :placeholder="`Search ${entityType}`"
          class="w-full"
          @input="onSearchInputUpdate($event.target.value)"
          @focus="isMenuOpen = true"
          autofocus
        />
        <div v-if="loading" class="absolute right-2 top-1/2 -translate-y-1/2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      </div>
    </PopoverTrigger>
    <PopoverContent class="w-[var(--radix-popover-trigger-width)] p-0" align="start">
      <ScrollArea class="max-h-[300px]">
        <div v-if="entities.length === 0 && !loading" class="p-2 text-sm text-muted-foreground">
          No results found
        </div>
        <button
          v-for="entity in entities"
          :key="entity.id"
          class="w-full flex flex-col items-start p-2 hover:bg-accent text-left text-sm"
          @click="onEntitySelected(entity)"
        >
          <span>{{ entity.display_name }}</span>
          <span v-if="entity.hint || showWorkCounts" class="text-xs text-muted-foreground">
            {{ entity.hint || '' }}{{ entity.hint && showWorkCounts ? ', ' : '' }}{{ showWorkCounts ? entity.works_count + ' works' : '' }}
          </span>
        </button>
      </ScrollArea>
    </PopoverContent>
  </Popover>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useAttrs, nextTick } from 'vue';
import { debounce } from 'lodash';

import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

import { api } from '@/api';
import { getConfigs } from '@/oaxConfigs';

defineOptions({ name: 'EntityAutocomplete' });

const props = defineProps({
  entityType: { type: String, required: true },
  showWorkCounts: { type: Boolean, default: false },
  filterColor: { type: String, default: 'primary' },
});

const emit = defineEmits(['entity-selected', 'menu-state-change']);

const $attrs         = useAttrs();
const selectedEntity = ref(null);
const entities       = ref([]);
const loading        = ref(false);
const search         = ref(null);
const isMenuOpen     = ref(false);

const localValueOptions = computed(() => { return getConfigs()[props.entityType]?.values; });

const onMenuUpdate = (isOpen) => {
  isMenuOpen.value = isOpen;
  emit('menu-state-change', isOpen);
};

const searchEntities = async (query) => {
  if (!query || query.length === 0) {
    entities.value = localValueOptions.value || [];
    return;
  }

  loading.value = true;
  try {
    const response = await api.getAutocomplete(props.entityType, { q: query });
    entities.value = response && response.length > 0 ? response : localValueOptions.value || [];
  } catch (error) {
    console.error(`Error fetching ${props.entityType}:`, error);
    entities.value = localValueOptions.value || [];
  } finally {
    loading.value = false;
  }
};

const debouncedSearchEntities = debounce(searchEntities, 300);

const onSearchInputUpdate = (val) => {
  search.value = val;
  if (val && val.length > 0) {
    debouncedSearchEntities(val);
  } else {
    entities.value = [];
  }
};

const onEntitySelected = async (entity) => {
  if (!entity) { return; }
  if (entity?.short_id) { entity.id = entity.short_id; }
  emit('entity-selected', entity);
  await nextTick();
  selectedEntity.value = null;
  search.value = ''; 
};

watch(localValueOptions, (newVal) => {
  if (newVal) {
    entities.value = newVal;
  }
}, { immediate: true });
</script>


<style scoped>
/* Styles handled via Tailwind classes */
</style>