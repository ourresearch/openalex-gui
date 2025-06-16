<template>
  <filter-base :filter-key="filterKey" :index="index">
      <v-chip
          variant="text"
          class="option mr-1 px-4 py-4 mb-1 mt-1 font-weight-regular hover-color-1 text-body-1"
          @click="isActive = true"
          v-if="!isActive"
      >
        "{{ value }}"
        <v-icon end size="small">mdi-pencil</v-icon>
      </v-chip>
      <template v-if="isActive">
        <v-text-field
            v-model="searchString"
            class="rounded-lg"
            density="compact"
            variant="solo-filled"
            flat
            hide-details
            autofocus
            placeholder="Enter search terms"
            :append-icon="searchString && searchString !== value ? 'mdi-check-bold' : undefined"
            @keydown.enter="onSubmit"
            @click:append="onSubmit"
            @blur="onCancel"
            @keydown.esc="onCancel"
        />
      </template>
  </filter-base>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

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


<style scoped lang="scss">
input {
  padding: 0 3px !important;
}
</style>