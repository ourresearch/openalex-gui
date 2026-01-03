<template>
  <span class="oql-clause" :class="`oql-clause--${node.clause_kind}`">
    <template v-for="(segment, index) in node.segments" :key="index">
      <component
        :is="getSegmentComponent(segment.kind)"
        :segment="segment"
        :clause-meta="node.meta"
        :clause-kind="node.clause_kind"
        @remove="handleRemove"
        @change-operator="handleChangeOperator"
      />
    </template>

    <!-- Add button for entity-type clauses -->
    <oql-add-value-button
      v-if="showAddButton"
      :clause-meta="node.meta"
      @add="handleAdd"
    />
  </span>
</template>

<script setup>
import { computed } from 'vue';
import OqlSegment from './OqlSegment.vue';
import OqlValueSegment from './OqlValueSegment.vue';
import OqlColumnSegment from './OqlColumnSegment.vue';
import OqlOperatorSegment from './OqlOperatorSegment.vue';
import OqlAddValueButton from './OqlAddValueButton.vue';

defineOptions({ name: 'OqlClauseNode' });

const emit = defineEmits(['remove', 'change-operator', 'add']);

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

// Show add button for entity-type clauses
const showAddButton = computed(() => {
  return props.node.clause_kind === 'entity';
});

function getSegmentComponent(kind) {
  switch (kind) {
    case 'value':
      return OqlValueSegment;
    case 'column':
      return OqlColumnSegment;
    case 'operator':
      return OqlOperatorSegment;
    default:
      return OqlSegment;
  }
}

function handleRemove(data) {
  emit('remove', data);
}

function handleChangeOperator(data) {
  emit('change-operator', data);
}

function handleAdd(data) {
  emit('add', data);
}
</script>

<style lang="scss" scoped>
.oql-clause {
  display: inline; // Default inline, parent can override
}
</style>
