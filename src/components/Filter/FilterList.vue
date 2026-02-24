<template>
  <div>
    <!-- Filters View -->
    <template v-if="viewMode === 'filters'">
      <v-card variant="outlined" class="mb-3 filter-list-card bg-white">
        <div class="px-2" v-if="!isCollapsed">
          <div v-if="filters.length === 0" class="mx-5 my-2 pt-2 text-grey">
            No filters applied
          </div>

          <table v-if="mdAndUp" style="width: 100%;">
            <tbody>
              <component
                v-for="(filter, i) in filters"
                :key="i"
                :is="getFilterComponent(filter.type)"
                :filter-key="filter.key"
                :index="i"
                @delete="url.deleteFilter(entityType, filter.key)"
                style="width: 100%;"
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
              style="width: 100%;"
            />
          </div>

        </div>
      </v-card>
    </template>

    <!-- OQL View -->
    <template v-else-if="viewMode === 'oql'">
      <oql-display ref="oqlDisplayRef" class="mb-3" />
    </template>

    <!-- OQO View -->
    <template v-else-if="viewMode === 'oqo'">
      <oqo-display ref="oqoDisplayRef" class="mb-3" />
    </template>

    <!-- Natural Language View -->
    <template v-else-if="viewMode === 'natural-language'">
      <natural-language-input class="mb-3" />
    </template>

    <div class="d-flex mt-0 align-center">
      <add-filter />
      <v-btn
        @click="clearEverything"
        v-if="filters.length"
        variant="text"
        class="ml-3"
      >
        Clear
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="viewMode === 'oql'"
        @click="startOqlEdit"
        variant="text"
      >
        Edit OQL
      </v-btn>
      <v-btn
        v-if="viewMode === 'oqo'"
        @click="startOqoEdit"
        variant="text"
      >
        Edit OQO
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

import { url } from '@/url'

import FilterBoolean from '@/components/Filter/FilterBoolean.vue'
import FilterRange from '@/components/Filter/FilterRange.vue'
import FilterSearch from '@/components/Filter/FilterSearch.vue'
import FilterSelect from '@/components/Filter/FilterSelect.vue'
import AddFilter from '@/components/Filter/AddFilter.vue'
import OqlDisplay from '@/components/Filter/OqlDisplay.vue'
import OqoDisplay from '@/components/Filter/OqoDisplay.vue'
import NaturalLanguageInput from '@/components/Filter/NaturalLanguageInput.vue'

const store = useStore();
const route = useRoute();
const { mdAndUp } = useDisplay();

const oqlDisplayRef = ref(null);
const oqoDisplayRef = ref(null);
const viewMode = computed(() => store.getters.oqlViewMode);

const isCollapsed = ref(false);

function startOqlEdit() {
  oqlDisplayRef.value?.startEditing();
}

function startOqoEdit() {
  oqoDisplayRef.value?.startEditing();
}
const dialogs = ref({ moreFilters: false });
const activeFilterKey = ref(null);
const searchString = ref('');

const filters = computed(() => url.readFilters(route));
const entityType = computed(() => store.getters.entityType);

const filterComponentMap = {
  boolean: FilterBoolean,
  range: FilterRange,
  search: FilterSearch,
  selectEntity: FilterSelect,
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

watch(
  () => [route.query?.filter, route.query?.sort, route.params?.entityType],
  () => {
    store.dispatch('fetchQueryObject', {
      entityType: route.params?.entityType || 'works',
      filter: route.query?.filter,
      sort: route.query?.sort,
    });
  },
  { immediate: true }
);
</script>


<style lang="scss" scoped>
.filter-list-card {
  overflow: visible;
}
.internal-search-field.v-text-field--rounded > .v-input__control > .v-input__slot {
  padding-left: 0 !important;
}
.filter {
  border-radius: 25px !important;
}
table {
  border-top: 1px solid #eee;
  border-collapse: collapse !important;
}
.clear-btn {
  border-color: #ddd !important;
}
</style>