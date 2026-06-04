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
      </template>
      <v-btn
        v-if="optionIds.length > 0 && filterKey !== 'collection'"
        icon
        size="small"
        variant="outlined"
        class="ml-1 light-border"
        @click="isActive = true"
      >
        <v-icon size="small" color="black">mdi-plus</v-icon>
      </v-btn>
    </div>

    <v-dialog
      v-model="isActive"
      :fullscreen="smAndDown"
      max-width="600"
      scrollable
    >
      <!-- Shared value picker (entities + inline collections), oxjob #273
           redesign. Writes to the URL itself on Apply and emits close. -->
      <entity-value-picker
        v-if="isActive"
        :filter-key="filterKey"
        :load-entities="loadEntities"
        @close="close"
      />
    </v-dialog>
  </filter-base>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify'

import { url } from '@/url';
import { api } from '@/api';

import FilterSelectOption from '@/components/Filter/FilterSelectOption.vue';
import FilterBase from '@/components/Filter/FilterBase.vue';
import EntityValuePicker from '@/components/Filter/EntityValuePicker.vue';

defineOptions({name: "FilterSelect"})

const {filterKey, index} = defineProps({
  filterKey: String,
  index: Number,
});

const route = useRoute();
const store = useStore();

const { smAndDown } = useDisplay();

const entityType = computed(() => store.getters.entityType);

const isActive = ref(false);

// Applied option IDs (read from the URL; the picker writes there on Apply).
const optionIds = computed(() => url.readFilterOptions(route, entityType.value, index));

// Entity loader for the shared picker: the field's own entity suggestions.
// (Collections are merged in by EntityValuePicker itself.)
const loadEntities = (searchString) =>
  api.getSuggestions(entityType.value, filterKey, searchString, []);

function close() {
  store.state.activeFilterKey = null;
  isActive.value = false;
}

function deleteOption(id) {
  url.deleteFilterOption(entityType.value, index, id);
}
</script>

<style scoped lang="scss">
.light-border {
  border-color: rgba(0, 0, 0, 0.2) !important;
}
</style>
