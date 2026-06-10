<template>
  <v-menu location="bottom end">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        variant="outlined"
        size="small"
        class="mode-btn text-none"
        append-icon="mdi-chevron-down"
      >{{ currentLabel }}</v-btn>
    </template>
    <v-list density="compact" min-width="220">
      <template v-for="opt in options" :key="opt.value">
        <!-- Simple is disabled (with a tooltip explaining why) when the current
             query can't be shown as basic chips. -->
        <v-tooltip
          v-if="opt.value === 'simple' && basicDisabled"
          location="start"
          text="This query is too complex to show as simple chips."
        >
          <template #activator="{ props: tipProps }">
            <div v-bind="tipProps">
              <v-list-item disabled>
                <template #prepend><v-icon>{{ opt.icon }}</v-icon></template>
                <v-list-item-title>{{ opt.label }}</v-list-item-title>
                <v-list-item-subtitle>{{ opt.hint }}</v-list-item-subtitle>
              </v-list-item>
            </div>
          </template>
        </v-tooltip>
        <v-list-item
          v-else
          :active="opt.value === modelValue"
          @click="select(opt.value)"
        >
          <template #prepend><v-icon>{{ opt.icon }}</v-icon></template>
          <v-list-item-title>{{ opt.label }}</v-list-item-title>
          <v-list-item-subtitle>{{ opt.hint }}</v-list-item-subtitle>
          <template #append>
            <v-icon v-if="opt.value === modelValue" size="18">mdi-check</v-icon>
          </template>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({ name: 'SerpModeMenu' });

const props = defineProps({
  // 'simple' | 'old' | 'builder' | 'oql'
  modelValue: { type: String, default: 'simple' },
  // True when the current query can't be represented as basic chips → Simple
  // is greyed out with a tooltip.
  basicDisabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const options = [
  { value: 'simple', label: 'Simple', icon: 'mdi-form-textbox', hint: 'Search + basic filters' },
  { value: 'old', label: 'Old', icon: 'mdi-format-list-bulleted', hint: 'Legacy advanced filters' },
  { value: 'builder', label: 'Builder', icon: 'mdi-format-list-checks', hint: 'No-code query builder' },
  { value: 'oql', label: 'OQL', icon: 'mdi-code-braces', hint: 'Write OQL directly' },
];

const currentLabel = computed(
  () => options.find((o) => o.value === props.modelValue)?.label || 'Simple'
);

function select(value) {
  if (value === props.modelValue) return;
  emit('update:modelValue', value);
}
</script>

<style scoped>
.mode-btn {
  letter-spacing: 0;
}
</style>
