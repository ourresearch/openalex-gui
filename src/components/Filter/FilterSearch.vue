<template>
  <filter-base :filter-key="filterKey" :index="index">
      <Badge
          variant="secondary"
          class="mr-1 px-3 py-1.5 my-0.5 font-normal cursor-pointer hover:bg-accent"
          @click="isActive = true"
          v-if="!isActive"
      >
        "{{ value }}"
        <Pencil class="h-3 w-3 ml-1" />
      </Badge>
      <template v-if="isActive">
        <div class="flex items-center gap-2">
          <Input
            v-model="searchString"
            autofocus
            placeholder="Enter search terms"
            class="w-48"
            @keydown.enter="onSubmit"
            @blur="onCancel"
            @keydown.esc="onCancel"
          />
          <Button 
            v-if="searchString && searchString !== value" 
            variant="ghost" 
            size="icon"
            @click="onSubmit"
          >
            <Check class="h-4 w-4" />
          </Button>
        </div>
      </template>
  </filter-base>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { Pencil, Check } from 'lucide-vue-next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { url } from '@/url';
import FilterBase from '@/components/Filter/FilterBase.vue';

defineOptions({name: "FilterSearch"});

const {filterKey, index} = defineProps({
  filterKey: String,
  index: Number
});

const route = useRoute();
const store = useStore();
const entityType = computed(() => store.getters.entityType);

// Local state
const isActive = ref(false);
const searchString = ref('');

// Value with getter/setter
const value = computed({
  get() {
    return url.readFilterValue(route, entityType.value, index);
  },
  set(to) {
    //console.log('FilterSearch value set()', to);
    if (value.value) {
      url.updateOrDeleteFilter(entityType.value, index, to);
    } else {
      url.createFilter(entityType.value, filterKey, to);
    }
  }
});

// Methods
function onSubmit() {
  isActive.value = false;
  value.value = searchString.value;
}

function onCancel() {
  isActive.value = false;
  searchString.value = value.value;
}

// Lifecycle
onMounted(() => {
  searchString.value = value.value;
  isActive.value = !value.value;
});
</script>


<style scoped>
/* Minimal scoped styles */
</style>