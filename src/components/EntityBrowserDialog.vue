<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center pa-4 pb-2">
        <span class="text-h6">Browse entities</span>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="$emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <div class="px-4 pb-2">
        <v-text-field
          v-model="searchQuery"
          placeholder="Search entities..."
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-magnify"
          clearable
          autofocus
        />
      </div>

      <v-card-text class="pt-0" style="max-height: 460px;">
        <template v-for="category in filteredCategories" :key="category.id">
          <div class="category-label text-overline text-medium-emphasis mt-3 mb-1">
            {{ category.name }}
          </div>
          <v-list density="compact" class="py-0">
            <v-list-item
              v-for="entity in category.entities"
              :key="entity.name"
              class="rounded-lg"
              @click="select(entity.name)"
            >
              <template #prepend>
                <v-icon size="18" class="mr-3">{{ entity.icon }}</v-icon>
              </template>
              <v-list-item-title class="text-capitalize">{{ entity.displayName }}</v-list-item-title>
              <v-list-item-subtitle class="entity-descr">{{ entity.descr }}</v-list-item-subtitle>
              <template #append>
                <v-icon v-if="currentEntity === entity.name" size="18">mdi-check</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </template>

        <div v-if="filteredCategories.length === 0" class="text-center text-medium-emphasis py-6">
          No entities match "{{ searchQuery }}"
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineOptions({ name: 'EntityBrowserDialog' });

import { ref, computed } from 'vue';
import { entityCategories, getEntitiesForBrowser } from '@/entityConfigs';

const props = defineProps({
  modelValue: Boolean,
  currentEntity: String,
});

const emit = defineEmits(['update:modelValue', 'select']);

const searchQuery = ref('');

const allEntities = computed(() => getEntitiesForBrowser());

const filteredCategories = computed(() => {
  const q = (searchQuery.value || '').toLowerCase().trim();

  return entityCategories
    .map(cat => {
      const entities = allEntities.value.filter(e => {
        if (e.category !== cat.id) return false;
        if (!q) return true;
        return (
          e.displayName.toLowerCase().includes(q) ||
          e.descr.toLowerCase().includes(q)
        );
      });
      return { ...cat, entities };
    })
    .filter(cat => cat.entities.length > 0);
});

function select(name) {
  emit('select', name);
  emit('update:modelValue', false);
  searchQuery.value = '';
}
</script>

<style lang="scss" scoped>
.category-label {
  font-size: 11px;
  letter-spacing: 0.08em;
  padding-left: 4px;
}

.entity-descr {
  font-size: 12px !important;
}
</style>
