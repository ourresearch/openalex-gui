<template>
  <span class="oql-sample-directive">
    <span class="oql-directive-prefix">{{ directive.prefix }}</span>

    <v-menu location="bottom">
      <template v-slot:activator="{ props }">
        <span v-bind="props" class="oql-directive-content oql-interactive">
          <template v-for="(segment, index) in directive.segments" :key="index">
            <oql-segment :segment="segment" />
          </template>
          <v-icon size="x-small" class="ml-1">mdi-chevron-down</v-icon>
        </span>
      </template>

      <v-list density="compact">
        <v-list-subheader>Sample size</v-list-subheader>
        <v-list-item
          v-for="size in sampleSizes"
          :key="size"
          @click="handleChange(size)"
        >
          <template #prepend>
            <v-icon v-if="isSelected(size)">mdi-check</v-icon>
            <v-icon v-else>mdi-blank</v-icon>
          </template>
          {{ size }}
        </v-list-item>
        <v-divider />
        <v-list-item @click="handleRemove">
          <template #prepend>
            <v-icon>mdi-close</v-icon>
          </template>
          Remove sample
        </v-list-item>
      </v-list>
    </v-menu>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import OqlSegment from './OqlSegment.vue';

defineOptions({ name: 'OqlSampleDirective' });

const emit = defineEmits(['remove', 'change']);

const props = defineProps({
  directive: {
    type: Object,
    required: true
  }
});

const sampleSizes = [10, 25, 100];

const currentSize = computed(() => props.directive.meta?.n);

function isSelected(size) {
  return currentSize.value === size;
}

function handleChange(size) {
  emit('change', {
    type: 'sample',
    value: size
  });
}

function handleRemove() {
  emit('remove', {
    type: 'sample'
  });
}
</script>

<style lang="scss" scoped>
.oql-sample-directive {
  display: inline;
}

.oql-directive-prefix {
  color: #666;
}

.oql-directive-content {
  display: inline;
}

.oql-interactive {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  margin: 0 -2px;
  border: 1px solid transparent;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    border-color: #ccc;
  }
}
</style>
