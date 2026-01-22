<template>
  <div class="find-filters">
    <!-- Time Period Radio Buttons -->
    <div class="filter-section">
      <v-radio-group
        :model-value="filters.since || 'any'"
        @update:model-value="setSince"
        hide-details
        density="compact"
        class="time-radio-group"
      >
        <v-radio
          value="any"
          label="Any time"
          density="compact"
          class="filter-radio"
        />
        <v-radio
          v-for="option in sinceOptions"
          :key="option.value"
          :value="option.value"
          :label="option.label"
          density="compact"
          class="filter-radio"
        />
      </v-radio-group>
    </div>

    <v-divider class="my-4" />

    <!-- Boolean Filters -->
    <div class="filter-section">
      <v-checkbox
        :model-value="filters.is_oa === true"
        @update:model-value="v => setFilter('is_oa', v || undefined)"
        label="Open access"
        density="compact"
        hide-details
        class="filter-checkbox"
      />

      <v-checkbox
        :model-value="filters.has_abstract === true"
        @update:model-value="v => setFilter('has_abstract', v || undefined)"
        label="Has abstract"
        density="compact"
        hide-details
        class="filter-checkbox"
      />

      <!-- Has PDF filter - temporarily disabled
      <v-checkbox
        :model-value="filters.has_pdf === true"
        @update:model-value="v => setFilter('has_pdf', v || undefined)"
        label="Has PDF"
        density="compact"
        hide-details
        class="filter-checkbox"
      />
      -->
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useFindUrl } from '@/composables/useFindUrl';

defineOptions({ name: 'FindFilters' });

const { filters, setFilter } = useFindUrl();

const currentYear = new Date().getFullYear();

const sinceOptions = [
  { label: `Since ${currentYear}`, value: String(currentYear) },
  { label: `Since ${currentYear - 3}`, value: String(currentYear - 3) },
  { label: `Since ${currentYear - 6}`, value: String(currentYear - 6) },
];

function setSince(value) {
  // 'any' means no filter
  if (value === 'any') {
    setFilter('since', undefined);
  } else {
    setFilter('since', value);
  }
}
</script>

<style lang="scss" scoped>
.find-filters {
  padding-top: 4px;
}

.filter-section {
  margin-bottom: 8px;
}

.time-radio-group {
  :deep(.v-selection-control-group) {
    gap: 0;
  }
}

.filter-radio {
  margin-left: -8px;

  :deep(.v-label) {
    font-size: 13px;
    color: #4B5563;
  }

  :deep(.v-selection-control) {
    min-height: 28px;
  }
}

.filter-checkbox {
  margin-left: -8px;

  :deep(.v-label) {
    font-size: 13px;
    color: #4B5563;
  }
}
</style>
