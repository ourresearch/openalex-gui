<template>
  <span class="oql-group" :class="{ 'oql-group--nested': depth > 0 }">
    <span v-if="node.prefix" class="oql-group-bracket">{{ node.prefix }}</span>

    <span class="oql-group-children">
      <template v-for="(child, index) in node.children" :key="index">
        <oql-expression-node
          :node="child"
          :depth="depth + 1"
          @remove="$emit('remove', $event)"
          @change-operator="$emit('change-operator', $event)"
          @toggle-join="$emit('toggle-join', $event)"
          @add="$emit('add', $event)"
        />

        <!-- Joiner between children (not after last) -->
        <span
          v-if="index < node.children.length - 1"
          class="oql-nested-joiner"
        > {{ node.join }} </span>
      </template>
    </span>

    <span v-if="node.suffix" class="oql-group-bracket">{{ node.suffix }}</span>
  </span>
</template>

<script setup>
import OqlExpressionNode from './OqlExpressionNode.vue';

defineOptions({ name: 'OqlGroupNode' });

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
</script>

<style lang="scss" scoped>
.oql-group {
  display: block;

  &--nested {
    margin-left: 24px;
  }
}

.oql-group-bracket {
  color: #666;
}

.oql-group-children {
  display: block;
}

.oql-group-child {
  display: block;
  line-height: 2;
}
</style>
