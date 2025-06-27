<template>
  <v-card rounded>
    <div class="pa-2">
      <v-text-field
        v-model="searchString"
        style="width: 100%;"
        rounded
        variant="outlined"
        hide-details
        autofocus
        @keydown.enter="submit"
      >
      </v-text-field>
    </div>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn variant="text" rounded @click="isActive = false">Cancel</v-btn>
      <v-btn color="primary" rounded @click="submit">Apply</v-btn>
    </v-card-actions>
  </v-card>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { url } from '@/url';

defineOptions({name: "FilterCardRange"});

const props = defineProps({
  filterKey: String
});

const emit = defineEmits(['close']);

const store = useStore();
const route = useRoute();

const entityType = computed(() => store.getters.entityType);

const searchString = ref('');

// Index lookup based on current filter
const index = computed(() =>
  url.findFilterIndex(route, entityType.value, props.filterKey)
);

// Value getter/setter for the filter
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
function submit() {
  console.log('FilterCardRange submit()', searchString.value);
  value.value = searchString.value;
  //emit('close');
}

// Init on mount
onMounted(() => {
  searchString.value = value.value;
});
</script>

<style scoped lang="scss">

</style>