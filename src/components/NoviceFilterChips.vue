<template>
  <div class="d-flex flex-wrap ga-2">
    <novice-filter-chip
      v-for="config in chipConfigs"
      :key="config.key"
      :chip-config="config"
    />
  </div>
</template>

<script setup>
import NoviceFilterChip from '@/components/NoviceFilterChip.vue';

defineOptions({ name: 'NoviceFilterChips' });

const chipConfigs = [
  { key: 'publication_year', label: 'Year', chipType: 'year' },
  { key: 'type', label: 'Type', chipType: 'type' },
  { key: 'open_access.is_oa', label: 'Open Access', chipType: 'boolean' },
  { key: 'primary_topic.field.id', label: 'Field', chipType: 'entity', entityToSelect: 'fields' },
  { key: 'authorships.author.id', label: 'Author', chipType: 'entity', entityToSelect: 'authors' },
  { key: 'authorships.institutions.lineage', label: 'Institution', chipType: 'entity', entityToSelect: 'institutions' },
  { key: 'primary_location.source.id', label: 'Source', chipType: 'entity', entityToSelect: 'sources' },
];
</script>
