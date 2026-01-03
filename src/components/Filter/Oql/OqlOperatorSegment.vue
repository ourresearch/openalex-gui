<template>
  <v-menu location="bottom">
    <template v-slot:activator="{ props }">
      <span
        v-bind="props"
        class="oql-operator oql-interactive"
      >{{ segment.text }}<v-icon size="x-small" class="ml-1">mdi-chevron-down</v-icon></span>
    </template>

    <v-list density="compact">
      <v-list-item
        v-for="op in validOperators"
        :key="op.value"
        @click="selectOperator(op.value)"
      >
        <template #prepend>
          <v-icon v-if="isSelected(op.value)">mdi-check</v-icon>
          <v-icon v-else>mdi-blank</v-icon>
        </template>
        {{ op.label }}
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({ name: 'OqlOperatorSegment' });

const emit = defineEmits(['change-operator']);

const props = defineProps({
  segment: {
    type: Object,
    required: true
  },
  clauseMeta: {
    type: Object,
    default: null
  },
  clauseKind: {
    type: String,
    default: null
  }
});

// Get valid operators based on clause kind
const validOperators = computed(() => {
  const kind = props.clauseKind;

  if (kind === 'boolean') {
    return [
      { value: 'is', label: 'is' },
      { value: 'is not', label: 'is not' }
    ];
  }

  if (kind === 'comparison') {
    return [
      { value: '=', label: '=' },
      { value: '>=', label: '>=' },
      { value: '<=', label: '<=' },
      { value: '>', label: '>' },
      { value: '<', label: '<' }
    ];
  }

  if (kind === 'text') {
    return [
      { value: 'contains', label: 'contains' },
      { value: 'does not contain', label: 'does not contain' }
    ];
  }

  if (kind === 'entity') {
    return [
      { value: 'is', label: 'is' },
      { value: 'is not', label: 'is not' }
    ];
  }

  if (kind === 'null') {
    return [
      { value: 'is', label: 'is' },
      { value: 'is not', label: 'is not' }
    ];
  }

  // Default/other
  return [
    { value: 'is', label: 'is' },
    { value: 'is not', label: 'is not' }
  ];
});

const currentOperator = computed(() => {
  return props.clauseMeta?.operator || props.segment.text?.trim();
});

function isSelected(opValue) {
  return currentOperator.value === opValue;
}

function selectOperator(opValue) {
  if (opValue !== currentOperator.value) {
    emit('change-operator', {
      columnId: props.clauseMeta?.column_id,
      oldOperator: currentOperator.value,
      newOperator: opValue,
      sourcePointer: props.clauseMeta?.source_pointer
    });
  }
}
</script>

<style lang="scss" scoped>
.oql-operator {
  color: #666;
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
