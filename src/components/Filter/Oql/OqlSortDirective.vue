<template>
  <span class="oql-sort-directive">
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
        <v-list-item @click="handleRemove">
          <template #prepend>
            <v-icon>mdi-close</v-icon>
          </template>
          Remove sort
        </v-list-item>
      </v-list>
    </v-menu>
  </span>
</template>

<script setup>
import OqlSegment from './OqlSegment.vue';

defineOptions({ name: 'OqlSortDirective' });

const emit = defineEmits(['remove', 'change']);

const props = defineProps({
  directive: {
    type: Object,
    required: true
  }
});

function handleRemove() {
  emit('remove', {
    type: 'sort',
    columnId: props.directive.meta?.column_id
  });
}
</script>

<style lang="scss" scoped>
.oql-sort-directive {
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
