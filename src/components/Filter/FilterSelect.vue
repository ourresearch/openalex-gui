<template>
  <filter-base :filter-key="filterKey" :index="index" @add-option="isActive = true">
    <div class="flex flex-wrap items-center">
      <template v-for="(id, i) in optionIds" :key="id">
        <filter-select-option
          :filter-value="id"
          :filter-key="filterKey"
          :position="i"
          @delete="deleteOption(id)"
        />
        <span
          v-if="i < optionIds.length-1"
          class="mx-1 mr-2 text-muted-foreground"
        >
          or
        </span>
      </template>
    </div>

    <Dialog :open="isActive" @update:open="isActive = $event">
      <DialogContent :class="smAndDown ? 'h-screen max-w-full' : 'sm:max-w-[600px]'">
        <div class="flex items-center border-b pb-3">
          <Search class="h-5 w-5 mr-3 text-muted-foreground" />
          <Input
            v-model="searchString"
            autofocus
            :placeholder="searchStringPlaceholder"
            class="flex-1 border-0 text-lg focus-visible:ring-0"
          />
          <Button variant="ghost" size="icon" @click="clickCloseSearch">
            <X class="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea class="h-[60vh]">
          <filter-select-add-option
              :filter-key="filterKey"
              :filter-index="index"
              :is-open="isActive"
              :search-string="searchString"

              @close="close"
              @add="addOption"
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  </filter-base>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useBreakpoints } from '@/composables/useBreakpoints';

import { Search, X } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { url } from '@/url';
import filters from '@/filters';
import { getFacetConfig } from '@/facetConfigs';
import { makeSelectFilterValue } from '@/filterConfigs';

import FilterSelectOption from '@/components/Filter/FilterSelectOption.vue';
import FilterSelectAddOption from '@/components/Filter/FilterSelectAddOption.vue';
import FilterBase from '@/components/Filter/FilterBase.vue';

defineOptions({name: "FilterSelect"})

const {filterKey, index} = defineProps({
  filterKey: String,
  index: Number,
});
const emit = defineEmits(['upsert', 'close']);

// Route and store
const route = useRoute();
const store = useStore();

const { smAndDown } = useDisplay();

const entityType = computed(() => store.getters.entityType);

// Local state
const isActive = ref(false);
const searchString = ref('');

// Config for the facet
const config = computed(() => getFacetConfig(entityType.value, filterKey));

// Dynamic placeholder
const searchStringPlaceholder = computed(() =>
  'Search ' + filters.pluralize(config.value.displayName, 2)
);

// Selected option IDs with getter/setter
const optionIds = computed({
  get() {
    return url.readFilterOptions(route, entityType.value, index);
  },
  set(to) {
    console.log('set appliedOptionIds', to);
    const newValue = makeSelectFilterValue(to, 'any');
    emit('upsert', newValue);
  }
});

// Methods
function clickCloseSearch() {
  searchString.value ? searchString.value = '' : close();
}

function close() {
  console.log('FilterSelect close()');
  store.state.activeFilterKey = null;
  isActive.value = false;
  emit('close'); // still needed
}

function deleteOption(id) {
  url.deleteFilterOption(entityType.value, index, id);
}

function addOption(id) {
  console.log('FilterSelect addOption()', id, optionIds.value);
  close();
  optionIds.value.length
    ? url.addFilterOption(entityType.value, index, id)
    : url.createFilter(entityType.value, filterKey, id);
}

// Watchers
watch(isActive, () => {
  searchString.value = '';
});
</script>


<style scoped>
/* Minimal scoped styles */
</style>