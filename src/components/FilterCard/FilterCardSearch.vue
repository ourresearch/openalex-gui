<template>
  <v-card rounded>
    <div class="pa-2">
      <v-text-field
          style="width: 100%;"
          rounded
          variant="outlined"
          v-model="searchString"
          hide-details
          @keydown.enter="onSubmit"
          autofocus
      >
      </v-text-field>
    </div>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn variant="text" rounded @click="isActive = false">Cancel</v-btn>
      <v-btn color="primary" rounded @click="onSubmit">Apply</v-btn>
    </v-card-actions>
  </v-card>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { url } from '@/url';

defineOptions({name: "FilterCardSearch"});

const props = defineProps({
  filterKey: String
});

const emit = defineEmits(['close']);

const store = useStore();
const route = useRoute();

const entityType = computed(() => store.getters.entityType);

// Local state
const searchString = ref('');

// Filter index and value
const index = computed(() =>
  url.findFilterIndex(route, entityType.value, props.filterKey)
);

const value = computed({
  get() {
    return url.readFilterValue(route, entityType.value, index.value);
  },
  set(to) {
    console.log('FilterRange value set()', to);
    if (value.value) {
      url.updateOrDeleteFilter(entityType.value, index.value, to);
    } else {
      url.createFilter(entityType.value, props.filterKey, to);
    }
  }
});

// Methods
function onSubmit() {
  emit('close');
  value.value = searchString.value;
}

// Lifecycle
onMounted(() => {
  searchString.value = value.value;
});
</script>


<style scoped lang="scss">

</style>