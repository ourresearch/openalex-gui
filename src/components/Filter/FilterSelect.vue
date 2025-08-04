<template>
  <filter-base :filter-key="filterKey" :index="index" @add-option="isActive = true">
    <div class="d-flex flex-wrap align-center">
      <template v-for="(id, i) in optionIds" :key="id">
        <filter-select-option
          :filter-value="id"
          :filter-key="filterKey"
          :position="i"
          @delete="deleteOption(id)"
        />
        <span
          v-if="i < optionIds.length-1"
          class="mx-1 mr-2 text-grey"
        >
          or
        </span>
      </template>
    </div>

    <v-dialog
      v-model="isActive"
      :fullscreen="smAndDown"
      max-width="600"
      scrollable
    >
      <v-card class="rounded-o">
        <v-text-field
            v-model="searchString"
            variant="plain"
            rounded
            bg-color="white"
            prepend-inner-icon="mdi-magnify"
            hide-details
            autofocus
            :placeholder="searchStringPlaceholder"
            style=""
            class="add-filter-text-field mr-4 py-3 text-h5 font-weight-regular"
            append-icon="mdi-close"
            @click:append="clickCloseSearch"
        />
        <v-divider/>
        <v-card-text class="pa-0" style="height: 80vh;">
          <filter-select-add-option
              :filter-key="filterKey"
              :filter-index="index"
              :is-open="isActive"
              :search-string="searchString"

              @close="close"
              @add="addOption"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </filter-base>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify'

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


<style scoped lang="scss">
input {
  padding: 0 3px !important;
}
</style>