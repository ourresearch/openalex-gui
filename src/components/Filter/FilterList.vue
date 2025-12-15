<template>
  <div>
    <Card class="mb-3 bg-white overflow-visible">
      <div class="px-2" v-if="!isCollapsed">
        <div v-if="filters.length === 0" class="mx-5 my-2 pt-2 text-muted-foreground">
          No filters applied
        </div>

        <table v-if="mdAndUp" class="w-full border-t border-border">
          <tbody>
            <component
              v-for="(filter, i) in filters"
              :key="i"
              :is="getFilterComponent(filter.type)"
              :filter-key="filter.key"
              :index="i"
              @delete="url.deleteFilter(entityType, filter.key)"
              class="w-full"
            />
          </tbody>
        </table>

        <div v-else>
          <component
            v-for="(filter, i) in filters"
            :key="i"
            :is="getFilterComponent(filter.type)"
            :filter-key="filter.key"
            :index="i"
            @delete="url.deleteFilter(entityType, filter.key)"
            class="w-full"
          />
        </div>

        <div class="flex items-center h-10 relative top-1">
          <add-filter class="ml-0" />
          <Button
            v-if="filters.length"
            variant="outline"
            size="icon"
            class="ml-3 h-10 w-10"
            @click="clearEverything"
          >
            <Trash2 class="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useBreakpoints } from '@/composables/useBreakpoints'

import { Trash2 } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { url } from '@/url'

import FilterBoolean from '@/components/Filter/FilterBoolean.vue'
import FilterRange from '@/components/Filter/FilterRange.vue'
import FilterSearch from '@/components/Filter/FilterSearch.vue'
import FilterSelect from '@/components/Filter/FilterSelect.vue'
import AddFilter from '@/components/Filter/AddFilter.vue'


const isCollapsed = ref(false);
const dialogs = ref({ moreFilters: false });
const activeFilterKey = ref(null);
const searchString = ref('');

const store = useStore();
const route = useRoute();
const { mdAndUp } = useBreakpoints();

const filters = computed(() => url.readFilters(route));
const entityType = computed(() => store.getters.entityType);

const filterComponentMap = {
  boolean: FilterBoolean,
  range: FilterRange,
  search: FilterSearch,
  select: FilterSelect,
};
const getFilterComponent = (type) => filterComponentMap[type] || null;

function clearEverything() {
  url.pushNewFilters([]);
}

watch(() => dialogs.value.moreFilters, (to) => {
  if (to) searchString.value = '';
})

watch(route, () => {
  activeFilterKey.value = null;
  searchString.value = '';
}, { immediate: true });
</script>


<style scoped>
table {
  border-collapse: collapse;
}
</style>