<template>
  <div>
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

        <div class="d-flex" style="height: 30px;">
          <add-filter class="ml-0" style="position: relative; top: 0px;" />
          <v-btn
            @click="clearEverything"
            v-if="filters.length"
            icon
            class="clear-btn ml-3 elevation-0"
            color="white"
          >
            <v-icon size="24">mdi-delete-outline</v-icon>
          </v-btn>
        </div>
      </div>
    </v-card>
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


const isCollapsed = ref(false);
const dialogs = ref({ moreFilters: false });
const activeFilterKey = ref(null);
const searchString = ref('');

const store = useStore();
const route = useRoute();
const { mdAndUp } = useDisplay();

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
  position: relative;
  top: 7px;
  border: 2px solid #fff;
  width: 40px !important;
  height: 40px !important;
}
</style>