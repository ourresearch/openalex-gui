<template>
  <span
    class="oql-group-toggle oql-interactive"
    :class="`oql-group-toggle--${join}`"
    @click="handleToggle"
    title="Click to toggle between AND/OR"
  >{{ displayText }}<v-icon size="x-small" class="toggle-icon">mdi-swap-horizontal</v-icon></span>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({ name: 'OqlGroupToggle' });

const emit = defineEmits(['toggle']);

const props = defineProps({
  join: {
    type: String,
    required: true,
    validator: (val) => ['and', 'or'].includes(val)
  },
  sourcePointer: {
    type: String,
    default: null
  }
});

const displayText = computed(() => {
  return props.join;
});

function handleToggle() {
  const newJoin = props.join === 'and' ? 'or' : 'and';
  emit('toggle', {
    currentJoin: props.join,
    newJoin: newJoin,
    sourcePointer: props.sourcePointer
  });
}
</script>

<style lang="scss" scoped>
.oql-group-toggle {
  color: #666;
  font-weight: 500;
  margin-right: 0.5em;
}

.toggle-icon {
  opacity: 0.5;
  margin-left: 2px;
}

.oql-interactive {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 6px;
  border: 1px solid transparent;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.08);
    border-color: #999;

    .toggle-icon {
      opacity: 1;
    }
  }
}

.oql-group-toggle--or {
  color: #1976d2;
}
</style>
