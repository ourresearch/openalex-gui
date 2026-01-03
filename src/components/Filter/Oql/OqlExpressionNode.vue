<template>
  <component
    :is="nodeComponent"
    :node="node"
    :depth="depth"
    @remove="$emit('remove', $event)"
    @change-operator="$emit('change-operator', $event)"
    @toggle-join="$emit('toggle-join', $event)"
    @add="$emit('add', $event)"
  />
</template>

<script setup>
import { computed } from 'vue';
import OqlClauseNode from './OqlClauseNode.vue';
import OqlGroupNode from './OqlGroupNode.vue';

defineOptions({ name: 'OqlExpressionNode' });

const emit = defineEmits(['remove', 'change-operator', 'toggle-join', 'add']);

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  depth: {
    type: Number,
    default: 0
  }
});

const nodeComponent = computed(() => {
  if (props.node.type === 'group') {
    return OqlGroupNode;
  }
  return OqlClauseNode;
});
</script>
