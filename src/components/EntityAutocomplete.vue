<template>
  <v-autocomplete
    v-model="selectedEntity"
    class="query-builder-input"
    ref="autocomplete"
    @update:model-value="onEntitySelected"
    :items="entities"
    :loading="loading"
    :search="search"
    @update:search="onSearchInputUpdate"
    item-title="display_name"
    item-value="id"
    :placeholder="`Search ${entityType}`"
    return-object
    density="compact"
    v-bind="$attrs"
    variant="outlined"
    :color="filterColor"
    hide-no-data
    hide-details
    :custom-filter="() => true"
    autofocus
    @update:menu="onMenuUpdate"
  >
    <template v-slot:item="{ item, props }">
      <v-list-item
        v-bind="props"
        :title="item.raw.display_name"
        :subtitle="(item.raw.hint || showWorkCounts) ? 
          `${item.raw.hint || ''}${item.raw.hint && showWorkCounts ? ', ' : ''}${showWorkCounts ? item.raw.works_count + ' works' : ''}` : undefined"
      ></v-list-item>
    </template>
  </v-autocomplete>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useAttrs, nextTick } from 'vue';
import { debounce } from 'lodash';
import { api } from '@/api';
import { getConfigs } from '@/oaxConfigs';

defineOptions({ name: 'EntityAutocomplete' });

const props = defineProps({
  entityType: { type: String, required: true },
  showWorkCounts: { type: Boolean, default: false },
  filterColor: { type: String, default: 'primary' }
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
.v-input__slot {
  min-height: 35px !important;
}
</style>